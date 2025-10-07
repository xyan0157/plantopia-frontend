<template>
  <div class="profile-container recommendations-bg">
    <div class="profile-card">
      <div class="profile-header">
        <h1 class="profile-title">Profile</h1>
        <p v-if="isLoggedIn" class="profile-subtitle">Manage your account</p>
      </div>

      <div class="profile-body">
        <div v-if="isLoggedIn" class="profile-sections">
          <!-- User Profile -->
          <div class="section-card profile-info">
            <div class="profile-fields">
              <h3>User Profile</h3>
              <div v-if="!editing">
                <div>Name: {{ displayName }}</div>
                <div>Preferences: {{ preferences || 'None' }}</div>
                <div>Climate Goal: {{ climateGoal || 'None' }}</div>
              </div>
              <div v-else class="edit-grid">
                <label>
                  <span class="label">Name</span>
                  <input class="input" v-model="editName" />
                </label>
                <label>
                  <span class="label">Gardening Preference</span>
                  <select class="select" v-model="editPref">
                    <option v-for="opt in preferenceOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </label>
                <label>
                  <span class="label">Climate Goal</span>
                  <select class="select" v-model="editGoal">
                    <option v-for="opt in climateGoalOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </label>
              </div>
              <div class="edit-actions">
                <button v-if="!editing" class="btn" @click="startEdit">Edit</button>
                <template v-else>
                  <button class="btn primary" @click="saveEdit">Save</button>
                  <button class="btn" @click="cancelEdit">Cancel</button>
                </template>
              </div>
            </div>
        
        
            <div class="profile-avatar">
              <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" />
              <span v-else>{{ (username || 'U').substring(0,1).toUpperCase() }}</span>
            </div>
          </div>

          <!-- My Plant List -->
          <div class="section-card plant-list">
            <div class="section-title-row">
              <h3>My Plant List</h3>
              <input
                class="plant-search-input"
                type="text"
                v-model="plantSearch"
                placeholder="Search favourites..."
              />
            </div>
            <div v-if="previewPlants.length === 0" class="empty-fav">No favourites yet.</div>
            <div v-else>
              <div v-if="filteredPlants.length === 0" class="empty-fav">No results.</div>
              <div
                v-else
                class="plant-scroll"
                tabindex="0"
                ref="plantScrollRef"
                :class="{ dragging: plantDragging }"
                @pointerdown="onPlantPointerDown"
                @pointermove="onPlantPointerMove"
                @pointerup="onPlantPointerUp"
                @pointerleave="onPlantPointerUp"
                @pointercancel="onPlantPointerUp"
              >
                <div v-for="p in filteredPlants" :key="p.id" class="plant-item" @click="!plantDragMoved && openPlant(p)" style="cursor:pointer;">
                  <div class="plant-thumb">
                    <img :src="getPlantPreviewImage(p)" alt="thumb" />
                  </div>
                  <div class="plant-name">{{ p.common_name || p.name || 'Plant' }}</div>
                </div>
              </div>
            </div>
          </div>

        <!-- My Guide List (between My Plant List and Growth Timeline) -->
        <div class="section-card guide-list">
          <div class="section-title-row">
            <h3>My Guide List</h3>
          </div>
          <div v-if="guideFavs.length === 0" class="empty-fav">No favourites yet.</div>
          <ul v-else class="guide-fav-ul">
            <li v-for="key in guideFavs" :key="key" class="guide-fav-item">
              {{ key.split('///')[0] }} / {{ key.split('///')[1] }}
            </li>
          </ul>
        </div>

          <!-- Growth Timeline (no hardcoded data) -->
          <div class="section-card timeline">
            <h3>Growth Timeline</h3>
            <ul class="timeline-list"></ul>
          </div>

          

          
        </div>

        <template v-if="!isLoggedIn">
          <div class="signin-title">Sign in with:</div>
          <div class="idp-list">
            <div ref="googleBtnContainer" class="google-button-host"></div>
          </div>
        </template>

        <div class="actions" v-else>
          <button class="danger" @click="doLogout">Sign out</button>
        </div>
      </div>
    </div>
  </div>
  <PlantDetailModal v-if="selectedPlant" :plant="selectedPlant" @close="selectedPlant = null" />
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ensureGoogleIdentityLoaded, parseJwtCredential } from '@/services/googleIdentity'
import { usePlantsStore } from '@/stores/plants'
import PlantDetailModal from '@/views/recommendation/PlantDetailModal.vue'
import type { Plant } from '@/services/api'
import { useGuidesStore } from '@/stores/guides'

