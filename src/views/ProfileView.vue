<template>
  <div class="profile-container recommendations-bg">
    <div class="profile-card">
      <div class="profile-header" v-if="isLoggedIn">
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
                <button class="btn primary" @click="testTimeline" style="margin-left:8px;">Test Growth Timeline</button>
              </div>
            </div>
          </div>

          <!-- AI Q&A moved to floating widget -->

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
          <div v-else class="journal-scroll" ref="journalScrollRef">
            <div
              v-for="jp in journalPlants"
              :key="jp.instance_id"
              class="journal-card"
              :style="getJournalCardStyle(jp)"
              @click="openJournalTimelineFrom(jp)"
              style="cursor:pointer;"
            >
              <div class="journal-thumb">
                <img :src="getJournalPreviewImage(jp)" :alt="jp.plant_name" />
              </div>
              <div class="journal-meta">
                <div class="journal-name">{{ jp.plant_name }}</div>
                <div class="journal-sub">
                  <span class="chip">Started: {{ jp.start_date || '-' }}</span>
                  <span class="chip" v-if="jp.current_stage">Stage: {{ jp.current_stage }}</span>
                </div>
              </div>
            </div>
          </div>
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

  <!-- Timeline Modal -->
  <div v-if="timelineModalOpen" class="modal-overlay" @click="timelineModalOpen = false">
    <div class="modal-content timeline-modal" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Growth Timeline - {{ timelinePlant?.name || '' }}</h2>
        <button class="modal-close" @click="timelineModalOpen = false">&times;</button>
      </div>
      <div class="modal-body wide">
        <div v-if="timelineLoading" class="empty-fav">Loading timeline...</div>
        <div v-else-if="timelineError" class="empty-fav">{{ timelineError }}</div>
        <div v-else-if="timelineData" class="timeline-visual">
          <!-- Top hero area: mimic image card, but holds the timeline -->
          <div class="timeline-hero">
            <div class="tv-track">
            <div class="tv-fill" :style="{ width: currentPercent + '%' }"></div>
            <div
              v-for="(s, i) in timelineStages"
              :key="'dot-'+i"
              class="tv-tick"
              :style="{ left: (s.start_day / totalDays) * 100 + '%' }"
              :title="s.stage_name + ' (Day ' + s.start_day + ')'"
            ></div>
            <div
              v-for="(s, i) in timelineStages"
              :key="'card-'+i"
              class="tv-stage-card"
              :class="{ top: i % 2 === 0, bottom: i % 2 === 1 }"
              :style="{ left: adjustedStagePercents[i] + '%' }"
            >
              <div class="tv-stage-title">{{ s.stage_name }}</div>
              <div class="tv-stage-range">Day {{ s.start_day }} - {{ s.end_day }}</div>
              <div v-if="s.description" class="tv-stage-desc">{{ s.description }}</div>
            </div>
            <div class="tv-marker" :style="{ left: currentPercent + '%' }" title="Today"></div>
            <div class="tv-end" title="Harvest"></div>
            </div>
          </div>

          <!-- Section header under the timeline -->
          <div class="timeline-section">
            <div class="timeline-section-title">Detail & Tip</div>
            <div class="timeline-section-divider"></div>
            <div class="detail-grid">
              <!-- Instance overview removed as requested -->
              <div class="detail-col">
                <div class="detail-card">
                  <div class="detail-card-title">Requirements</div>
                  <div v-if="reqLoading">Loading...</div>
                  <div v-else-if="reqError" class="empty-fav">{{ reqError }}</div>
                  <div v-else-if="requirements" class="detail-items">
                    <div v-for="(cat, idx) in requirements.requirements || []" :key="'req-'+idx" class="req-cat">
                      <div class="req-title">{{ cat.category }}</div>
                      <ul class="req-list">
                        <li v-for="(it, j) in (cat.items || [])" :key="'req-it-'+j">{{ it.item }} <span v-if="it.quantity">- {{ it.quantity }}</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div class="detail-col">
                <div class="detail-card">
                  <div class="detail-card-title">Setup Instructions</div>
                  <div v-if="insLoading">Loading...</div>
                  <div v-else-if="insError" class="empty-fav">{{ insError }}</div>
                  <ol v-else-if="instructions && Array.isArray(instructions.instructions)" class="ins-list">
                    <li v-for="(st, si) in instructions.instructions" :key="'st-'+si">
                      <div class="ins-step">Step {{ st.step }}: {{ st.title }}</div>
                      <div class="ins-desc">{{ st.description }}</div>
                      <div class="ins-meta" v-if="st.duration">Duration: {{ st.duration }}</div>
                      <ul class="ins-tips" v-if="Array.isArray(st.tips) && st.tips.length"><li v-for="(tp, ti) in st.tips" :key="'tp-'+ti">{{ tp }}</li></ul>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

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
    const email = userEmail.value
    if (!email) { journalPlants.value = []; return }
    const res = await plantApiService.getUserTrackingPlantsByEmail(email, { active_only: true, page: 1, limit: 50 })
    journalPlants.value = Array.isArray(res?.plants) ? res.plants : []
  } catch {
    journalError.value = 'Failed to load journal'
    journalPlants.value = []
  } finally {
    journalLoading.value = false
  }
}

