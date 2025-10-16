<template>
  <div class="profile-container-new recommendations-bg">
    <!-- Not Logged In State -->
    <template v-if="!isLoggedIn">
      <div class="login-wrapper">
        <div class="login-card">
          <h1 class="login-title">Welcome to Your Profile</h1>
          <div class="signin-title">Sign in to continue:</div>
          <div class="idp-list">
            <div ref="googleBtnContainer" class="google-button-host"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Logged In State - Full Width Layout -->
    <div v-else class="profile-layout">
      <!-- Left Sidebar -->
      <aside class="profile-sidebar">
        <!-- User Profile Card -->
        <div class="sidebar-section user-profile-card">
          <div class="user-avatar-circle">
            {{ displayName.charAt(0).toUpperCase() }}
          </div>
          <h2 class="user-name">{{ displayName }}</h2>
          <p class="user-email">{{ userEmail }}</p>
          <button class="btn-edit" @click="openEdit">Edit Profile</button>
        </div>

        <!-- Quick Stats -->
        <div class="sidebar-section quick-stats">
          <h3 class="sidebar-heading">Quick Stats</h3>
          <div class="stat-item">
            <span class="stat-label">Favourite Plants</span>
            <span class="stat-value">{{ favouritePlants.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Journal Plants</span>
            <span class="stat-value">{{ visibleJournalPlants.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Saved Guides</span>
            <span class="stat-value">{{ guideFavs.length }}</span>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="sidebar-section nav-tabs">
          <button
            class="nav-tab"
            :class="{ active: activeTab === 'favourites' }"
            @click="activeTab = 'favourites'"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            Favourites
          </button>
          <button
            class="nav-tab"
            :class="{ active: activeTab === 'journals' }"
            @click="activeTab = 'journals'"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            My Journal
          </button>
          <button
            class="nav-tab"
            :class="{ active: activeTab === 'guides' }"
            @click="activeTab = 'guides'"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            My Guides
          </button>
        </div>

        <!-- Sign Out Button -->
        <div class="sidebar-section sidebar-footer">
          <button class="btn-signout" @click="doLogout">Sign Out</button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="profile-main-content">
        <!-- Favourites Tab -->
        <div v-if="activeTab === 'favourites'" class="content-section">
          <div class="content-header">
            <h1 class="content-title">Favourite Plants</h1>
            <p class="content-subtitle">Plants you've saved from recommendations</p>
          </div>

          <div v-if="!plantsStore.favouritesLoaded" class="empty-state">Loading...</div>
          <div v-else-if="favouritePlants.length === 0" class="empty-state">
            <p>No favourite plants yet.</p>
            <p class="empty-hint">Visit the All Plants or Recommendations page to add some!</p>
          </div>
          <div v-else class="plants-grid">
            <div
              v-for="p in favouritePlants"
              :key="p.id"
              class="plant-card-new"
              @click="openPlantDetail(p)"
            >
              <div class="plant-card-thumb">
                <img :src="getPlantPreviewImage(p)" :alt="p.name" />
              </div>
              <div class="plant-card-info">
                <h3 class="plant-card-name">{{ p.name }}</h3>
                <p class="plant-card-category">{{ p.category }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Journals Tab -->
        <div v-if="activeTab === 'journals'" class="content-section">
          <div class="content-header">
            <h1 class="content-title">My Plant Journal</h1>
            <p class="content-subtitle">Track your growing plants</p>
          </div>

          <div v-if="journalLoading" class="empty-state">Loading...</div>
          <div v-else-if="visibleJournalPlants.length === 0 || journalError" class="empty-state">
            <p>No journal plants yet.</p>
            <p class="empty-hint">Start tracking a plant to see it here!</p>
          </div>
          <div v-else class="plants-grid">
            <div
              v-for="jp in visibleJournalPlants"
              :key="jp.instance_id"
              class="journal-card-new"
              :style="getJournalCardStyle(jp)"
              @click="openJournalDetailView(jp)"
            >
              <div class="plant-card-thumb">
                <img :src="getJournalPreviewImage(jp)" :alt="jp.plant_name" />
              </div>
              <div class="plant-card-info">
                <h3 class="plant-card-name">{{ jp.plant_name }}</h3>
                <div class="journal-badges">
                  <span v-if="jp.start_date" class="badge">{{ jp.start_date }}</span>
                  <span v-if="jp.current_stage" class="badge badge-stage">{{ jp.current_stage }}</span>
                </div>
              </div>
              <button
                class="btn-delete-journal"
                @click.stop="requestDeleteInstance(jp.instance_id)"
                title="Delete"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Guides Tab -->
        <div v-if="activeTab === 'guides'" class="content-section">
          <div class="content-header">
            <h1 class="content-title">My Saved Guides</h1>
            <p class="content-subtitle">Growing guides you've bookmarked</p>
          </div>

          <div v-if="guidesStore.favouritesLoading || !guidesStore.favouritesLoaded" class="empty-state">Loading...</div>
          <div v-else-if="guideFavs.length === 0" class="empty-state">
            <p>No saved guides yet.</p>
            <p class="empty-hint">Visit the Guides page to save some helpful resources!</p>
          </div>
          <ul v-else class="guides-list">
            <li
              v-for="key in guideFavs"
              :key="key"
              class="guide-item-new"
              @click="openFavouriteGuide(key)"
            >
              <div class="guide-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <div class="guide-info">
                <h3 class="guide-title">{{ key.split('///')[1] }}</h3>
                <p class="guide-category">{{ key.split('///')[0] }}</p>
              </div>
              <svg class="guide-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </li>
          </ul>
        </div>
      </main>
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
  <LoadingModal v-if="loadingModal.show" :context="'profile'" />
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

  <!-- Journal Detail Modal (Three-Step Flow) -->
  <div v-if="journalDetailOpen" class="journal-detail-overlay" @click="closeJournalDetailView">
    <div class="journal-detail-modal" @click.stop>
      <!-- Header with close button -->
      <div class="journal-detail-header">
        <div class="journal-detail-title">
          <h2>{{ selectedJournalPlant?.plant_name || 'Plant Journal' }}</h2>
          <p class="journal-detail-subtitle">Track your growing journey</p>
        </div>
        <button class="journal-detail-close" @click="closeJournalDetailView">&times;</button>
      </div>

      <!-- Progress Indicator (Step Navigation) -->
      <div class="step-indicator">
        <div class="step-item" :class="{ active: journalStep === 1, completed: journalStep > 1 }">
          <div class="step-circle">1</div>
          <div class="step-label">Checklist</div>
        </div>
        <div class="step-line" :class="{ filled: journalStep > 1 }"></div>
        <div class="step-item" :class="{ active: journalStep === 2, completed: journalStep > 2 || (journalStep === 3 && setupComplete), locked: !checklistMeetsThreshold }">
          <div class="step-circle">2</div>
          <div class="step-label">Setup</div>
        </div>
        <div class="step-line" :class="{ filled: journalStep > 2 || setupComplete }"></div>
        <div class="step-item" :class="{ active: journalStep === 3, locked: !setupComplete && journalStep < 3 }">
          <div class="step-circle">3</div>
          <div class="step-label">Timeline</div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="journal-detail-body">
        <!-- Step 1: Checklist (80% requirement) -->
        <div v-if="journalStep === 1" class="step-content">
          <div class="step-header">
            <h3>Checklist</h3>
            <p>Complete at least 80% to proceed to setup instructions</p>
          </div>

          <!-- Progress bar -->
          <div class="checklist-progress-section">
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: checklistPercent + '%' }"></div>
            </div>
            <div class="progress-text">{{ checklistCompleted }} / {{ checklistTotal }} items ({{ checklistPercent }}%)</div>
          </div>

          <!-- Loading/Error states -->
          <div v-if="reqLoading" class="step-loading">Loading checklist...</div>
          <div v-else-if="reqError" class="step-error">{{ reqError }}</div>

          <!-- Checklist items by category -->
          <div v-else-if="requirements?.requirements && requirements.requirements.length > 0" class="checklist-categories">
            <div v-for="(cat, idx) in requirements.requirements" :key="'cat-' + idx" class="checklist-category">
              <h4 class="category-title">{{ cat.category || 'Items' }}</h4>
              <div class="checklist-items">
                <label
                  v-for="(item, itemIdx) in (cat.items || [])"
                  :key="'item-' + itemIdx"
                  class="checklist-item"
                >
                  <input
                    type="checkbox"
                    :checked="isChecklistChecked(keyFor(cat.category, item.item))"
                    @change="(e) => onChecklistChange(keyFor(cat.category, item.item), (e.target as HTMLInputElement).checked)"
                  />
                  <div class="checklist-item-content">
                    <span class="checklist-item-name">{{ item.item }}</span>
                    <span v-if="item.quantity" class="checklist-item-quantity">{{ item.quantity }}</span>
                    <span v-if="item.optional" class="checklist-item-optional">(optional)</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div v-else class="step-empty">No checklist items available</div>

          <!-- Navigation buttons -->
          <div class="step-footer">
            <button class="btn-secondary" @click="closeJournalDetailView">Cancel</button>
            <button
              class="btn-primary"
              :disabled="!checklistMeetsThreshold"
              @click="journalStep = 2"
            >
              Begin Setup
              <span v-if="!checklistMeetsThreshold"> ({{ checklistPercent }}% - need 80%)</span>
            </button>
          </div>
        </div>

        <!-- Step 2: Setup Instructions -->
        <div v-if="journalStep === 2" class="step-content">
          <div class="step-header">
            <h3>Setup Instructions</h3>
            <p>Follow these steps to prepare your plant</p>
          </div>

          <!-- Loading/Error states -->
          <div v-if="insLoading" class="step-loading">Loading instructions...</div>
          <div v-else-if="insError" class="step-error">{{ insError }}</div>

          <!-- Instructions list -->
          <div v-else-if="instructions?.instructions && instructions.instructions.length > 0" class="instruction-steps">
            <div v-for="(ins, idx) in instructions.instructions" :key="'ins-' + idx" class="instruction-step">
              <div class="instruction-number">Step {{ ins.step || (idx + 1) }}</div>
              <div class="instruction-content">
                <h4 class="instruction-title">{{ ins.title || 'Step ' + (idx + 1) }}</h4>
                <p class="instruction-description">{{ ins.description || 'No description' }}</p>
                <div v-if="ins.duration" class="instruction-meta">
                  <svg class="instruction-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  <span>{{ ins.duration }}</span>
                </div>
                <div v-if="ins.tips && ins.tips.length > 0" class="instruction-tips">
                  <strong>Tips:</strong>
                  <ul>
                    <li v-for="(tip, tipIdx) in ins.tips" :key="'tip-' + tipIdx">{{ tip }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="step-empty">No setup instructions available</div>

          <!-- Navigation buttons -->
          <div class="step-footer">
            <button class="btn-secondary" @click="journalStep = 1">Back to Checklist</button>
            <button class="btn-primary" @click="markSetupComplete">Mark Setup Complete & Start Growing</button>
          </div>
        </div>

        <!-- Step 3: Vertical Timeline -->
        <div v-if="journalStep === 3" class="step-content">
          <div class="step-header">
            <h3>Growth Timeline</h3>
            <p>Track your plant's progress through each stage</p>
          </div>

          <!-- Current day display -->
          <div class="timeline-current-day">
            <div class="current-day-label">Current Day</div>
            <div class="current-day-number">{{ dayElapsed }}</div>
            <div v-if="currentStageDisplay" class="current-stage-badge">{{ currentStageDisplay }}</div>
          </div>

          <!-- Loading/Error states -->
          <div v-if="timelineLoading" class="step-loading">Loading timeline...</div>
          <div v-else-if="timelineError" class="step-error">{{ timelineError }}</div>

          <!-- Vertical timeline -->
          <div v-else-if="timelineStages.length > 0" class="vertical-timeline">
            <div
              v-for="(stage, idx) in timelineStages"
              :key="'stage-' + idx"
              class="timeline-stage"
              :class="{
                current: isStageSelected(stage.stage_name),
                past: idx < timelineStages.findIndex(s => isStageSelected(s.stage_name)),
                future: idx > timelineStages.findIndex(s => isStageSelected(s.stage_name))
              }"
            >
              <div class="timeline-stage-marker">
                <div class="timeline-dot"></div>
                <div v-if="idx < timelineStages.length - 1" class="timeline-line"></div>
              </div>
              <div class="timeline-stage-content">
                <div class="timeline-stage-header">
                  <h4 class="timeline-stage-name">{{ stage.stage_name }}</h4>
                  <span class="timeline-stage-days">Day {{ stage.start_day }} - {{ stage.end_day }}</span>
                </div>
                <p v-if="stage.description" class="timeline-stage-desc">{{ stage.description }}</p>
              </div>
            </div>
          </div>
          <div v-else class="step-empty">No timeline stages available</div>

          <!-- Tips section -->
          <div v-if="instanceData?.current_tips && instanceData.current_tips.length > 0" class="timeline-tips">
            <h4 class="tips-title">Current Tips</h4>
            <ul class="tips-list">
              <li v-for="(tip, idx) in instanceData.current_tips" :key="'tip-' + idx">{{ tip }}</li>
            </ul>
          </div>

          <!-- Revisit buttons -->
          <div class="revisit-actions">
            <button class="btn-secondary" @click="journalStep = 1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              View Checklist
            </button>
            <button class="btn-secondary" @click="journalStep = 2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <path d="M14 2v6h6"></path>
                <path d="M16 13H8"></path>
                <path d="M16 17H8"></path>
                <path d="M10 9H8"></path>
              </svg>
              View Setup
            </button>
          </div>

          <!-- Navigation button -->
          <div class="step-footer">
            <button class="btn-primary" @click="closeJournalDetailView">Done</button>
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
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const toast = useToast()
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

// Active tab state for sidebar navigation
const activeTab = ref<'favourites' | 'journals' | 'guides'>('journals')

// Journal detail view state (for new 3-step flow)
const journalDetailOpen = ref(false)
const selectedJournalPlant = ref<ApiUserPlantInstanceSummary | null>(null)
const journalStep = ref(1) // 1=Checklist, 2=Setup, 3=Timeline
const setupComplete = ref(false) // Track if setup was marked complete

// Computed: Check if checklist meets 80% threshold
const checklistMeetsThreshold = computed(() => checklistPercent.value >= 80)

async function openJournalDetailView(jp: ApiUserPlantInstanceSummary) {
  selectedJournalPlant.value = jp
  journalDetailOpen.value = true

  // Load all necessary data for the 3-step flow first
  await openJournalTimelineFrom({ plant_id: jp.plant_id, plant_name: jp.plant_name })

  // Use Phase 1 status endpoint to determine which step to show
  const instanceId = jp.instance_id
  try {
    const statusData = await plantApiService.getInstanceStatus(instanceId) as {
      growing_status?: { is_active?: boolean }
      setup_status?: { completed?: boolean }
      checklist_status?: { completion_percentage?: number }
    }

    const isGrowing = Boolean(statusData?.growing_status?.is_active)
    const setupDone = Boolean(statusData?.setup_status?.completed)
    const checklistPct = Number(statusData?.checklist_status?.completion_percentage || 0)

    if (isGrowing) {
      // Already growing, go straight to timeline
      journalStep.value = 3
      setupComplete.value = true
    } else if (setupDone || checklistPct >= 80) {
      // Setup complete or checklist done, go to setup/instructions
      journalStep.value = 2
      setupComplete.value = setupDone
    } else {
      // Start at checklist
      journalStep.value = 1
      setupComplete.value = false
    }
  } catch {
    // Fallback to old logic if status endpoint fails
    const isStarted = isJournalStarted(instanceId)
    const checklistDone = checklistPercent.value >= 80

    if (isStarted) {
      journalStep.value = 3
      setupComplete.value = true
    } else if (checklistDone) {
      journalStep.value = 2
      setupComplete.value = false
    } else {
      journalStep.value = 1
      setupComplete.value = false
    }
  }
}

function closeJournalDetailView() {
  journalDetailOpen.value = false
  selectedJournalPlant.value = null
  journalStep.value = 1
  setupComplete.value = false
}

// Mark setup as complete and start growing
async function markSetupComplete() {
  const instanceId = currentInstanceId.value
  if (!instanceId) {
    toast.error('No instance ID found')
    return
  }

  try {
    // First, mark setup as complete via Phase 1 endpoint
    await plantApiService.completeSetup(instanceId)
    setupComplete.value = true
    toast.success('Setup marked as complete!')
  } catch {
    toast.error('Failed to mark setup as complete')
    return
  }

  // Then call the startGrowing function to activate the plant
  await startGrowing()

  // If successful, move to timeline
  if (growing.value) {
    journalStep.value = 3
  }
}

// Timeline data loading (used by new three-step flow)
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

// Info modal removed - now using toast notifications

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
  if (!id) { toast.warning('Please start the chat first.'); return }
  chatMessages.value.push({ role: 'user', text })
  chatInput.value = ''
  try {
    const res = await plantApiService.sendPlantChatMessage({ chat_id: id, message: text })
    chatMessages.value.push({ role: 'ai', text: res.reply || '...' })
  } catch {
    toast.error('Failed to send message.')
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

  // Only load requirements, instructions, and checklist if NOT actively growing
  // This speeds up loading for plants that are already in the timeline stage
  if (!growing.value) {
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

    // Load checklist state from backend (Phase 1 endpoint)
    // ALWAYS clear the checklist first to ensure we start fresh for this instance
    checklistCompletedSet.value.clear()

    try {
      const checklistData = await plantApiService.getInstanceChecklist(instanceId) as { checklist_items?: Array<{ item_key: string; is_completed: boolean }> }
      if (checklistData?.checklist_items && Array.isArray(checklistData.checklist_items)) {
        // Populate from backend - only for THIS specific instance
        checklistData.checklist_items.forEach((item) => {
          if (item.is_completed && item.item_key) {
            checklistCompletedSet.value.add(String(item.item_key))
          }
        })
        console.log(`[Checklist] Loaded ${checklistCompletedSet.value.size} completed items for instance ${instanceId}`)
      } else {
        console.log(`[Checklist] No checklist items found for instance ${instanceId} - starting fresh`)
      }
    } catch (e) {
      // If backend checklist endpoint fails, checklist remains empty (already cleared above)
      console.warn('[Checklist] Failed to load checklist state from backend:', e)
    }
  } else {
    console.log(`[LoadDetail] Skipping checklist/requirements/instructions for actively growing plant (instance ${instanceId})`)
  }
}

// Checklist state and helpers
function slugify(s: string): string { return String(s || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') }
function keyFor(category?: string, item?: string): string { return `${slugify(category || '')}_${slugify(item || '')}` }

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
    toast.error('Failed to update checklist. Please try again later.')
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
  if (!growing.value) { toast.warning('Please click Start Growing first.'); return }
  selectedStage.value = stage
  // set day to stage start day
  try {
    const found = (timelineData.value?.stages || []).find(s => String(s.stage_name) === stage)
    if (found && typeof found.start_day === 'number') {
      dayElapsed.value = Number(found.start_day)
    }
  } catch {}
  const instanceId = currentInstanceId.value
  if (!instanceId) { toast.error('No active plant instance.'); return }
  try {
    await plantApiService.updatePlantInstanceProgress(instanceId, { current_stage: stage, align_to_stage_start: true })
    toast.success('Stage updated to ' + stage)
    await refreshInstanceAfterProgress()
  } catch {
    toast.error('Failed to update stage.')
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
    toast.warning('Please complete at least 80% of the checklist before starting.')
    return
  }
  const instanceId = currentInstanceId.value
  if (!instanceId) { toast.error('No active plant instance.'); return }

  // Show loading modal immediately
  loadingModal.value = { show: true, message: 'Starting growth...' }

  try {
    // Call new API to explicitly start growing with today's date
    const today = new Date()
    const startDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0, 10)
    await plantApiService.startGrowingInstance(instanceId, startDate)
    // Mark as started locally regardless; backend sets is_active=true and resets stage
    try { localStorage.setItem(`journal_started:${instanceId}`, '1') } catch {}
    // Mark last auto-update time to now to ensure next run occurs ~24h later
    try { localStorage.setItem(`auto_update_last:${instanceId}`, String(Date.now())) } catch {}
    growing.value = true
    await refreshInstanceAfterProgress()
    // Ensure daily auto update will run when needed
    await ensureDailyAutoUpdate(instanceId)
    // Show success message
    toast.success('Growth started successfully!')
  } catch {
    toast.error('Failed to start growing. Please try again later.')
    return
  } finally {
    loadingModal.value = { show: false, message: '' }
  }
}

// daysFromStart removed (not used)

async function openJournalTimelineFrom(jp: { plant_id: number; plant_name: string }) {
  // DON'T open the old timeline modal - the new three-step flow modal is already open
  // timelineModalOpen.value = true  // REMOVED
  timelineLoading.value = true
  // Show blocking loading overlay until timeline + details + requirements + instructions are all loaded
  loadingModal.value = { show: true, message: 'Loading timeline...' }
  timelineError.value = ''
  timelineData.value = null
  timelinePlant.value = { plant_id: Number(jp.plant_id), name: jp.plant_name }
  try {
    const data = await plantApiService.getPlantGrowthTimeline(Number(jp.plant_id))
    timelineData.value = data as unknown as TimelineResponse
    // Load detail/tip content after timeline data
    await loadDetailAndTips(Number(jp.plant_id))
    // Daily auto update check when opening timeline
    await ensureDailyAutoUpdate()
  } catch {
    timelineError.value = 'Failed to load timeline'
  } finally {
    timelineLoading.value = false
    loadingModal.value = { show: false, message: '' }
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
    toast.success('Plant removed from journal successfully!')
  } catch (e) {
    console.error('[Journal] delete error', e)
    toast.error('Failed to remove plant from journal')
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

  // TESTING MODE: Auto-login with test email for UI development
  const TESTING_MODE = false
  const TEST_EMAIL = 'pbav0003@student.monash.edu'

  if (TESTING_MODE && !isLoggedIn.value) {
    // Auto-login with test email
    try {
      localStorage.setItem('plantopia_user_email', TEST_EMAIL)
      localStorage.setItem('plantopia_user_logged_in', 'true')
      localStorage.setItem('plantopia_user_name', 'Test User')
      auth.userLogin('Test User', '', undefined)
    } catch {}
  }

  // Load journal plants for logged-in users (by email)
  if (isLoggedIn.value) {
    await loadJournalPlantsFromBackend()
    // Always refresh favourites from API when opening profile
    try { await plantsStore.loadFavouritesFromApi() } catch {}
    try { await guidesStore.syncFavouritesFromServer() } catch {}

    // Check if we should auto-open a journal detail view (from "I want to grow this plant")
    try {
      const pendingInstanceId = localStorage.getItem('pending_journal_open_instance_id')
      const pendingPlantId = localStorage.getItem('pending_journal_open_plant_id')
      if (pendingInstanceId && pendingPlantId) {
        // Clear the pending flags
        localStorage.removeItem('pending_journal_open_instance_id')
        localStorage.removeItem('pending_journal_open_plant_id')

        // Find the plant in the journal list
        const instanceId = Number(pendingInstanceId)
        const plantId = Number(pendingPlantId)
        const plant = journalPlants.value.find(p => Number(p.instance_id) === instanceId || Number(p.plant_id) === plantId)

        if (plant) {
          // Wait a moment for the UI to settle, then open the journal detail view
          setTimeout(() => {
            openJournalDetailView(plant)
          }, 500)
        }
      }
    } catch {}

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
  toast.success('Profile updated successfully!')
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
  if (!instanceId) { toast.error('No active plant instance.'); return }
  ;(async () => {
    try {
      const email = userEmail.value
      chatLoading.value = true
      const started = await plantApiService.startPlantChat(instanceId, String(email || ''))
      chatId.value = Number(started.chat_id || 0)
      chatMessages.value = [{ role: 'ai', text: 'Hi! How can I help with your plant today?' }]
      helpChatOpen.value = true
    } catch {
      toast.error('Failed to start help chat.')
    }
    chatLoading.value = false
  })()
}
</script>

<style scoped>
/* ====================
   NEW FULL-WIDTH LAYOUT
   ==================== */

.profile-container-new {
  min-height: calc(100vh - 64px);
  width: 100%;
  position: relative;
}

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
  opacity: 0.4;
}

/* Login State */
.login-wrapper {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  padding: 3rem 2.5rem;
  max-width: 480px;
  width: 100%;
  text-align: center;
}

.login-title {
  font-size: 28px;
  font-weight: 800;
  color: #065f46;
  margin-bottom: 1.5rem;
}

/* Profile Layout - Sidebar + Main */
.profile-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: calc(100vh - 64px);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

/* ====================
   SIDEBAR
   ==================== */

.profile-sidebar {
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
}

.sidebar-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.25rem;
}

/* User Profile Card */
.user-profile-card {
  text-align: center;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1px solid #10b981;
}

.user-avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #065f46;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 800;
  margin: 0 auto 1rem;
  box-shadow: 0 4px 12px rgba(6, 95, 70, 0.3);
}

.user-name {
  font-size: 20px;
  font-weight: 800;
  color: #065f46;
  margin: 0 0 0.25rem;
}

.user-email {
  font-size: 13px;
  color: #059669;
  margin: 0 0 1rem;
  word-break: break-word;
}

.btn-edit {
  background: #ffffff;
  color: #10b981;
  border: 2px solid #10b981;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: #10b981;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Quick Stats */
.quick-stats {
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.sidebar-heading {
  font-size: 14px;
  font-weight: 800;
  color: #065f46;
  margin: 0 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 800;
  color: #10b981;
}

/* Navigation Tabs */
.nav-tabs {
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-tab {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.nav-tab:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

.nav-tab.active {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Sidebar Footer */
.sidebar-footer {
  margin-top: auto;
  background: transparent;
  padding: 0;
}

.btn-signout {
  background: #ffffff;
  color: #ef4444;
  border: 2px solid #ef4444;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
}

.btn-signout:hover {
  background: #ef4444;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* ====================
   MAIN CONTENT AREA
   ==================== */

.profile-main-content {
  padding: 2rem 3rem;
  overflow-y: auto;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.content-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.content-header {
  margin-bottom: 2rem;
}

.content-title {
  font-size: 32px;
  font-weight: 800;
  color: #065f46;
  margin: 0 0 0.5rem;
}

.content-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
  font-size: 16px;
}

.empty-hint {
  margin-top: 0.5rem;
  font-size: 14px;
  color: #9ca3af;
}

/* Plants Grid */
.plants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.plant-card-new,
.journal-card-new {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
}

.plant-card-new:hover,
.journal-card-new:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  border-color: #10b981;
}

.plant-card-thumb {
  height: 200px;
  background: #f3f4f6;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plant-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plant-card-info {
  padding: 1rem;
}

.plant-card-name {
  font-size: 18px;
  font-weight: 700;
  color: #065f46;
  margin: 0 0 0.25rem;
}

.plant-card-category {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  text-transform: capitalize;
}

/* Journal Card Specific */
.journal-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.badge {
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 12px;
  padding: 0.25rem 0.75rem;
  font-size: 12px;
  font-weight: 600;
}

.badge-stage {
  background: #d1fae5;
  color: #065f46;
}

.btn-delete-journal {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(239, 68, 68, 0.9);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.journal-card-new:hover .btn-delete-journal {
  opacity: 1;
}

.btn-delete-journal:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.btn-delete-journal svg {
  width: 18px;
  height: 18px;
}

/* Guides List */
.guides-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.guide-item-new {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.guide-item-new:hover {
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateX(4px);
}

.guide-icon {
  width: 48px;
  height: 48px;
  background: #d1fae5;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guide-icon svg {
  width: 24px;
  height: 24px;
  color: #065f46;
  stroke-width: 2;
}

.guide-info {
  flex: 1;
  min-width: 0;
}

.guide-title {
  font-size: 16px;
  font-weight: 700;
  color: #065f46;
  margin: 0 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.guide-category {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  text-transform: capitalize;
}

.guide-arrow {
  width: 20px;
  height: 20px;
  color: #d1d5db;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.guide-item-new:hover .guide-arrow {
  color: #10b981;
  transform: translateX(4px);
}

/* ====================
   JOURNAL DETAIL MODAL (THREE-STEP FLOW)
   ==================== */

.journal-detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: fadeIn 0.2s ease-in-out;
}

.journal-detail-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.journal-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2.5rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.journal-detail-title h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
}

.journal-detail-subtitle {
  margin: 0.25rem 0 0;
  font-size: 14px;
  color: #6b7280;
}

.journal-detail-close {
  background: #f3f4f6;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 28px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.journal-detail-close:hover {
  background: #e5e7eb;
  color: #374151;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 2.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  line-height: 1;
  transition: all 0.3s ease;
}

.step-item.active .step-circle {
  background: #10b981;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.step-item.completed .step-circle {
  background: #059669;
  color: white;
}

.step-item.locked .step-circle {
  background: #f3f4f6;
  color: #d1d5db;
}

.step-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
}

.step-item.active .step-label {
  color: #10b981;
}

.step-item.completed .step-label {
  color: #059669;
}

.step-item.locked .step-label {
  color: #d1d5db;
}

.step-line {
  width: 80px;
  height: 3px;
  background: #e5e7eb;
  margin: 0 0.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
}

.step-line.filled {
  background: #10b981;
}

/* Body */
.journal-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 2.5rem;
}

.step-content {
  animation: fadeIn 0.3s ease-in-out;
}

.step-header {
  margin-bottom: 2rem;
}

.step-header h3 {
  margin: 0 0 0.5rem;
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.step-header p {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
}

/* Loading/Error states */
.step-loading,
.step-error,
.step-empty {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
  font-size: 15px;
}

.step-error {
  color: #dc2626;
}

/* Checklist Progress */
.checklist-progress-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.progress-bar-container {
  width: 100%;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  transition: width 0.4s ease;
  border-radius: 6px;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

/* Checklist Categories */
.checklist-categories {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.checklist-category {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
}

.category-title {
  margin: 0 0 1rem;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #10b981;
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checklist-item:hover {
  background: #f9fafb;
}

.checklist-item input[type="checkbox"] {
  margin-top: 2px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #10b981;
}

.checklist-item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.checklist-item-name {
  font-size: 15px;
  color: #374151;
  font-weight: 500;
}

.checklist-item-quantity {
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.checklist-item-optional {
  font-size: 13px;
  color: #9ca3af;
  font-style: italic;
}

/* Instructions */
.instruction-steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.instruction-step {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.instruction-number {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.instruction-content {
  flex: 1;
}

.instruction-title {
  margin: 0 0 0.75rem;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.instruction-description {
  margin: 0 0 0.75rem;
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
}

.instruction-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.instruction-icon {
  width: 18px;
  height: 18px;
}

.instruction-tips {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #4b5563;
}

.instruction-tips strong {
  color: #10b981;
  font-weight: 700;
}

.instruction-tips ul {
  margin: 0.5rem 0 0 1.25rem;
  padding: 0;
}

.instruction-tips li {
  margin: 0.25rem 0;
}

/* Timeline Current Day */
.timeline-current-day {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 16px;
  margin-bottom: 2rem;
  color: white;
}

.current-day-label {
  font-size: 14px;
  font-weight: 600;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.current-day-number {
  font-size: 56px;
  font-weight: 800;
  margin: 0.5rem 0;
  line-height: 1;
}

.current-stage-badge {
  display: inline-block;
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

/* Vertical Timeline */
.vertical-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 2rem;
}

.timeline-stage {
  display: flex;
  gap: 1.5rem;
  position: relative;
}

.timeline-stage-marker {
  flex-shrink: 0;
  width: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #d1d5db;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #d1d5db;
  transition: all 0.3s ease;
}

.timeline-stage.current .timeline-dot {
  background: #10b981;
  box-shadow: 0 0 0 4px #d1fae5;
  width: 20px;
  height: 20px;
}

.timeline-stage.past .timeline-dot {
  background: #059669;
  box-shadow: 0 0 0 2px #d1fae5;
}

.timeline-stage.future .timeline-dot {
  background: #e5e7eb;
  box-shadow: 0 0 0 2px #f3f4f6;
}

.timeline-line {
  flex: 1;
  width: 3px;
  background: #e5e7eb;
  margin: 4px 0;
  transition: all 0.3s ease;
}

.timeline-stage.past .timeline-line {
  background: #d1fae5;
}

.timeline-stage-content {
  flex: 1;
  padding: 0.5rem 0 2rem 0;
}

.timeline-stage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.timeline-stage-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.timeline-stage.current .timeline-stage-name {
  color: #10b981;
}

.timeline-stage-days {
  font-size: 13px;
  color: #6b7280;
  font-weight: 600;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  white-space: nowrap;
}

.timeline-stage.current .timeline-stage-days {
  background: #d1fae5;
  color: #059669;
}

.timeline-stage-desc {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

/* Tips Section */
.timeline-tips {
  padding: 1.5rem;
  background: #fef3c7;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.tips-title {
  margin: 0 0 1rem;
  font-size: 16px;
  font-weight: 700;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tips-title::before {
  content: "💡";
  font-size: 20px;
}

.tips-list {
  margin: 0;
  padding-left: 1.25rem;
  color: #78350f;
}

.tips-list li {
  margin: 0.5rem 0;
  font-size: 14px;
  line-height: 1.6;
}

/* Revisit Actions */
.revisit-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.revisit-actions .btn-secondary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.revisit-actions svg {
  width: 18px;
  height: 18px;
}

/* Footer Buttons */
.step-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* ====================
   RESPONSIVE DESIGN
   ==================== */

@media (max-width: 1024px) {
  .profile-layout {
    grid-template-columns: 280px 1fr;
  }

  .profile-main-content {
    padding: 1.5rem 2rem;
  }

  .plants-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }

  .profile-sidebar {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    padding: 1.5rem 1rem;
    gap: 1rem;
  }

  .sidebar-section {
    padding: 1rem;
  }

  .profile-main-content {
    padding: 1.5rem 1rem;
  }

  .content-title {
    font-size: 24px;
  }

  .plants-grid {
    grid-template-columns: 1fr;
  }

  .nav-tab {
    padding: 0.75rem;
    font-size: 14px;
  }

  /* Journal Detail Modal responsive */
  .journal-detail-overlay {
    padding: 1rem;
  }

  .journal-detail-modal {
    max-height: 95vh;
  }

  .journal-detail-header {
    padding: 1.5rem 1.5rem 1rem;
  }

  .journal-detail-title h2 {
    font-size: 22px;
  }

  .journal-detail-close {
    width: 36px;
    height: 36px;
    font-size: 24px;
  }

  .step-indicator {
    padding: 1rem 1rem;
  }

  .step-circle {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }

  .step-line {
    width: 50px;
  }

  .step-label {
    font-size: 12px;
  }

  .journal-detail-body {
    padding: 1.5rem;
  }

  .step-header h3 {
    font-size: 20px;
  }

  .checklist-progress-section {
    padding: 1rem;
  }

  .checklist-category {
    padding: 1rem;
  }

  .category-title {
    font-size: 16px;
  }

  .instruction-step {
    flex-direction: column;
    gap: 1rem;
  }

  .instruction-number {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }

  .timeline-current-day {
    padding: 1.5rem;
  }

  .current-day-number {
    font-size: 48px;
  }

  .vertical-timeline {
    margin-left: -0.5rem;
  }

  .timeline-stage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .revisit-actions {
    flex-direction: column;
  }

  .step-footer {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }

  .step-footer button {
    width: 100%;
  }
}

/* ====================
   LEGACY STYLES (keep for modals)
   ==================== */
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
