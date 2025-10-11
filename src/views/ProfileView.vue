<template>
  <div class="profile-container recommendations-bg">
    <div class="profile-card">
      <div class="profile-header">
        <h1 class="profile-title">Hi {{ displayName }},</h1>
      </div>

      <div class="profile-body">
        <div v-if="isLoggedIn" class="profile-sections">
          <!-- User Profile -->
          <div class="section-card profile-info">
            <div class="profile-fields">
              <h3>User Profile</h3>
              <div>
                <div>Email: {{ userEmail || 'None' }}</div>
                <div>Name: {{ displayName }}</div>
              </div>
              <div class="edit-actions">
                <button class="btn" @click="openEdit">Edit</button>
              </div>
            </div>
          </div>

          <!-- My Plant List -->
          <div class="section-card plant-list">
            <div class="section-title-row">
              <h3>Favourite Plants</h3>
            </div>
            <div v-if="favouritePlants.length === 0" class="empty-fav">No favourites yet.</div>
            <div v-else>
              <div
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
                <div v-for="p in favouritePlants" :key="p.id" class="plant-item" @click="!plantDragMoved && openPlantDetail(p)" style="cursor:pointer;">
                  <div class="plant-thumb">
                    <img :src="getPlantPreviewImage(p)" alt="thumb" />
                  </div>
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

        <!-- Journal Plants (query from backend by email) -->
        <div class="section-card plant-list">
          <div class="section-title-row">
            <h3>Journal Plants</h3>
          </div>
          <div v-if="journalLoading" class="empty-fav">Loading...</div>
          <div v-else-if="journalError" class="empty-fav">{{ journalError }}</div>
          <div v-else-if="journalPlants.length === 0" class="empty-fav">No journal yet.</div>
        </div>
        </div>

        <template v-if="!isLoggedIn">
          <div class="signin-title">Sign in with:</div>
          <div class="idp-list">
            <div ref="googleBtnContainer" class="google-button-host"></div>
            <a v-if="showGsiFallback" :href="oauthLink" class="primary">Continue with Google</a>
          </div>
        </template>

        <div class="actions" v-else>
          <button class="danger" @click="doLogout">Sign out</button>
        </div>
      </div>
    </div>
  </div>
  <!-- Plant Detail Modal -->
  <PlantDetailModal :plant="detailPlant" @close="closeDetailModal" v-if="detailPlant" />

  <!-- Edit Profile Modal -->
  <div v-if="showEdit" class="modal-overlay" @click="closeEdit">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Edit Profile</h2>
        <button class="modal-close" @click="closeEdit">&times;</button>
      </div>
      <div class="modal-body">
        <div class="edit-grid">
          <label>
            <span class="label">Email</span>
            <input class="input" :value="userEmail" disabled />
          </label>
          <label>
            <span class="label">Name</span>
            <input class="input" v-model="editName" />
          </label>
          <label>
            <span class="label">Suburb/Location</span>
            <input class="input" v-model="editSuburb" placeholder="e.g. Richmond" />
          </label>
          <label>
            <span class="label">Experience Level</span>
            <select class="select" v-model="editExperience">
              <option v-for="opt in experienceOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </label>
          <label>
            <span class="label">Garden Type</span>
            <select class="select" v-model="editGardenType">
              <option v-for="opt in gardenTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </label>
          <label>
            <span class="label">Available Space</span>
            <input class="input" v-model="editAvailableSpace" placeholder="e.g. 2 m²" />
          </label>
          <label>
            <span class="label">Climate Goal</span>
            <select class="select" v-model="editGoal">
              <option v-for="opt in climateGoalOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </label>
        </div>
        <div class="edit-actions">
          <button class="btn primary" @click="saveEdit">Save</button>
          <button class="btn" @click="closeEdit">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref, watch } from 'vue'
// import { useRouter } from 'vue-router'
import { ensureGoogleIdentityLoaded, parseJwtCredential } from '@/services/googleIdentity'
import { usePlantsStore } from '@/stores/plants'
import { plantApiService } from '@/services/api'
import PlantDetailModal from '@/views/recommendation/PlantDetailModal.vue'
import type { Plant, ApiUserPlantInstanceSummary } from '@/services/api'
import { useGuidesStore } from '@/stores/guides'