// AI Q&A moved to global widget
// Chat moved to global widget

// generateId removed with chat logic

// removed local chat handlers (handled by AiChatWidget)

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

// Journal preview image (from API summary)
function getJournalPreviewImage(jp: { image_url?: string; plant_name: string; plant_id: number }): string {
  if (jp.image_url) return jp.image_url
  // fallback by category unknown -> placeholder
  return '/placeholder-plant.svg'
}

// Journal card background style (align with All Plants gradient logic)
function getJournalCardStyle(jp: { plant_name: string }): Record<string, string> {
  // very light heuristic based on plant name keywords to pick a palette
  const name = String(jp.plant_name || '').toLowerCase()
  const pick = ((): { bgStart: string; bgEnd: string } => {
    if (name.includes('red') || name.includes('rose')) return { bgStart: '#f87171', bgEnd: '#ef4444' }
    if (name.includes('pink')) return { bgStart: '#f472b6', bgEnd: '#ec4899' }
    if (name.includes('purple') || name.includes('blue')) return { bgStart: '#a78bfa', bgEnd: '#8b5cf6' }
    if (name.includes('yellow')) return { bgStart: '#f59e0b', bgEnd: '#d97706' }
    if (name.includes('orange')) return { bgStart: '#fb923c', bgEnd: '#f97316' }
    if (name.includes('white') || name.includes('snow')) return { bgStart: '#e5e7eb', bgEnd: '#d1d5db' }
    if (name.includes('green')) return { bgStart: '#34d399', bgEnd: '#10b981' }
    return { bgStart: '#e8f6ee', bgEnd: '#bbf7d0' }
  })()
  const background = `linear-gradient(180deg, ${pick.bgStart}33 0%, ${pick.bgEnd}4D 55%, rgba(255,255,255,0.96) 100%)`
  return { background }
}

// Detail modal state (open on favourite click)
const detailPlant = ref<Plant | null>(null)
function openPlantDetail(p: Plant) { detailPlant.value = p }

// Timeline modal for journal item
const timelineModalOpen = ref(false)
const timelineLoading = ref(false)
const timelineError = ref('')
type TimelineStage = { stage_name: string; start_day: number; end_day: number; description?: string }
type TimelineResponse = { plant_id: number; total_days?: number; stages?: TimelineStage[] }
const timelineData = ref<TimelineResponse | null>(null)
const timelinePlant = ref<{ plant_id: number; name: string } | null>(null)
const totalDays = computed(() => Number(timelineData.value?.total_days || 0) || inferTotalDays())
const timelineStages = computed<TimelineStage[]>(() => (timelineData.value?.stages || []).slice())
const currentDay = computed(() => daysFromStart())
const currentPercent = computed(() => {
  const t = Math.max(0, Math.min(100, (currentDay.value / Math.max(1, totalDays.value)) * 100))
  return Number.isFinite(t) ? t : 0
})

function inferTotalDays(): number {
  const stages = timelineData.value?.stages || []
  if (stages.length === 0) return 0
  return stages[stages.length - 1].end_day || 0
}

function stageLeftPercent(s: TimelineStage): number {
  const span = Math.max(0, (s.end_day - s.start_day))
  const midpoint = s.start_day + span / 2
  return (midpoint / Math.max(1, totalDays.value)) * 100
}

// Prevent overlap by enforcing a minimum spacing percentage between stage card midpoints
const adjustedStagePercents = computed<number[]>(() => {
  const base = timelineStages.value.map(s => stageLeftPercent(s))
  if (base.length === 0) return []
  const minGap = 14 // percentage points of track width between card centers
  const result: number[] = []
  for (let i = 0; i < base.length; i++) {
    const prev = i === 0 ? -Infinity : result[i - 1]
    const target = base[i]
    const safe = isFinite(prev) ? Math.max(target, prev + minGap) : target
    result.push(Math.min(100, safe))
  }
  return result
})

