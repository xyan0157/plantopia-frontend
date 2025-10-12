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
                
              </div>
            </div>
          </div>

          <!-- AI Q&A moved to floating widget -->

          <!-- My Plant List -->
          <div class="section-card plant-list">
            <div class="section-title-row">
              <h3>Favourite Plants</h3>
            </div>
            <div v-if="!plantsStore.favouritesLoaded" class="empty-fav">Loading...</div>
            <div v-else-if="favouritePlants.length === 0" class="empty-fav">No favourites yet.</div>
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
          <div v-if="guidesStore.favouritesLoading || !guidesStore.favouritesLoaded" class="empty-fav">Loading...</div>
          <div v-else-if="guideFavs.length === 0" class="empty-fav">No favourites yet.</div>
          <ul v-else class="guide-fav-ul">
            <li
              v-for="key in guideFavs"
              :key="key"
              class="guide-fav-item clickable"
              @click="openFavouriteGuide(key)"
              title="View guide"
            >
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
          <div v-else-if="visibleJournalPlants.length === 0 || journalError" class="empty-fav">No journal yet.</div>
          <div v-else class="journal-scroll" ref="journalScrollRef">
            <div
              v-for="jp in visibleJournalPlants"
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
                  <div class="journal-row" v-if="isJournalStarted(jp.instance_id)">
                  <span class="chip">Started: {{ jp.start_date || '-' }}</span>
                  </div>
                  <div class="journal-row stage-row" v-if="isJournalStarted(jp.instance_id)">
                  <span class="chip" v-if="jp.current_stage">Stage: {{ jp.current_stage }}</span>
                    <button class="btn-danger small" @click.stop="requestDeleteInstance(jp.instance_id)">Delete</button>
                  </div>
                  <div class="journal-row stage-row" v-else>
                    <button class="btn-danger small" @click.stop="requestDeleteInstance(jp.instance_id)">Delete</button>
                  </div>
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
          </div>
        </template>

        <div class="actions" v-else>
          <button class="danger" @click="doLogout">Sign out</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Info Modal (generic) -->
  <!-- Guide Detail Modal (match Guides page layout) -->
  <div v-if="guideModalOpen" class="guide-modal" @click.self="closeGuideModal">
    <div class="guide-modal-dialog" role="dialog" aria-modal="true">
      <div class="guide-modal-header">
        <div class="guide-modal-title">{{ guideModalTitle }}</div>
        <div class="guide-fav-actions">
          <button class="fav-btn" :class="{ active: isFavGuideModal }" @click="toggleFavForModal" aria-label="favourite">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
                :fill="isFavGuideModal ? 'currentColor' : 'none'"
                :stroke="isFavGuideModal ? 'none' : 'currentColor'" stroke-width="2"/>
            </svg>
          </button>
          <button class="guide-modal-close" @click="closeGuideModal" aria-label="Close">&times;</button>
        </div>
      </div>
      <div class="guide-modal-body">
        <div class="markdown-content article" v-html="guideModalContent"></div>
      </div>
    </div>
  </div>
  <!-- Loading Modal -->
  <LoadingModal v-if="loadingModal.show" :message="loadingModal.message" />
  <div v-if="infoOpen" class="info-overlay" @click="closeInfo">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">{{ infoTitle }}</h2>
        <button class="modal-close" @click="closeInfo">&times;</button>
      </div>
      <div class="modal-body">
        <div class="placeholder-text">{{ infoMessage }}</div>
        <div style="text-align:right; margin-top: 8px;">
          <button class="btn-green" @click="closeInfo">OK</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirm Delete Modal for Journal -->
  <div v-if="confirmDeleteOpen" class="info-overlay" @click="confirmDeleteOpen = false">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Confirm</h2>
        <button class="modal-close" @click="confirmDeleteOpen = false">&times;</button>
      </div>
      <div class="modal-body">
        <div class="placeholder-text">Remove this plant from your journal?</div>
        <div style="text-align:right; margin-top: 8px; display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn" @click="confirmDeleteOpen = false">Cancel</button>
          <button class="btn-danger small" @click="confirmDelete()">Delete</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Help Chat Modal -->
  <div v-if="helpChatOpen" class="help-overlay" @click="closeHelpChat">
    <div class="modal-content help-modal" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Help Chat</h2>
        <button class="modal-close" @click="closeHelpChat">&times;</button>
      </div>
      <div class="modal-body">
        <div v-if="chatLoading" class="placeholder-text">Connecting...</div>
        <div v-else class="chat-box">
          <div class="chat-messages">
            <div v-for="(m,i) in chatMessages" :key="'m-'+i" class="msg" :class="m.role">
              <div class="bubble" v-html="renderChat(m.text)"></div>
            </div>
          </div>
          <div class="chat-input-row">
            <input class="chat-input" v-model="chatInput" @keydown.enter.prevent="" placeholder="Type your question..." />
            <button class="btn-green" :disabled="chatInput.trim().length===0" @click="sendChatHandler">Send</button>
          </div>
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
            <div class="tv-track" :class="{ growing }">
              <div class="tv-progress" :style="{ width: progressPercent + '%' }"></div>
            <!-- Removed tick/marker/fill elements to show a clean baseline only -->
            <div
              v-for="(s, i) in timelineStages"
              :key="'card-'+i"
              class="tv-stage-card"
              :class="{ top: i % 2 === 0, bottom: i % 2 === 1, selected: isStageSelected(s.stage_name) }"
              :style="{ left: equalCardPercents[i] + '%' }"
              @click="onSelectStage(s.stage_name)"
            >
              <div class="tv-stage-title">{{ s.stage_name }}</div>
              <div class="tv-stage-range">Day {{ s.start_day }} - {{ s.end_day }}</div>
              <div v-if="s.description" class="tv-stage-desc">{{ s.description }}</div>
          </div>

            </div>
          </div>

          <!-- Section header under the timeline -->
          <div class="timeline-section">
            <div class="timeline-section-title-row">
              <div class="timeline-section-title">Detail & Tip</div>
              <div class="stage-controls">
                <span v-if="growing" class="chip">Day: {{ dayElapsed }}</span>
                <span v-if="growing && currentStageDisplay" class="chip">Stage: {{ currentStageDisplay }}</span>
                <button class="btn-green" :class="{ disabled: growing }" :disabled="growing" @click="startGrowing">{{ growing ? 'In Progress' : 'Start Growing' }}</button>
        </div>
      </div>
            <div class="timeline-section-divider"></div>
            <div class="detail-grid">
              <!-- Instance overview removed as requested -->
              <div class="detail-col">
                <div class="detail-card">
              <div class="detail-card-title-row">
                <div class="detail-card-title">Requirements</div>
                <button
                  v-if="!growing"
                  class="btn-green"
                  @click="toggleChecklist"
                >{{ showChecklist ? 'Hide Checklist' : 'Checklist' }}</button>
                <button
                  v-else
                  class="btn-green"
                  @click="openHelpChat"
                >Help</button>
              </div>
                  <div v-if="reqLoading">Loading...</div>
                  <div v-else-if="reqError" class="empty-fav">{{ reqError }}</div>
                  <div v-else-if="requirements && !showChecklist" class="detail-items">
                    <div v-for="(cat, idx) in requirements.requirements || []" :key="'req-'+idx" class="req-cat">
                      <div class="req-title">{{ cat.category }}</div>
                      <ul class="req-list">
                        <li v-for="(it, j) in (cat.items || [])" :key="'req-it-'+j">{{ it.item }} <span v-if="it.quantity">- {{ it.quantity }}</span></li>
                      </ul>
                    </div>
                  </div>
                  <!-- Checklist view -->
                  <div v-else-if="requirements && showChecklist" class="checklist">
                    <div class="checklist-summary">Completed {{ checklistCompleted }} / {{ checklistTotal }} ({{ checklistPercent }}%)</div>
                    <div v-for="(cat, idx) in requirements.requirements || []" :key="'ck-'+idx" class="ck-cat">
                      <div class="ck-title">{{ cat.category }}</div>
                      <ul class="ck-list">
                        <li v-for="(it, j) in (cat.items || [])" :key="'ck-it-'+j">
                          <label class="ck-item">
                            <input type="checkbox"
                              :checked="isChecklistChecked(keyFor(cat.category, it.item))"
                              @change="onChecklistChange(keyFor(cat.category, it.item), ($event.target as HTMLInputElement).checked)"/>
                            <span>{{ it.item }} <span v-if="it.quantity">- {{ it.quantity }}</span></span>
                          </label>
                        </li>
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
import { computed, onMounted, ref, watch, nextTick } from 'vue'
// import { useRouter } from 'vue-router'
import { ensureGoogleIdentityLoaded, parseJwtCredential } from '@/services/googleIdentity'
import { usePlantsStore } from '@/stores/plants'
import { plantApiService } from '@/services/api'
import PlantDetailModal from '@/views/recommendation/PlantDetailModal.vue'
import type { Plant, ApiUserPlantInstanceSummary } from '@/services/api'
import { useGuidesStore } from '@/stores/guides'
import { renderMarkdown } from '@/services/markdownService'
import LoadingModal from '@/components/LoadingModal.vue'