const auth = useAuthStore()
// const router = useRouter()

const isLoggedIn = computed(() => auth.userIsLoggedIn)
const username = computed(() => auth.userUsername)
// Avatar no longer displayed here
const googleBtnContainer = ref<HTMLDivElement | null>(null)
const showGsiFallback = ref(false)
const oauthLink = computed(() => {
  const cid = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID || ''
  // Using OAuth 2.0 implicit-like redirect to Google Accounts consent page
  const origin = window.location.origin
  // Use profile page as redirect target; backend should also accept it if needed
  const redirect = `${origin}/profile`
  const qp = new URLSearchParams({
    client_id: cid,
    redirect_uri: redirect,
    response_type: 'token',
    scope: 'openid email profile',
    include_granted_scopes: 'true',
    state: 'gsi_fallback'
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${qp.toString()}`
})

// Demo profile fields; later wire to real user prefs
const preferences = ref('')
const climateGoal = ref('')
const suburb = ref('')
const experienceLevel = ref('')
const gardenType = ref('')
const availableSpace = ref('')
const editing = ref(false)
const showEdit = ref(false)
const editName = ref('')
const editPref = ref('')
const editGoal = ref('')
const editSuburb = ref('')
const editExperience = ref('')
const editGardenType = ref('')
const editAvailableSpace = ref('')

// Select options for profile editing
// Removed unused preferenceOptions (legacy)
const climateGoalOptions = ['None', 'Reduce Heat', 'Save Water', 'Increase Green Cover', 'Biodiversity']
const experienceOptions = ['Beginner', 'Intermediate', 'Advanced']
const gardenTypeOptions = ['Balcony', 'Outdoor', 'Indoor']

function getEmailPrefix(): string {
  try {
    const email = localStorage.getItem('plantopia_user_email') || ''
    return email.includes('@') ? email.split('@')[0] : email
  } catch { return '' }
}

const displayName = computed(() => (username.value || getEmailPrefix() || 'None'))
const userEmail = computed(() => {
  try { return localStorage.getItem('plantopia_user_email') || '' } catch { return '' }
})

// Plants store for a small personal list preview (use first items as placeholder)
const plantsStore = usePlantsStore()
// Guides favourites preview
const guidesStore = useGuidesStore()
const guideFavs = computed(() => Array.from(guidesStore.favourites))
// Favourite plants (localStorage-based favourites set)
const favouritePlants = computed<Plant[]>(() => {
  const favIds = Array.from(plantsStore.favourites)
  if (!favIds.length) return []
  const map: Record<string, Plant> = {}
  plantsStore.plants.forEach(p => { map[String((p as unknown as { id: string }).id)] = p })
  return favIds.map(id => map[id]).filter(Boolean)
})
// removed mock image

// Journey types and helpers removed from this view; journal now uses backend data only

// Journal plants from backend
const journalPlants = ref<ApiUserPlantInstanceSummary[]>([])
const journalLoading = ref(false)
const journalError = ref('')

async function loadJournalPlantsFromBackend() {
  journalLoading.value = true
  journalError.value = ''
  try {
    const idRaw = localStorage.getItem('plantopia_user_id') || ''
    const userId = parseInt(idRaw, 10)
    if (!Number.isFinite(userId) || userId <= 0) { journalPlants.value = []; return }
    const res = await plantApiService.getUserTrackingPlants(String(userId), { active_only: true })
    journalPlants.value = Array.isArray(res?.plants) ? res.plants : []
  } catch {
    journalError.value = 'Failed to load journal'
    journalPlants.value = []
  } finally {
    journalLoading.value = false
  }
}

function getPlantPreviewImage(p: Plant | Record<string, unknown>): string {
  // 1) base64 fields
  const base64Fields = (p as unknown as { image_base64?: string; imageData?: string })
  const b64 = base64Fields.image_base64 || base64Fields.imageData
  if (typeof b64 === 'string' && b64.length) {
    return b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`
  }
  // 2) direct URL
  const imageUrl = (p as unknown as { image_url?: string }).image_url
  if (typeof imageUrl === 'string' && imageUrl) return imageUrl
  // 3) backend proxy via imagePath
  const imagePath = (p as unknown as { imagePath?: string }).imagePath
  if (typeof imagePath === 'string' && imagePath) {
    const base = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL || 'https://budgets-accepting-porcelain-austin.trycloudflare.com'
    return `${base}/api/v1/plant-image/${encodeURIComponent(imagePath)}`
  }
  // 4) category placeholder
  const c = String(p?.category || '').toLowerCase()
  if (c === 'flower') return '/Flower.jpg'
  if (c === 'herb') return '/Herb.jpg'
  if (c === 'vegetable') return '/Vegetable.jpg'
  return '/placeholder-plant.svg'
}

// Detail modal state (open on favourite click)
const detailPlant = ref<Plant | null>(null)
function openPlantDetail(p: Plant) { detailPlant.value = p }

const ensurePlantsLoaded = async () => {
  try { await plantsStore.ensureLoaded() } catch {}
}

onMounted(async () => {
  // Load journal plants for logged-in users (by email)
  if (isLoggedIn.value) {
    await loadJournalPlantsFromBackend()
    return
  }
  await ensureGoogleIdentityLoaded().catch(() => { showGsiFallback.value = true })
  const cid = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID
  type GoogleInitOptions = { client_id: string; callback: (resp: { credential?: string }) => void; auto_select: boolean; ux_mode: string }
  type GoogleRenderOptions = { type: string; theme: string; size: string; text: string; shape: string; width: number; logo_alignment: string }
  type GoogleIdApi = { initialize: (opts: GoogleInitOptions) => void; renderButton: (el: HTMLElement, opts: GoogleRenderOptions) => void }
  const google = (window as unknown as { google?: { accounts?: { id?: GoogleIdApi } } }).google
  if (!google?.accounts?.id || !cid) { showGsiFallback.value = true; return }
  google?.accounts?.id?.initialize({
    client_id: cid,
    callback: (resp: { credential?: string }) => {
      const info = parseJwtCredential(resp?.credential || '')
      const display = (info.email && String(info.email).split('@')[0]) || info.name || 'Google User'
      const pic = info.picture || ''
      if (info.email) try { localStorage.setItem('plantopia_user_email', String(info.email)) } catch {}
      auth.userLogin(display, pic)
    },
    auto_select: false,
    ux_mode: 'popup',
  })
  try {
    if (googleBtnContainer.value) {
      google?.accounts?.id?.renderButton(googleBtnContainer.value, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 280,
        logo_alignment: 'left',
      })
    }
  } catch {
    showGsiFallback.value = true
  }
})

// When user logs in, ensure plants are available for preview
watch(isLoggedIn, async (v) => {
  if (v) {
    await ensurePlantsLoaded()
    await loadJournalPlantsFromBackend()
  }
}, { immediate: true })

// Load saved profile fields
try {
  const savedPref = localStorage.getItem('profile_preferences')
  const savedGoal = localStorage.getItem('profile_climate_goal')
  const savedSuburb = localStorage.getItem('profile_suburb')
  const savedExp = localStorage.getItem('profile_experience')
  const savedGarden = localStorage.getItem('profile_garden_type')
  const savedSpace = localStorage.getItem('profile_available_space')
  if (savedPref) preferences.value = savedPref
  if (savedGoal) climateGoal.value = savedGoal
  if (savedSuburb) suburb.value = savedSuburb
  if (savedExp) experienceLevel.value = savedExp
  if (savedGarden) gardenType.value = savedGarden
  if (savedSpace) availableSpace.value = savedSpace
} catch {}

// No fallback prompt button; we only use the official button above

const doLogout = () => {
  auth.userLogout()
}

function startEdit() {
  editName.value = username.value || 'User'
  editPref.value = preferences.value
  editGoal.value = climateGoal.value
  editSuburb.value = suburb.value
  editExperience.value = experienceLevel.value
  editGardenType.value = gardenType.value
  editAvailableSpace.value = availableSpace.value
  editing.value = true
  showEdit.value = true
}

function cancelEdit() {
  editing.value = false
  showEdit.value = false
}

function saveEdit() {
  // Persist to localStorage only for demo; replace with API later
  preferences.value = editPref.value
  climateGoal.value = editGoal.value
  suburb.value = editSuburb.value
  experienceLevel.value = editExperience.value
  gardenType.value = editGardenType.value
  availableSpace.value = editAvailableSpace.value
  // username is computed from store; we only store a display override locally
  try {
    localStorage.setItem('profile_preferences', preferences.value)
    localStorage.setItem('profile_climate_goal', climateGoal.value)
    localStorage.setItem('profile_display_name', editName.value)
    localStorage.setItem('profile_suburb', suburb.value)
    localStorage.setItem('profile_experience', experienceLevel.value)
    localStorage.setItem('profile_garden_type', gardenType.value)
    localStorage.setItem('profile_available_space', availableSpace.value)
  } catch {}
  editing.value = false
  showEdit.value = false
}

function openEdit() { startEdit() }
function closeEdit() { cancelEdit() }
// removed legacy closeJournal
function closeDetailModal() { detailPlant.value = null }
// mock open removed

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

function onPlantPointerUp() {
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
.profile-info { display:grid; grid-template-columns: 1fr; align-items:center; }
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
/* avatar removed */
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
.plant-item { background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); scroll-snap-align: start; }
.plant-thumb { width:100%; height:180px; border-radius:10px; background:#e5e7eb; overflow:hidden; display:flex; align-items:center; justify-content:center; }
.plant-thumb img { width:100%; height:100%; object-fit:cover; }
.plant-name { display:none; }
.plant-search-input { width:260px; max-width: 50%; border:1px solid #d1d5db; border-radius:8px; padding:10px 12px; font-size:14px; }
.plant-search-input:focus { outline:none; border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,0.15); }
.guide-fav-ul { list-style:none; padding:0; margin:0; display:grid; gap:8px; }
.guide-fav-item { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:10px 12px; color:#111827; font-weight:700; font-size:16px; }
.empty-fav { color:#6b7280; font-style:italic; padding:8px 0; }
.timeline-list { margin:0; padding-left:18px; color:#374151; }
.timeline h3, .plant-list h3, .profile-info h3, .guide-list h3 { margin:0 0 8px 0; color:#065f46; font-size:16px; }
.journey { display:grid; gap:12px; }
.stages { display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; }
.stage { border:1px solid #e5e7eb; border-radius:12px; padding:10px; text-align:center; background:#f9fafb; }
.stage-actions { display:flex; align-items:center; gap:8px; justify-content:center; }
.badge-btn { background:#ffffff; color:#111827; font-weight:800; font-size:12px; border:1px solid #111827; width:24px; height:24px; border-radius:9999px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
.badge-btn.done { background:#10b981; color:#ffffff; border-color:#10b981; }
.done-label { color:#065f46; font-weight:700; font-size:12px; }
.stage-thumb { height:150px; border-radius:8px; overflow:hidden; background:#eef2f7; display:flex; align-items:center; justify-content:center; }
.stage-thumb img { width:100%; height:100%; object-fit:cover; }
.stage-date { margin:6px 0; color:#374151; font-weight:600; }
.progress-row { display:flex; align-items:center; gap:12px; }
.progress-bar { flex:1; height:16px; background:#eef2f7; border-radius:9999px; overflow:hidden; border:1px solid #e5e7eb; }
.progress-fill { height:100%; background:#10b981; width:0; transition: width .25s ease; }
.progress-text { color:#374151; }
.impact-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; }
.impact-grid.compact { margin-top: 12px; }
.impact-card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#ffffff; }
.impact-title { font-weight:800; color:#065f46; margin-bottom:4px; }
.impact-text { color:#374151; }
.profile-card { background:#ffffff; border-radius:16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); width:100%; max-width:880px; padding:24px; box-sizing: border-box; }
.profile-header { text-align:center; margin-bottom:16px; }
.profile-title { font-size:28px; font-weight:800; color:#065f46; }
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

/* Modal styles reused from other views to keep consistency */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display:flex; align-items:center; justify-content:center; z-index: 1000; padding: 1rem; }
.modal-content { background:#ffffff; border-radius:16px; width:min(720px, 96%); max-height:90vh; overflow:auto; box-shadow:0 20px 40px rgba(0,0,0,0.15); }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-bottom:1px solid #e5e7eb; }
.modal-title { font-size:1.25rem; font-weight:800; color:#065f46; }
.modal-close { background:transparent; border:none; font-size:1.5rem; line-height:1; cursor:pointer; color:#374151; }
.modal-body { padding:1rem 1.25rem 1.25rem; }
</style>