// Detail & Tip data loading for the selected instance
const currentInstanceId = ref<number | null>(null)
const instanceLoading = ref(false)
const instanceError = ref('')
type InstanceDetails = {
  instance_id?: number
  plant_details?: { plant_id?: number; plant_name?: string; scientific_name?: string; plant_category?: string }
  tracking_info?: { plant_nickname?: string; start_date?: string; expected_maturity_date?: string; current_stage?: string; days_elapsed?: number; progress_percentage?: number; is_active?: boolean; user_notes?: string; location_details?: string }
  timeline?: { stages?: Array<{ stage_name?: string; start_day?: number; end_day?: number; description?: string }> }
  current_tips?: string[]
}
const instanceData = ref<InstanceDetails | null>(null)

const reqLoading = ref(false)
const reqError = ref('')
type RequirementsResponse = { requirements?: Array<{ category?: string; items?: Array<{ item?: string; quantity?: string; optional?: boolean }> }> }
const requirements = ref<RequirementsResponse | null>(null)

const insLoading = ref(false)
const insError = ref('')
type InstructionsResponse = { instructions?: Array<{ step?: number; title?: string; description?: string; duration?: string; tips?: string[] }> }
const instructions = ref<InstructionsResponse | null>(null)

async function loadDetailAndTips(plantId: number) {
  // Ensure we have instance id; try local list, then backend
  let instanceId = currentInstanceId.value
  if (!instanceId) {
    const found = journalPlants.value.find(p => Number(p.plant_id) === Number(plantId))
    if (found?.instance_id) instanceId = Number(found.instance_id)
  }
  if (!instanceId) {
    try {
      const email = userEmail.value
      if (email) {
        const res = await plantApiService.getUserTrackingPlantsByEmail(email, { active_only: true, page: 1, limit: 50 })
        const found2 = (res?.plants || []).find((p) => Number(p.plant_id) === Number(plantId))
        if (found2?.instance_id) instanceId = Number(found2.instance_id)
      }
    } catch {}
  }

  if (!instanceId) {
    instanceError.value = 'Instance not found for this plant'
    return
  }
  currentInstanceId.value = instanceId
  instanceLoading.value = true
  instanceError.value = ''
  try {
    const detail = await plantApiService.getPlantInstanceDetails(instanceId) as InstanceDetails
    // tips endpoint temporarily removed; rely on detail.current_tips if provided
    instanceData.value = detail
  } catch {
    instanceError.value = 'Failed to load instance details'
  } finally {
    instanceLoading.value = false
  }

  reqLoading.value = true
  reqError.value = ''
  try {
    const r = await plantApiService.getPlantRequirements(plantId) as RequirementsResponse
    requirements.value = r
  } catch {
    reqError.value = 'Failed to load requirements'
  } finally {
    reqLoading.value = false
  }

  insLoading.value = true
  insError.value = ''
  try {
    const ins = await plantApiService.getPlantInstructions(plantId) as InstructionsResponse
    instructions.value = ins
  } catch {
    insError.value = 'Failed to load instructions'
  } finally {
    insLoading.value = false
  }
}

function daysFromStart(): number {
  // Use start_date from journal if available; otherwise approximate by 0
  // For now we do not have instance start here; this keeps UI functional
  return 0
}

async function openJournalTimelineFrom(jp: { plant_id: number; plant_name: string }) {
  timelineModalOpen.value = true
  timelineLoading.value = true
  timelineError.value = ''
  timelineData.value = null
  timelinePlant.value = { plant_id: Number(jp.plant_id), name: jp.plant_name }
  try {
    const data = await plantApiService.getPlantGrowthTimeline(Number(jp.plant_id))
    timelineData.value = data as unknown as TimelineResponse
    // Load detail/tip content after timeline data
    loadDetailAndTips(Number(jp.plant_id))
  } catch {
    timelineError.value = 'Failed to load timeline'
  } finally {
    timelineLoading.value = false
  }
}

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
      // Call backend to create/get user and store user_id
      ;(async () => {
        try {
          auth.userLogin(display, pic)
          // Persist or update user in backend (email required; optional fields included)
          const up = await plantApiService.upsertUserByProfile()
          // Reflect latest info from backend (if provided)
          if (up?.user) {
            if (up.user.name) try { localStorage.setItem('profile_display_name', up.user.name) } catch {}
            if (typeof up.user.suburb_id === 'number') try { localStorage.setItem('profile_suburb_id', String(up.user.suburb_id)) } catch {}
            if (typeof up.user.id === 'number') try { localStorage.setItem('plantopia_user_id', String(up.user.id)) } catch {}
          }
          if (up?.profile) {
            if (up.profile.experience_level) try { localStorage.setItem('profile_experience', up.profile.experience_level) } catch {}
            if (up.profile.garden_type) try { localStorage.setItem('profile_garden_type', up.profile.garden_type) } catch {}
            if (typeof up.profile.available_space_m2 === 'number') try { localStorage.setItem('profile_available_space', String(up.profile.available_space_m2)) } catch {}
            if (up.profile.climate_goals) try { localStorage.setItem('profile_climate_goal', up.profile.climate_goals) } catch {}
          }
          // Map id to name and update local suburb display string
          const sid = Number(localStorage.getItem('profile_suburb_id') || '')
          if (Number.isFinite(sid) && sid > 0) {
            const sname = await plantApiService.getSuburbNameById(sid)
            if (sname) try { localStorage.setItem('profile_suburb', sname) } catch {}
          }
        } catch {}
      })()
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