const auth = useAuthStore()
// const router = useRouter()

const isLoggedIn = computed(() => auth.userIsLoggedIn)
const username = computed(() => auth.userUsername)
// Reactive display name override loaded from localStorage
const displayNameOverride = ref<string>('')
function loadDisplayNameOverride() {
  try {
    const v = localStorage.getItem('profile_display_name') || ''
    displayNameOverride.value = v
  } catch { displayNameOverride.value = '' }
}
// Avatar no longer displayed here
const googleBtnContainer = ref<HTMLDivElement | null>(null)
const showGsiFallback = ref(false)
// Fallback OAuth link removed to force native Google button only

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

const displayName = computed(() => (displayNameOverride.value && displayNameOverride.value.trim())
  ? displayNameOverride.value
  : (username.value || getEmailPrefix() || 'None'))
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
// Track deleted instances during current session to hide them from view
const deletedInstanceIds = ref<Set<number>>(new Set<number>())
const visibleJournalPlants = computed(() => journalPlants.value.filter(jp => !deletedInstanceIds.value.has(Number(jp.instance_id))))
const loadingModal = ref<{ show: boolean; message: string }>({ show: false, message: '' })

async function loadJournalPlantsFromBackend() {
  journalLoading.value = true
  journalError.value = ''
  try {
    const email = userEmail.value
    if (!email) { journalPlants.value = []; return }
    const res = await plantApiService.getUserTrackingPlantsByEmail(email, { active_only: false, page: 1, limit: 50 })
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
// totalDays retained for reference but not used in equal-spacing mode
// Remove unused tracking helpers in equal-spacing mode
const timelineStages = computed<TimelineStage[]>(() => (timelineData.value?.stages || []).slice())
// Removed: currentDay/currentPercent not needed

// inferTotalDays not used in equal-spacing mode

// stageLeftPercent removed; equal spacing is used instead

// Deprecated spacing logic retained for reference but not used anymore (equal spacing now)

// Equal spacing for ticks and cards regardless of day ranges
// ticks removed from UI

const equalCardPercents = computed<number[]>(() => {
  const n = timelineStages.value.length
  if (n === 0) return []
  // center cards between equal ticks
  return timelineStages.value.map((_, i) => ((i + 0.5) / Math.max(1, n)) * 100)
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

// UI flags for started growing and display chips
const growing = ref(false)
const dayElapsed = ref<number>(0)
const currentStageDisplay = ref<string>('')

// Generic info modal (replaces all toasts/alerts)
const infoTitle = ref('')
const infoMessage = ref('')
const infoOpen = ref(false)
function showInfo(title: string, message: string) { infoTitle.value = title; infoMessage.value = message; infoOpen.value = true }
function closeInfo() { infoOpen.value = false }

// Help chat state
const helpChatOpen = ref(false)
const chatId = ref<number | null>(null)
const chatLoading = ref(false)
const chatInput = ref('')
type ChatMsg = { role: 'user' | 'ai'; text: string }
const chatMessages = ref<ChatMsg[]>([])
function closeHelpChat() { helpChatOpen.value = false }

async function sendChatFn() {
  const text = chatInput.value.trim()
  if (!text) return
  const id = chatId.value
  if (!id) { showInfo('No chat', 'Please start the chat first.'); return }
  chatMessages.value.push({ role: 'user', text })
  chatInput.value = ''
  try {
    const res = await plantApiService.sendPlantChatMessage({ chat_id: id, message: text })
    chatMessages.value.push({ role: 'ai', text: res.reply || '...' })
  } catch {
    showInfo('Failed', 'Failed to send message.')
  }
}
const sendChatHandler = () => { void sendChatFn() }

function renderChat(text: string): string {
  // Render markdown to HTML for display in chat bubble
  return renderMarkdown(String(text || ''))
}

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
    // Sync UI from backend so stage/day persist across reopen
    try {
      const ti = detail?.tracking_info
      if (ti) {
        currentStageDisplay.value = String(ti.current_stage || '')
        selectedStage.value = String(ti.current_stage || '')
        dayElapsed.value = Number(ti.days_elapsed || 0)
        growing.value = Boolean(ti.is_active)
      }
    } catch {}
    // Call start-growing with empty body to fetch latest is_active without changing anything
    try {
      const res = await plantApiService.startGrowingInstance(instanceId)
      const isActive = Boolean((res as { is_active?: boolean }).is_active ?? detail?.tracking_info?.is_active)
      growing.value = isActive
    } catch {}
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

// Checklist state and helpers
const showChecklist = ref(false)
function toggleChecklist() { showChecklist.value = !showChecklist.value }
function slugify(s: string): string { return String(s || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') }
function keyFor(category?: string, item?: string): string { return `${slugify(category || '')}::${slugify(item || '')}` }

const checklistCompletedSet = ref<Set<string>>(new Set<string>())
// Read local checklist on demand (currently not auto-used; kept for future)
// function loadChecklistLocal(instanceId: number) {
//   try {
//     const raw = localStorage.getItem(`checklist:completed:${instanceId}`)
//     const arr = raw ? (JSON.parse(raw) as string[]) : []
//     checklistCompletedSet.value = new Set(arr)
//   } catch { checklistCompletedSet.value = new Set() }
// }
function saveChecklistLocal(instanceId: number) {
  try { localStorage.setItem(`checklist:completed:${instanceId}`, JSON.stringify(Array.from(checklistCompletedSet.value))) } catch {}
}

function isChecklistChecked(key: string): boolean { return checklistCompletedSet.value.has(key) }

const checklistTotal = computed(() => {
  const groups = requirements.value?.requirements || []
  return groups.reduce((sum, g) => sum + (Array.isArray(g.items) ? g.items.length : 0), 0)
})
const checklistCompleted = computed(() => checklistCompletedSet.value.size)
const checklistPercent = computed(() => (checklistTotal.value > 0 ? Math.round((checklistCompleted.value / checklistTotal.value) * 100) : 0))

async function onChecklistChange(key: string, checked: boolean) {
  const instanceId = currentInstanceId.value
  if (!instanceId) return
  // optimistic update
  if (checked) checklistCompletedSet.value.add(key); else checklistCompletedSet.value.delete(key)
  saveChecklistLocal(instanceId)
  try {
    const payload: { instance_id: number; checklist_item_key: string; is_completed: boolean } = { instance_id: instanceId, checklist_item_key: key, is_completed: checked }
    const res: Record<string, unknown> = await plantApiService.completeChecklistItem(payload)
    const ps = (res as { progress_summary?: { completed_items?: number; total_items?: number } }).progress_summary
    if (ps && typeof ps.completed_items === 'number' && typeof ps.total_items === 'number') {
      // keep local count close to backend result if needed (no hard sync of keys due to missing API)
    }
  } catch {
    // rollback
    if (checked) checklistCompletedSet.value.delete(key); else checklistCompletedSet.value.add(key)
    saveChecklistLocal(instanceId)
    showInfo('Failed', 'Failed to update checklist. Please try again later.')
  }
}

const selectedStage = ref<string>('')
function isStageSelected(name?: string): boolean {
  if (!growing.value) return false
  return String(selectedStage.value || '') === String(name || '')
}
async function onSelectStage(name?: string) {
  const stage = String(name || '').trim()
  if (!stage) return
  if (!growing.value) { showInfo('Action required', 'Please click Start Growing first.'); return }
  selectedStage.value = stage
  // set day to stage start day
  try {
    const found = (timelineData.value?.stages || []).find(s => String(s.stage_name) === stage)
    if (found && typeof found.start_day === 'number') {
      dayElapsed.value = Number(found.start_day)
    }
  } catch {}
  const instanceId = currentInstanceId.value
  if (!instanceId) { showInfo('No instance', 'No active plant instance.'); return }
  try {
    await plantApiService.updatePlantInstanceProgress(instanceId, { current_stage: stage, align_to_stage_start: true })
    showInfo('Updated', 'Stage updated to ' + stage)
    await refreshInstanceAfterProgress()
  } catch {
    showInfo('Failed', 'Failed to update stage.')
  }
}

const progressPercent = computed(() => {
  if (!growing.value) return 0
  if (dayElapsed.value <= 0) return 0
  const stages = timelineData.value?.stages || []
  if (!stages.length) return 0
  const idx = stages.findIndex(s => String(s.stage_name) === String(selectedStage.value || currentStageDisplay.value))
  if (idx < 0) return 0
  // Equal-spacing: align progress to the center of the current stage card
  const centers = equalCardPercents.value || []
  const centerPct = Number(centers[idx] || 0)
  const isLast = idx === stages.length - 1
  const lastEnd = Number(stages[stages.length - 1]?.end_day || 0)
  const currEnd = Number(stages[idx]?.end_day || lastEnd)
  if (isLast && dayElapsed.value >= currEnd && currEnd > 0) return 100
  return Math.max(0, Math.min(100, centerPct))
})

// Start growing: require checklist >= 80%, then call auto-update-stage
async function startGrowing() {
  const percent = checklistPercent.value
  if (percent < 80) {
    showInfo('Checklist required', 'Please complete at least 80% of the checklist before starting.')
    return
  }
  const instanceId = currentInstanceId.value
  if (!instanceId) { showInfo('No instance', 'No active plant instance.'); return }
  try {
    // Call new API to explicitly start growing with today's date
    const today = new Date()
    const startDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0, 10)
    await plantApiService.startGrowingInstance(instanceId, startDate)
    // Mark as started locally regardless; backend sets is_active=true and resets stage
    showInfo('Started', 'Growth started.')
    try { localStorage.setItem(`journal_started:${instanceId}`, '1') } catch {}
    // Mark last auto-update time to now to ensure next run occurs ~24h later
    try { localStorage.setItem(`auto_update_last:${instanceId}`, String(Date.now())) } catch {}
    growing.value = true
    await refreshInstanceAfterProgress()
    // Ensure daily auto update will run when needed
    await ensureDailyAutoUpdate(instanceId)
  } catch {
    showInfo('Failed', 'Failed to start growing. Please try again later.')
  }
}

// daysFromStart removed (not used)

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
    // Daily auto update check when opening timeline
    await ensureDailyAutoUpdate()
  } catch {
    timelineError.value = 'Failed to load timeline'
  } finally {
    timelineLoading.value = false
  }
}

// After progress update, refresh instance details and sync journal row
async function refreshInstanceAfterProgress() {
  const instanceId = currentInstanceId.value
  if (!instanceId) return
  try {
    const detail = await plantApiService.getPlantInstanceDetails(instanceId) as InstanceDetails
    instanceData.value = detail
    // Sync journal list stage label
    const idx = journalPlants.value.findIndex(x => Number(x.instance_id) === Number(instanceId))
    if (idx >= 0) {
      const st = String(detail?.tracking_info?.current_stage || '')
      if (st) journalPlants.value[idx].current_stage = st
    }
  } catch {}
}

// Ensure auto-update is called at most once per 24h when growing
async function ensureDailyAutoUpdate(instanceIdParam?: number) {
  try {
    const instanceId = Number(instanceIdParam || currentInstanceId.value || 0)
    if (!instanceId || !growing.value) return
    const key = `auto_update_last:${instanceId}`
    const last = Number(localStorage.getItem(key) || '0')
    const now = Date.now()
    const ONE_DAY = 24 * 60 * 60 * 1000
    if (!Number.isFinite(last) || now - last > ONE_DAY) {
      await plantApiService.autoUpdateInstanceStage(instanceId)
      try { localStorage.setItem(key, String(now)) } catch {}
      await refreshInstanceAfterProgress()
    }
  } catch {}
}

function isJournalStarted(instanceId: number): boolean {
  try { return localStorage.getItem(`journal_started:${instanceId}`) === '1' } catch { return false }
}

// Delete/deactivate a plant instance from journal
const confirmDeleteOpen = ref(false)
let pendingDeleteId: number | null = null
function requestDeleteInstance(instanceId: number) {
  pendingDeleteId = Number(instanceId)
  confirmDeleteOpen.value = true
}
async function confirmDelete() {
  const id = pendingDeleteId
  confirmDeleteOpen.value = false
  pendingDeleteId = null
  if (!id) return
  try {
    loadingModal.value = { show: true, message: 'Removing...' }
    console.log('[Journal] delete request', { instance_id: Number(id) })
    const resp = await plantApiService.deletePlantInstance(Number(id))
    console.log('[Journal] delete response', resp)
  } catch (e) {
    console.error('[Journal] delete error', e)
  }
  finally {
    loadingModal.value = { show: false, message: '' }
  }
  // Ensure the just-deleted instance never shows up in current session even if API still returns it briefly
  try { deletedInstanceIds.value.add(Number(id)) } catch {}
  const idx = journalPlants.value.findIndex(x => Number(x.instance_id) === Number(id))
  if (idx >= 0) journalPlants.value.splice(idx, 1)
  // Reload from backend to reflect server state and filters
  await loadJournalPlantsFromBackend()
}

const ensurePlantsLoaded = async () => {
  try { await plantsStore.ensureLoaded() } catch {}
}

onMounted(async () => {
  loadDisplayNameOverride()
  // Load journal plants for logged-in users (by email)
  if (isLoggedIn.value) {
    await loadJournalPlantsFromBackend()
    // Always refresh favourites from API when opening profile
    try { await plantsStore.loadFavouritesFromApi() } catch {}
    try { await guidesStore.syncFavouritesFromServer() } catch {}
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
    // Migrate local favourites to server, then load favourites
    try { await plantsStore.syncLocalFavouritesToServer() } catch {}
    try { await plantsStore.loadFavouritesFromApi() } catch {}
    // Load guide favourites from server for current user with visible loading state
    try {
      ;(guidesStore as unknown as { favouritesLoading?: boolean; favouritesLoaded?: boolean }).favouritesLoading = true
      ;(guidesStore as unknown as { favouritesLoaded?: boolean }).favouritesLoaded = false
      await guidesStore.syncFavouritesFromServer()
    } catch {}
  }
}, { immediate: true })
// Open favourite guide in a simple modal using markdown renderer
const guideModalOpen = ref(false)
const guideModalTitle = ref('')
const guideModalContent = ref('')
const guideModalKey = ref('')
const isFavGuideModal = computed(() => Boolean(guideModalKey.value) && guidesStore.isFavouriteGuide(guideModalKey.value.split('///')[0], guideModalKey.value.split('///')[1]))
async function openFavouriteGuide(key: string) {
  try {
    const [category, filename] = key.split('///')
    guideModalKey.value = key
    guideModalTitle.value = filename || ''
    // Ensure we have content; use store helper which hits API if needed
    const content = await guidesStore.getFileContent(category, filename)
    guideModalContent.value = renderMarkdown(content)
    guideModalOpen.value = true
  } catch {
    guideModalTitle.value = 'Guide'
    guideModalContent.value = 'Failed to load guide.'
    guideModalOpen.value = true
  }
}
function closeGuideModal() { guideModalOpen.value = false }
async function toggleFavForModal() {
  if (!guideModalKey.value) return
  const [category, filename] = guideModalKey.value.split('///')
  await guidesStore.toggleFavouriteGuide(category, filename)
}

// Also refresh journal when other pages signal a change
window.addEventListener('storage', (e: StorageEvent) => {
  if (e.key === 'journal_refresh_at') {
    loadJournalPlantsFromBackend()
  }
  if (e.key === 'favourites_refresh_at') {
    try { plantsStore.loadFavouritesFromApi() } catch {}
    try { guidesStore.syncFavouritesFromServer() } catch {}
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
  // Clear auth state
  auth.userLogout()
  // Clear local persisted identity/profile so other views detect logged-out state
  try {
    localStorage.removeItem('plantopia_user_email')
    localStorage.removeItem('plantopia_user_name')
    localStorage.removeItem('profile_display_name')
    localStorage.removeItem('profile_suburb_id')
    localStorage.removeItem('profile_suburb')
    localStorage.removeItem('profile_experience')
    localStorage.removeItem('profile_garden_type')
    localStorage.removeItem('profile_available_space')
    localStorage.removeItem('profile_climate_goal')
  } catch {}
  // Reset favourites in stores so stars become inactive immediately
  try {
    // plants
    ;(plantsStore as unknown as { favourites: Set<string>; favouritesLoaded?: boolean }).favourites = new Set<string>()
    ;(plantsStore as unknown as { favouritesLoaded?: boolean }).favouritesLoaded = false
    // guides
    ;(guidesStore as unknown as { favourites: Set<string>; favouritesLoaded?: boolean }).favourites = new Set<string>()
    ;(guidesStore as unknown as { favouritesLoaded?: boolean }).favouritesLoaded = false
  } catch {}
  // Broadcast to other tabs/pages to reload favourites and journal state
  try { localStorage.setItem('favourites_refresh_at', String(Date.now())) } catch {}
  try { localStorage.setItem('journal_refresh_at', String(Date.now())) } catch {}
  // Re-render Google button after DOM updates
  showGsiFallback.value = false
  nextTick(() => {
    try {
      const cid = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID
      type GInit = (opts: { client_id: string; callback: (resp: unknown) => void; auto_select: boolean; ux_mode: string }) => void
      type GRender = (el: HTMLElement, opts: { type: string; theme: string; size: string; text: string; shape: string; width: number; logo_alignment: string }) => void
      const google = (window as unknown as { google?: { accounts?: { id?: { initialize?: GInit; renderButton?: GRender } } } }).google
      const idApi = google?.accounts?.id
      if (idApi && idApi.initialize && idApi.renderButton && cid && googleBtnContainer.value) {
        idApi.initialize({ client_id: cid, callback: () => {} , auto_select: false, ux_mode: 'popup' })
        idApi.renderButton(googleBtnContainer.value, {
          type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: 280, logo_alignment: 'left'
        })
      } else {
        showGsiFallback.value = true
      }
    } catch { showGsiFallback.value = true }
  })
}

function startEdit() {
  try {
    const override = localStorage.getItem('profile_display_name')
    editName.value = (override && override.trim()) ? override : (username.value || 'User')
  } catch {
    editName.value = username.value || 'User'
  }
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
  // update UI immediately (page-only refresh of name)
  try {
    if (editName.value && editName.value.trim()) {
      localStorage.setItem('profile_display_name', editName.value.trim())
      loadDisplayNameOverride()
    }
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

// expose helper for template
const openHelpChat = () => {
  const instanceId = currentInstanceId.value
  if (!instanceId) { showInfo('No instance', 'No active plant instance.'); return }
  ;(async () => {
    try {
      const email = userEmail.value
      chatLoading.value = true
      const started = await plantApiService.startPlantChat(instanceId, String(email || ''))
      chatId.value = Number(started.chat_id || 0)
      chatMessages.value = [{ role: 'ai', text: 'Hi! How can I help with your plant today?' }]
      helpChatOpen.value = true
    } catch {
      showInfo('Failed', 'Failed to start help chat.')
    }
    chatLoading.value = false
  })()
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
.guide-fav-item.clickable { cursor:pointer; }
.guide-fav-item.clickable:hover { background:#eef2f7; }

/* Guide modal styles aligned with GuidesView */
.guide-modal { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; padding: 1rem; }
.guide-modal-dialog { width: min(960px, 100%); max-height: 85vh; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.35); display: flex; flex-direction: column; }
.guide-modal-header { display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border-bottom:1px solid #e5e7eb; background:#f9fafb; }
.guide-modal-title { font-weight:700; color:#065f46; }
.guide-fav-actions { display:flex; align-items:center; gap:8px; }
.fav-btn { border:none; background:transparent; line-height:1; cursor:pointer; color:#9ca3af; width:22px; height:22px; display:flex; align-items:center; justify-content:center; }
.fav-btn svg { width:18px; height:18px; }
.fav-btn.active { color:#10b981; }
.guide-modal-close { background: transparent; border: none; font-size: 1.5rem; line-height: 1; cursor: pointer; color: #374151; }
.guide-modal-body { padding: 1rem 1.25rem; overflow:auto; }
.markdown-content h1, .markdown-content h2, .markdown-content h3 { color: #065f46; }
.markdown-content pre { background: #0b1020; color: #e5e7eb; padding: .75rem; border-radius: 8px; overflow: auto; }
.markdown-content code { background: #f3f4f6; padding: .15rem .35rem; border-radius: 4px; }
.article :where(h1,h2,h3){ border-left:4px solid #10b981; padding-left:.5rem; margin-top:1.25rem; }
.article p { line-height:1.8; color:#1f2937; }
.article ul { margin: .5rem 0 .75rem 1.25rem; }
.article li::marker{ color:#10b981; }
.article blockquote { border-left:4px solid #e5e7eb; padding:.25rem .75rem; color:#374151; background:#f9fafb; border-radius:6px; }
.empty-fav { color:#6b7280; font-style:italic; padding:8px 0; }
.journal-scroll { display:grid; grid-auto-flow: column; grid-auto-columns: 260px; gap: 12px; overflow-x: auto; padding-bottom: 4px; scroll-snap-type: x proximity; }
.journal-card { position:relative; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); display:flex; flex-direction:column; transition: transform .2s ease, box-shadow .2s ease; }
.journal-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.12); }
.journal-thumb { height: 180px; background:#e5e7eb; display:flex; align-items:center; justify-content:center; }
.journal-thumb img { width:100%; height:100%; object-fit:cover; }
.journal-meta { position:static; background: transparent; border:none; border-radius:0; padding:10px; display:flex; flex-direction:column; gap:6px; }
.journal-meta { padding-bottom: 52px; }
.journal-name { font-weight:700; color:#065f46; }
.journal-sub { display:flex; flex-direction:column; gap:6px; }
.journal-row { display:flex; align-items:center; gap:6px; }
.journal-row.stage-row { justify-content:space-between; }
.chip { background:#ffffff; border:1px solid #e5e7eb; border-radius:9999px; padding:2px 8px; font-size:12px; color:#374151; }
.btn-danger.small { background:#ef4444; color:#fff; border:none; border-radius:9999px; padding:6px 10px; font-weight:700; cursor:pointer; }
.journal-card .btn-danger.small { position:absolute; right:10px; bottom:10px; }
.btn-danger.small:hover { background:#dc2626; }

/* Timeline visual */
.timeline-visual { display:flex; flex-direction: column; align-items:center; justify-content:flex-start; gap:12px; max-width: 1120px; margin: 0 auto; padding: 0 10px; min-height: 620px; }
.tv-row { display:flex; align-items:center; gap:8px; justify-content:center; margin-bottom: 64px; position: relative; z-index: 3; }
.tv-label { font-weight:800; color:#065f46; }
.tv-value { color:#374151; font-weight:700; }
.tv-track { position:relative; height:10px; background:#eef2f7; border-radius:9999px; overflow:visible; border:1px solid #e5e7eb; margin:260px auto 260px; width: calc(100% - 160px); max-width: 980px; }
.tv-track.growing { background:#d1fae5; border-color:#10b981; }
.tv-progress { position:absolute; left:0; top:0; height:100%; background:#10b981; border-radius:9999px; transition: width .2s ease; }
.tv-fill, .tv-tick, .tv-marker, .tv-end { display: none; }
.tv-stats { display:flex; gap:8px; align-items:center; margin-top: 44px; position: relative; z-index: 3; }
.tv-stage-card { position:absolute; transform: translateX(-50%); width:240px; max-width: 24vw; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.08); padding:12px 14px; z-index:1; min-height: 180px; display:flex; flex-direction:column; gap:6px; cursor:pointer; transition: background-color .2s ease, color .2s ease; }
.tv-stage-card.selected { background:#10b981; color:#ffffff; border-color:#10b981; }
.tv-stage-card.selected .tv-stage-title, .tv-stage-card.selected .tv-stage-range, .tv-stage-card.selected .tv-stage-desc { color:#ffffff; }
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
.timeline-section-title-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.stage-controls { display:flex; align-items:center; gap:8px; }

.detail-grid { display:grid; grid-template-columns: 1fr; gap: 16px; margin-top: 12px; align-items: start; width: 100%; margin-left: 0; margin-right: 0; }
.detail-card { background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:12px; max-width: 1120px; margin: 0 auto; }
.detail-card-title-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
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

/* Green CTA-style button to match grow button */
.btn-green { background:#10b981; color:#ffffff; border:none; border-radius:9999px; padding:8px 14px; font-weight:800; cursor:pointer; box-shadow: 0 6px 14px rgba(16,185,129,0.35); }
.btn-green:hover { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(16,185,129,0.45); }
.btn-green:active { transform: translateY(0); box-shadow: 0 4px 10px rgba(16,185,129,0.35); }
.btn-green.disabled, .btn-green:disabled { background:#a7f3d0; cursor:not-allowed; box-shadow:none; transform:none; }
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
.info-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display:flex; align-items:center; justify-content:center; z-index: 2000; padding: 2rem 1rem; }
.help-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display:flex; align-items:center; justify-content:center; z-index: 2000; padding: 1rem; }
.help-modal { width:min(800px, 98%); }
.chat-box { display:flex; flex-direction:column; gap:8px; }
.chat-messages { max-height: 320px; overflow:auto; display:flex; flex-direction:column; gap:6px; padding:6px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; }
.msg { display:flex; }
.msg.user { justify-content:flex-end; }
.bubble { max-width: 80%; padding:8px 10px; border-radius:12px; background:#ffffff; border:1px solid #e5e7eb; }
.msg.user .bubble { background:#d1fae5; border-color:#10b981; }
.bubble :deep(p) { margin: 0 0 6px 0; }
.bubble :deep(ul), .bubble :deep(ol) { margin: 6px 0 6px 18px; }
.bubble :deep(li) { margin: 2px 0; }
.bubble :deep(code) { background:#f3f4f6; padding:0 4px; border-radius:4px; }
.chat-input-row { display:flex; gap:8px; }
.chat-input { flex:1; border:1px solid #d1d5db; border-radius:8px; padding:8px 10px; }
.modal-content { background:#ffffff; border-radius:16px; width:min(720px, 96%); max-height:90vh; overflow:auto; box-shadow:0 20px 40px rgba(0,0,0,0.15); }
.modal-content.timeline-modal { width:min(1400px, 98%); max-height:none; margin: 2rem auto; }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-bottom:1px solid #e5e7eb; }
.modal-title { font-size:1.25rem; font-weight:800; color:#065f46; }
.modal-close { background:transparent; border:none; font-size:1.5rem; line-height:1; cursor:pointer; color:#374151; }
.modal-body { padding:1rem 1.25rem 1.25rem; }
.modal-body.wide { min-height: 560px; }
</style>