const auth = useAuthStore()
const router = useRouter()

const isLoggedIn = computed(() => auth.userIsLoggedIn)
const username = computed(() => auth.userUsername)
const avatarUrl = computed(() => auth.userAvatarUrl)
const googleBtnContainer = ref<HTMLDivElement | null>(null)

// Demo profile fields; later wire to real user prefs
const preferences = ref('')
const climateGoal = ref('')
const editing = ref(false)
const editName = ref('')
const editPref = ref('')
const editGoal = ref('')

// Select options for profile editing
const preferenceOptions = ['None', 'Balcony', 'Outdoor', 'Indoor']
const climateGoalOptions = ['None', 'Reduce Heat', 'Save Water', 'Increase Green Cover', 'Biodiversity']

function getEmailPrefix(): string {
  try {
    const email = localStorage.getItem('plantopia_user_email') || ''
    return email.includes('@') ? email.split('@')[0] : email
  } catch { return '' }
}

const displayName = computed(() => (username.value || getEmailPrefix() || 'None'))

// Plants store for a small personal list preview (use first items as placeholder)
const plantsStore = usePlantsStore()
// Guides favourites preview
const guidesStore = useGuidesStore()
const guideFavs = computed(() => Array.from(guidesStore.favourites))

const previewPlants = computed(() => {
  const favIds = Array.from(plantsStore.favourites)
  if (favIds.length) {
    const map: Record<string, any> = {}
    plantsStore.plants.forEach(p => { map[String((p as any).id)] = p })
    return favIds.map(id => map[id]).filter(Boolean)
  }
  return [] as any[]
})

// Search within favourites
const plantSearch = ref('')
const filteredPlants = computed(() => {
  const q = plantSearch.value.trim().toLowerCase()
  if (!q) return previewPlants.value
  return previewPlants.value.filter((p: any) => {
    const name = String(p?.common_name || p?.name || '').toLowerCase()
    return name.includes(q)
  })
})