// Also refresh journal when other pages signal a change
window.addEventListener('storage', (e: StorageEvent) => {
  if (e.key === 'journal_refresh_at') {
    loadJournalPlantsFromBackend()
  }
})

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
  ;(async () => {
    try {
      const up = await plantApiService.upsertUserByProfile()
      if (up?.user) {
        if (up.user.name) try { localStorage.setItem('profile_display_name', up.user.name) } catch {}
        if (typeof up.user.suburb_id === 'number') try { localStorage.setItem('profile_suburb_id', String(up.user.suburb_id)) } catch {}
      }
      if (up?.profile) {
        if (up.profile.experience_level) try { localStorage.setItem('profile_experience', up.profile.experience_level) } catch {}
        if (up.profile.garden_type) try { localStorage.setItem('profile_garden_type', up.profile.garden_type) } catch {}
        if (typeof up.profile.available_space_m2 === 'number') try { localStorage.setItem('profile_available_space', String(up.profile.available_space_m2)) } catch {}
        if (up.profile.climate_goals) try { localStorage.setItem('profile_climate_goal', up.profile.climate_goals) } catch {}
      }
      const sid = Number(localStorage.getItem('profile_suburb_id') || '')
      if (Number.isFinite(sid) && sid > 0) {
        const sname = await plantApiService.getSuburbNameById(sid)
        if (sname) try { localStorage.setItem('profile_suburb', sname) } catch {}
      }
    } catch {}
  })()
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

// Test button handler: call growth timeline API using a sample plant id
async function testTimeline() {
  try {
    // Prefer latest journal plant_id; fallback to favourite or default 1
    let plantId: number | null = null
    try {
      if (journalPlants.value.length === 0) {
        const email = userEmail.value
        if (email) {
          const res = await plantApiService.getUserTrackingPlantsByEmail(email, { active_only: true, page: 1, limit: 10 })
          journalPlants.value = Array.isArray(res?.plants) ? res.plants : []
        }
      }
      plantId = Number(journalPlants.value?.[0]?.plant_id || NaN)
    } catch {}

    if (!Number.isFinite(plantId) || !plantId || plantId <= 0) {
      const fav = favouritePlants.value?.[0]
      plantId = Number((fav as unknown as { databaseId?: number; id?: string })?.databaseId || (fav as unknown as { id?: string })?.id || 1)
    }

    const data = await plantApiService.getPlantGrowthTimeline(plantId as number)
    console.log('[Timeline]', data)
    alert(`Timeline fetched for plant ${plantId}. See console for details.`)
  } catch {
    alert('Failed to fetch growth timeline.')
  }
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
.journal-scroll { display:grid; grid-auto-flow: column; grid-auto-columns: 260px; gap: 12px; overflow-x: auto; padding-bottom: 4px; scroll-snap-type: x proximity; }
.journal-card { position:relative; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); display:flex; flex-direction:column; transition: transform .2s ease, box-shadow .2s ease; }
.journal-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.12); }
.journal-thumb { height: 180px; background:#e5e7eb; display:flex; align-items:center; justify-content:center; }
.journal-thumb img { width:100%; height:100%; object-fit:cover; }
.journal-meta { position:static; background: transparent; border:none; border-radius:0; padding:10px; display:flex; flex-direction:column; gap:6px; }
.journal-name { font-weight:700; color:#065f46; }
.journal-sub { display:flex; flex-wrap:wrap; gap:6px; }
.chip { background:#ffffff; border:1px solid #e5e7eb; border-radius:9999px; padding:2px 8px; font-size:12px; color:#374151; }

/* Timeline visual */
.timeline-visual { display:flex; flex-direction: column; align-items:center; justify-content:flex-start; gap:12px; max-width: 1120px; margin: 0 auto; padding: 0 10px; min-height: 620px; }
.tv-row { display:flex; align-items:center; gap:8px; justify-content:center; margin-bottom: 64px; position: relative; z-index: 3; }
.tv-label { font-weight:800; color:#065f46; }
.tv-value { color:#374151; font-weight:700; }
.tv-track { position:relative; height:10px; background:#eef2f7; border-radius:9999px; overflow:visible; border:1px solid #e5e7eb; margin:260px auto 260px; width: calc(100% - 160px); max-width: 980px; }
.tv-fill { position:absolute; left:0; top:0; height:100%; background:#10b981; }
.tv-tick { position:absolute; top:-4px; width:2px; height:18px; background:#9ca3af; }
.tv-marker { position:absolute; top:-6px; width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-bottom:12px solid #065f46; transform: translateX(-50%); z-index: 2; }
.tv-end { position:absolute; right:0; top:-5px; width:10px; height:10px; border-radius:50%; background:#ef4444; border:2px solid #fff; box-shadow:0 0 0 2px #ef4444; }
.tv-stats { display:flex; gap:8px; align-items:center; margin-top: 44px; position: relative; z-index: 3; }
.tv-stage-card { position:absolute; transform: translateX(-50%); width:240px; max-width: 24vw; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.08); padding:12px 14px; z-index:1; min-height: 180px; display:flex; flex-direction:column; gap:6px; }
.tv-stage-card.top { bottom:40px; }
.tv-stage-card.bottom { top:40px; }
.tv-stage-card.top::after { content:''; position:absolute; left:50%; top:100%; width:2px; height:36px; background:#cbd5e1; transform: translateX(-50%); }
.tv-stage-card.bottom::after { content:''; position:absolute; left:50%; bottom:100%; width:2px; height:36px; background:#cbd5e1; transform: translateX(-50%); }

/* remove grid list below track (cards are on track now) */
.tv-stages { display:none; }
.tv-stage-title { font-weight:800; color:#065f46; margin-bottom:2px; }
.tv-stage-range { color:#374151; font-size:12px; }
.tv-stage-desc { color:#374151; font-size:12px; line-height:1.5; }

/* Hero wrapper similar to Plant detail image card */
.timeline-hero { width:100%; max-width:1120px; background: transparent; border: none; border-radius: 0; padding: 0; position: relative; overflow: visible; min-height: 560px; }

/* Section under timeline */
.timeline-section { width:100%; max-width: 1120px; z-index: 1; margin: 0 auto; }
.timeline-section-title { font-weight:800; color:#111827; font-size:22px; margin-top: 8px; }
.timeline-section-divider { height:1px; background:#e5e7eb; margin-top:8px; }

.detail-grid { display:grid; grid-template-columns: 1fr; gap: 16px; margin-top: 12px; align-items: start; width: 100%; margin-left: 0; margin-right: 0; }
.detail-card { background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:12px; max-width: 1120px; margin: 0 auto; }
.detail-card-title { font-weight:800; color:#065f46; margin-bottom:6px; }
.detail-items { display:grid; gap:6px; }
.detail-item { display:flex; gap:6px; color:#374151; }
.detail-item .k { color:#065f46; font-weight:700; min-width:110px; }
.tips-list, .req-list, .ins-tips { margin:6px 0 0 18px; color:#374151; }
.req-cat { margin-top:6px; }
.req-title { font-weight:700; color:#111827; }
.ins-list { margin:6px 0 0 16px; color:#374151; }
.ins-step { font-weight:700; color:#111827; }
.ins-desc { margin-top:2px; }
.ins-meta { font-size:12px; color:#6b7280; }
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
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display:flex; align-items:flex-start; justify-content:center; z-index: 1000; padding: 2rem 1rem; overflow-y: auto; }
.modal-content { background:#ffffff; border-radius:16px; width:min(720px, 96%); max-height:90vh; overflow:auto; box-shadow:0 20px 40px rgba(0,0,0,0.15); }
.modal-content.timeline-modal { width:min(1400px, 98%); max-height:none; margin: 2rem auto; }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-bottom:1px solid #e5e7eb; }
.modal-title { font-size:1.25rem; font-weight:800; color:#065f46; }
.modal-close { background:transparent; border:none; font-size:1.5rem; line-height:1; cursor:pointer; color:#374151; }
.modal-body { padding:1rem 1.25rem 1.25rem; }
.modal-body.wide { min-height: 560px; }
</style>