function getPlantPreviewImage(p: any): string {
  // 1) base64 fields
  const b64 = p?.image_base64 || p?.imageData
  if (typeof b64 === 'string' && b64.length) {
    return b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`
  }
  // 2) direct URL
  if (typeof p?.image_url === 'string' && p.image_url) return p.image_url
  // 3) backend proxy via imagePath
  if (typeof p?.imagePath === 'string' && p.imagePath) {
    const base = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL || 'https://budgets-accepting-porcelain-austin.trycloudflare.com'
    return `${base}/api/v1/plant-image/${encodeURIComponent(p.imagePath)}`
  }
  // 4) category placeholder
  const c = String(p?.category || '').toLowerCase()
  if (c === 'flower') return '/Flower.jpg'
  if (c === 'herb') return '/Herb.jpg'
  if (c === 'vegetable') return '/Vegetable.jpg'
  return '/placeholder-plant.svg'
}

const selectedPlant = ref<Plant | null>(null)
function openPlant(p: any) { selectedPlant.value = p as Plant }

const ensurePlantsLoaded = async () => {
  try { await plantsStore.ensureLoaded() } catch {}
}

onMounted(async () => {
  if (isLoggedIn.value) return
  await ensureGoogleIdentityLoaded()
  const cid = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID
  const google = (window as any).google
  if (!google?.accounts?.id || !cid) return
  google.accounts.id.initialize({
    client_id: cid,
    callback: (resp: any) => {
      const info = parseJwtCredential(resp?.credential || '')
      const display = (info.email && String(info.email).split('@')[0]) || info.name || 'Google User'
      const pic = info.picture || ''
      if (info.email) try { localStorage.setItem('plantopia_user_email', String(info.email)) } catch {}
      auth.userLogin(display, pic)
    },
    auto_select: false,
    ux_mode: 'popup',
  })
  if (googleBtnContainer.value) {
    google.accounts.id.renderButton(googleBtnContainer.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 280,
      logo_alignment: 'left',
    })
  }
})

// When user logs in, ensure plants are available for preview
watch(isLoggedIn, async (v) => { if (v) await ensurePlantsLoaded() }, { immediate: true })

// Load saved profile fields
try {
  const savedPref = localStorage.getItem('profile_preferences')
  const savedGoal = localStorage.getItem('profile_climate_goal')
  if (savedPref) preferences.value = savedPref
  if (savedGoal) climateGoal.value = savedGoal
} catch {}

// No fallback prompt button; we only use the official button above

const doLogout = () => {
  auth.userLogout()
}

function startEdit() {
  editName.value = username.value || 'User'
  editPref.value = preferences.value
  editGoal.value = climateGoal.value
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function saveEdit() {
  // Persist to localStorage only for demo; replace with API later
  preferences.value = editPref.value
  climateGoal.value = editGoal.value
  // username is computed from store; we only store a display override locally
  try {
    localStorage.setItem('profile_preferences', preferences.value)
    localStorage.setItem('profile_climate_goal', climateGoal.value)
    localStorage.setItem('profile_display_name', editName.value)
  } catch {}
  editing.value = false
}

// Horizontal drag-to-scroll for My Plant List (match Guides UX)
const plantScrollRef = ref<HTMLElement | null>(null)
const plantDragging = ref(false)
let plantDragStartX = 0
let plantStartScrollLeft = 0
let plantDragMoved = false

function onPlantPointerDown(e: PointerEvent) {
  if (!plantScrollRef.value) return
  plantDragging.value = true
  plantDragMoved = false
  plantDragStartX = e.clientX
  plantStartScrollLeft = plantScrollRef.value.scrollLeft
}

function onPlantPointerMove(e: PointerEvent) {
  if (!plantDragging.value || !plantScrollRef.value) return
  const dx = e.clientX - plantDragStartX
  if (Math.abs(dx) > 3) plantDragMoved = true
  plantScrollRef.value.scrollLeft = plantStartScrollLeft - dx
}

function onPlantPointerUp(e: PointerEvent) {
  if (!plantDragging.value) return
  plantDragging.value = false
}
</script>

<style scoped>
.profile-container { min-height: calc(100vh - 64px); display:grid; place-items:center; padding: 2rem; }
.recommendations-bg::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('@/assets/photo/plant-1.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  z-index: -2;
  pointer-events: none;
}
.section-card { background:#ffffff; border: 1px solid #e5e7eb; border-radius:12px; padding:16px; box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
.profile-sections { display:grid; gap:16px; }
.profile-info { display:grid; grid-template-columns: 1fr 96px; align-items:center; }
.profile-fields { color:#374151; font-size:14px; line-height:1.5; }
.edit-grid { display:grid; gap:8px; margin-top:6px; }
.label { display:block; font-weight:600; color:#065f46; margin-bottom:2px; }
.input { width:100%; border:1px solid #d1d5db; border-radius:8px; padding:8px 10px; font-size:14px; }
.input:focus { outline:none; border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,0.15); }
.select { width:100%; border:1px solid #d1d5db; border-radius:8px; padding:8px 10px; font-size:14px; background:#fff; }
.select:focus { outline:none; border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,0.15); }
.edit-actions { margin-top:8px; display:flex; gap:8px; }
.btn { background:#e5e7eb; color:#111827; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; font-weight:700; }
.btn.primary { background:#10b981; color:#fff; }
.profile-avatar { width:96px; height:96px; border-radius:12px; overflow:hidden; background:#f3f4f6; display:flex; align-items:center; justify-content:center; }
.profile-avatar img { width:100%; height:100%; object-fit:cover; }
.plant-list { overflow: hidden; }
.section-title-row { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px; }
.plant-scroll {
  /* Ensure container never expands parent width */
  width: 100%;
  max-width: 100%;
  min-width: 0;
  /* Horizontal slider layout similar to Guides */
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 260px;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  scroll-snap-type: x proximity;
  cursor: grab;
  /* Hide scrollbars visually */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.plant-scroll.dragging { cursor: grabbing; user-select: none; }
.plant-scroll::-webkit-scrollbar { display: none; height: 0; }
.plant-item { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:12px; text-align:center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); scroll-snap-align: start; }
.plant-thumb { width:100%; height:180px; border-radius:10px; background:#e5e7eb; overflow:hidden; display:flex; align-items:center; justify-content:center; }
.plant-thumb img { width:100%; height:100%; object-fit:cover; }
.plant-name { margin-top:8px; font-weight:800; color:#111827; font-size:16px; line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.plant-search-input { width:260px; max-width: 50%; border:1px solid #d1d5db; border-radius:8px; padding:10px 12px; font-size:14px; }
.plant-search-input:focus { outline:none; border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,0.15); }
.guide-fav-ul { list-style:none; padding:0; margin:0; display:grid; gap:8px; }
.guide-fav-item { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:10px 12px; color:#111827; font-weight:700; font-size:16px; }
.empty-fav { color:#6b7280; font-style:italic; padding:8px 0; }
.timeline { }
.timeline-list { margin:0; padding-left:18px; color:#374151; }
.timeline h3, .plant-list h3, .profile-info h3, .guide-list h3 { margin:0 0 8px 0; color:#065f46; font-size:16px; }
.profile-card { background:#ffffff; border-radius:16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); width:100%; max-width:720px; padding:24px; box-sizing: border-box; }
.profile-header { text-align:center; margin-bottom:16px; }
.profile-title { font-size:24px; font-weight:800; color:#065f46; }
.profile-subtitle { color:#6b7280; font-size:14px; }
.profile-body { padding-top:8px; }
.profile-row { display:flex; align-items:center; gap:16px; }
.avatar { width:64px; height:64px; border-radius:50%; overflow:hidden; box-shadow: 0 0 0 3px #e5e7eb; background:#fff; display:flex; align-items:center; justify-content:center; }
.avatar img { width:100%; height:100%; object-fit:cover; }
.avatar.placeholder { background:#065f46; color:#fff; font-weight:800; font-size:24px; }
.info .name { font-size:18px; font-weight:700; color:#111827; }
.info .status { font-size:13px; color:#6b7280; }
.signin-title { margin-top:20px; font-weight:700; color:#111827; text-align:center; }
.idp-list { margin-top:12px; display:flex; flex-direction:column; align-items:center; gap:12px; }
.google-button-host { display:flex; justify-content:center; }
.idp-icon { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-weight:800; }
.actions { margin-top:20px; display:flex; gap:12px; }
.primary { background:#10b981; color:#fff; border:none; padding:10px 14px; border-radius:8px; cursor:pointer; font-weight:700; }
.primary:hover { background:#059669; }
.secondary { background:#ffffff; color:#374151; border:1px solid #d1d5db; padding:10px 14px; border-radius:8px; cursor:pointer; font-weight:700; }
.secondary:hover { background:#f9fafb; }
.danger { background:#ef4444; color:#fff; border:none; padding:10px 14px; border-radius:8px; cursor:pointer; font-weight:700; }
.danger:hover { background:#dc2626; }
.google-btn-slot { display:inline-block; }
</style>
