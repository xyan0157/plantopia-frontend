<template>
  <!--
    Plants Page
    Display all available plants in the system
  -->
  <div class="plants-page">
    <!-- Bootstrap Container -->
    <div class="container-fluid bg-transparent">
      <!-- Top Section -->
      <div class="top-section">
        <div class="container-xl">
          <div class="page-header">
            <h1 class="page-title">All Plants</h1>
            <p class="page-subtitle">Discover our complete collection of plants</p>
          </div>
        </div>
      </div>

      <!-- Content section -->
      <div class="content-section">
        <div class="container-xl">
          <div class="content-panel">
            <!-- Search and Filter Bar -->
            <div class="search-filter-bar">
              <div class="search-input-group">
                <input
                  type="text"
                  class="form-control search-input"
                  placeholder="Search plants by name..."
                  v-model="searchQuery"
                  @input="handleSearch"
                >
              </div>
              <div class="filter-buttons">
                <button
                  class="btn filter-btn"
                  :class="{ 'active': selectedCategory === 'all' }"
                  @click="setCategory('all')"
                >
                  All
                </button>
                <button
                  class="btn filter-btn"
                  :class="{ 'active': selectedCategory === 'vegetable' }"
                  @click="setCategory('vegetable')"
                >
                  Vegetables
                </button>
                <button
                  class="btn filter-btn"
                  :class="{ 'active': selectedCategory === 'herb' }"
                  @click="setCategory('herb')"
                >
                  Herbs
                </button>
                <button
                  class="btn filter-btn"
                  :class="{ 'active': selectedCategory === 'flower' }"
                  @click="setCategory('flower')"
                >
                  Flowers
                </button>
              </div>
            </div>

            <!-- Loading State: only before first page is visible -->
            <div v-if="loading && !firstPageLoaded" class="loading-state text-center py-5">
              <div class="loading-spinner mx-auto mb-3"></div>
              <p class="mb-0 loading-text">Loading plants...</p>
            </div>

            <!-- Error State -->
            <div v-if="error" class="error-state">
              <div class="alert alert-danger d-flex align-items-center" role="alert">
                <div class="flex-grow-1">{{ error }}</div>
                <button @click="loadPlants" class="btn btn-outline-danger btn-sm ms-3">Retry</button>
              </div>
            </div>

            <!-- Plants Grid (render even when loading is true) -->
            <div v-if="filteredPlants.length > 0" class="plants-results">
              <!-- Plants Count and Page Size Selector -->
              <div class="results-controls">
                <div class="plants-count-display">
                  Showing {{ plantsDisplayRange.start }}-{{ plantsDisplayRange.end }} of {{ totalPlants }} plants
                </div>
                <div class="page-size-selector">
                  <label for="page-size">Plants per page:</label>
                  <select
                    id="page-size"
                    v-model="plantsPerPage"
                    @change="handlePageSizeChange"
                    class="page-size-select"
                  >
                    <option v-for="size in pageSizeOptions" :key="size" :value="size">
                      {{ size }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="plants-grid">
                <div
                  v-for="plant in paginatedPlants"
                  :key="plant.id"
                  class="plant-card"
                  :style="getCardStyle(plant)"
                  @click="selectPlant(plant)"
                >
                  <div class="plant-image">
                    <!-- Show Google Drive image if available -->
                    <img
                      v-if="!hasImageError(plant.id)"
                      :src="getPlantImage(plant).src"
                      :data-src-step="getPlantImage(plant).step"
                      :alt="plant.name"
                      @error="(event) => handleImageError(event, plant.id)"
                    >
                    <!-- Show placeholder if no image available or image failed to load -->
                    <div v-else class="image-placeholder">
                      <div class="placeholder-icon">Plant</div>
                      <span class="placeholder-text">{{ plant.category || 'Plant' }}</span>
                    </div>
                  </div>
                  <div class="plant-info">
                    <h3 class="plant-name">{{ plant.name }}</h3>
                    <p class="plant-scientific">{{ plant.scientific_name }}</p>
                    <div class="bottom-stack">
                      <div v-if="plant.category" class="category-chip">{{ plant.category }}</div>
                      <div class="plant-care">
                        <PlantRequirements 
                          :sunlight="plant.care_requirements?.sunlight || ''"
                          :water="plant.care_requirements?.watering || ''"
                          :effort="''"
                        />
                      </div>
                      
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pagination Controls -->
              <div v-if="totalPages > 1" class="pagination-controls">
                <nav aria-label="Plants pagination">
                  <ul class="pagination">
                    <!-- Previous button -->
                    <li class="page-item" :class="{ disabled: !canGoPrevious }">
                      <button
                        class="page-link"
                        @click="goToPreviousPage"
                        :disabled="!canGoPrevious"
                        aria-label="Previous page"
                      >
                        &lsaquo; Previous
                      </button>
                    </li>

                    <!-- Page numbers -->
                    <li
                      v-for="pageNumber in pageNumbers"
                      :key="pageNumber"
                      class="page-item"
                      :class="{ active: pageNumber === currentPage }"
                    >
                      <button
                        class="page-link"
                        @click="goToPage(pageNumber)"
                        :aria-label="`Go to page ${pageNumber}`"
                        :aria-current="pageNumber === currentPage ? 'page' : undefined"
                      >
                        {{ pageNumber }}
                      </button>
                    </li>

                    <!-- Next button -->
                    <li class="page-item" :class="{ disabled: !canGoNext }">
                      <button
                        class="page-link"
                        @click="goToNextPage"
                        :disabled="!canGoNext"
                        aria-label="Next page"
                      >
                        Next &rsaquo;
                      </button>
                    </li>

                  <!-- Page jump inside pagination bar -->
                  <li class="page-jump-item" role="group" aria-label="Jump to page">
                    <span class="jump-label">Go to</span>
                    <input
                      class="jump-input"
                      type="number"
                      min="1"
                      :max="totalPages"
                      v-model="pageJump"
                      @keydown.enter.prevent="jumpToPage()"
                      aria-label="Page number"
                    />
                  <span class="jump-total">/ {{ displayTotalPages }}</span>
                    <button class="jump-btn" @click="jumpToPage" :disabled="!canJump">Go</button>
                  </li>
                  </ul>
                </nav>
              </div>
            </div>

            <!-- No Results State (only when not loading and no error) -->
            <div v-if="!loading && !error && filteredPlants.length === 0" class="no-results-state">
              <div class="alert alert-info text-center" role="alert">
                <p class="mb-0">
                  {{ searchQuery ? 'No plants found matching your search.' : 'No plants available at the moment.' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Plant Detail Modal -->
    <div v-if="selectedPlant" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ selectedPlant.name }}</h2>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="plant-detail-image">
            <!-- Show Google Drive image if available -->
            <img
              v-if="!hasImageError(selectedPlant?.id || '')"
              :src="getPlantImage(selectedPlant).src"
              :alt="selectedPlant?.name"
              @error="(event) => selectedPlant && handleImageError(event, selectedPlant.id)"
            >
            <!-- Show placeholder if no image available or image failed to load -->
            <div v-else class="image-placeholder">
              <div class="placeholder-icon">Plant</div>
              <span class="placeholder-text">{{ selectedPlant.category || 'Plant' }}</span>
            </div>
          </div>
          <div class="plant-detail-info">
            <p class="scientific-name">{{ selectedPlant.scientific_name }}</p>
            <div class="description">
              <div class="desc-title-row">
                <h4 class="desc-head">Description</h4>
                <button class="fav-btn" :class="{ active: isFavourite(selectedPlant as Plant) }" @click.stop="toggleFav(selectedPlant as Plant)" aria-label="favourite">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24z"
                      :fill="isFavourite(selectedPlant as Plant) ? 'currentColor' : 'none'"
                      :stroke="isFavourite(selectedPlant as Plant) ? 'none' : 'currentColor'"
                      stroke-width="2"/>
                  </svg>
                </button>
              </div>
              <div class="plant-description" v-html="renderedDescription"></div>
            </div>
            <div class="plant-type" v-if="selectedPlant.plant_type">
              <h4>Plant Type</h4>
              <p>{{ selectedPlant.plant_type }}</p>
            </div>
            <div class="growing-details" v-if="selectedPlant.days_to_maturity || selectedPlant.plant_spacing || selectedPlant.position">
              <h4>Growing Details</h4>
              <div class="care-grid">
                <div class="care-detail" v-if="selectedPlant.days_to_maturity">
                  <strong>Days to Maturity:</strong> {{ selectedPlant.days_to_maturity }}
                </div>
                <div class="care-detail" v-if="selectedPlant.plant_spacing">
                  <strong>Plant Spacing:</strong> {{ selectedPlant.plant_spacing }}
                </div>
                <div class="care-detail" v-if="selectedPlant.sowing_depth">
                  <strong>Sowing Depth:</strong> {{ selectedPlant.sowing_depth }}
                </div>
                <div class="care-detail" v-if="selectedPlant.position">
                  <strong>Position:</strong> {{ selectedPlant.position }}
                </div>
                <div class="care-detail" v-if="selectedPlant.season">
                  <strong>Season:</strong> {{ selectedPlant.season }}
                </div>
                <div class="care-detail" v-if="selectedPlant.germination_period">
                  <strong>Germination:</strong> {{ selectedPlant.germination_period }}
                </div>
                <div class="care-detail" v-if="selectedPlant.sowing_method">
                  <strong>Sowing Method:</strong> {{ selectedPlant.sowing_method }}
                </div>
                <div class="care-detail" v-if="selectedPlant.hardiness_life_cycle">
                  <strong>Hardiness:</strong> {{ selectedPlant.hardiness_life_cycle }}
                </div>
              </div>
            </div>
            <div class="care-requirements" v-if="selectedPlant.care_requirements">
              <h4>Care Requirements</h4>
              <div class="care-grid">
                <div class="care-detail" v-if="selectedPlant.care_requirements.sunlight">
                  <strong>Sunlight:</strong> {{ selectedPlant.care_requirements.sunlight }}
                </div>
                <div class="care-detail" v-if="selectedPlant.care_requirements.watering">
                  <strong>Watering:</strong> {{ selectedPlant.care_requirements.watering }}
                </div>
                <div class="care-detail" v-if="selectedPlant.care_requirements.soil">
                  <strong>Soil:</strong> {{ selectedPlant.care_requirements.soil }}
                </div>
                <div class="care-detail" v-if="selectedPlant.care_requirements.temperature">
                  <strong>Temperature:</strong> {{ selectedPlant.care_requirements.temperature }}
                </div>
              </div>
            </div>
            <div class="additional-info" v-if="selectedPlant.additional_information">
              <h4>Additional Information</h4>
              <p>{{ selectedPlant.additional_information }}</p>
            </div>
            <div class="characteristics" v-if="selectedPlant.characteristics">
              <h4>Characteristics</h4>
              <p>{{ selectedPlant.characteristics }}</p>
            </div>
            <div class="plant-features" v-if="hasPlantFeatures(selectedPlant)">
              <h4>Plant Features</h4>
              <div class="features-grid">
                <div class="feature-item" v-if="selectedPlant.edible">
                  <strong>Edible:</strong> <span class="feature-yes">Yes</span>
                </div>
                <div class="feature-item" v-if="selectedPlant.fragrant">
                  <strong>Fragrant:</strong> <span class="feature-yes">Yes</span>
                </div>
                <div class="feature-item" v-if="selectedPlant.container_ok">
                  <strong>Container Suitable:</strong> <span class="feature-yes">Yes</span>
                </div>
                <div class="feature-item" v-if="selectedPlant.indoor_ok">
                  <strong>Indoor Suitable:</strong> <span class="feature-yes">Yes</span>
                </div>
                <div class="feature-item" v-if="selectedPlant.habit">
                  <strong>Growth Habit:</strong> {{ selectedPlant.habit }}
                </div>
                <div class="feature-item" v-if="selectedPlant.flower_colors && selectedPlant.flower_colors.length">
                  <strong>Flower Colors:</strong> {{ selectedPlant.flower_colors.join(', ') }}
                </div>
                <div class="feature-item" v-if="selectedPlant.maintainability_score !== undefined">
                  <strong>Maintenance Level:</strong> {{ getMaintenanceLevel(selectedPlant.maintainability_score) }}
                </div>
              </div>
            </div>
            <div class="climate-sowing" v-if="selectedPlant.climate_specific_sowing && hasClimateData(selectedPlant.climate_specific_sowing)">
              <h4>Sowing Times by Climate</h4>
              <div class="climate-grid">
                <div class="climate-item" v-for="(textVal, climate) in (selectedPlant.climate_specific_sowing as Record<string, string>)" :key="String(climate)">
                  <strong>{{ capitalizeFirst(String(climate)) }}:</strong> {{ String(textVal) }}
                </div>
              </div>
            </div>
            <div class="plant-tags-detail" v-if="selectedPlant.tags && selectedPlant.tags.length">
              <h4>Tags</h4>
              <div class="tags-list-row">
                <div class="tags-list">
                  <span
                    v-for="tag in selectedPlant.tags"
                    :key="tag"
                    class="tag-item"
                  >
                    {{ tag }}
                  </span>
                </div>
                <button class="grow-inline-btn" @click.stop="startTracking(selectedPlant as Plant)">I want to grow this plant</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sign-in Modal -->
    <SignInModal
      v-if="showSignIn"
      :message="signInMessage"
      @close="showSignIn = false"
    />
    <!-- Loading Modal -->
    <LoadingModal v-if="loadingModal.show" :context="'plants'" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { type Plant, plantApiService } from '@/services/api'
import { usePlantsStore } from '@/stores/plants'
import { useAuthStore } from '@/stores/auth'
import { handleImageError as handleImageErrorHelper } from '@/utils/imageHelper'
import { renderMarkdown } from '@/services/markdownService'
import PlantRequirements from '@/views/recommendation/PlantRequirements.vue'
import SignInModal from '@/components/SignInModal.vue'
import LoadingModal from '@/components/LoadingModal.vue'
import { useToast } from '@/composables/useToast'

// Reactive state
const store = usePlantsStore()
const toast = useToast()
const plants = computed(() => store.plants)
const loading = computed(() => store.loading)
const error = computed(() => store.error)
const searchQuery = ref('')
const selectedCategory = ref<'all' | 'vegetable' | 'herb' | 'flower'>('all')
const selectedPlant = ref<Plant | null>(null)
const imageErrors = ref<Set<string>>(new Set())
const firstPageLoaded = computed(() => store.firstPageShown)
// Sign-in modal state
const showSignIn = ref(false)
const signInMessage = ref('')
function promptSignIn(message: string) {
  signInMessage.value = message
  showSignIn.value = true
}
// Loading modal state
const loadingModal = ref<{ show: boolean; message: string }>({ show: false, message: '' })

// Pagination state
const currentPage = ref(1)
const plantsPerPage = ref(12)
const pageSizeOptions = [12, 24, 48, 96]
const totalFromServer = ref(0)

// Server-side pagination is used; the store already returns the current page
const filteredPlants = computed(() => plants.value)

// Pagination computed properties
const totalPlants = computed(() => store.totalCount)
const totalPages = computed(() => Math.max(1, Math.ceil(Math.max(0, totalPlants.value) / plantsPerPage.value)))

// Plants display range computed property
const plantsDisplayRange = computed(() => {
  const start = (currentPage.value - 1) * plantsPerPage.value + 1
  const end = Math.min(currentPage.value * plantsPerPage.value, totalPlants.value)
  return { start, end }
})
// Show only pages that the frontend has already loaded (progressive reveal)
const displayTotalPages = computed(() => Math.max(1, Math.min(totalPages.value, store.loadedPagesMax || 1)))

// Markdown rendering computed property
const renderedDescription = computed(() => {
  if (!selectedPlant.value || !selectedPlant.value.description) {
    return 'No description available.'
  }
  return renderMarkdown(selectedPlant.value.description)
})

// favourites for grid cards
const toggleFav = async (p: Plant) => {
  const email = localStorage.getItem('plantopia_user_email') || ''
  if (!email) { promptSignIn('Please sign in to use favourites.'); return }
  const wasFavourite = store.isFavourite(String(p.id))
  try {
    loadingModal.value = { show: true, message: 'Saving favourite...' }
    if (!store.favouritesLoaded) await store.loadFavouritesFromApi()
    await store.toggleFavourite(String(p.id))
    // Show success toast based on action
    if (wasFavourite) {
      toast.success(`${p.name} removed from favourites`)
    } else {
      toast.success(`${p.name} added to favourites`)
    }
  } catch (error) {
    toast.error('Failed to update favourites')
  } finally {
    loadingModal.value = { show: false, message: '' }
  }
}
const isFavourite = (p: Plant) => store.isFavourite(String(p.id))

const paginatedPlants = computed(() => filteredPlants.value)

// Pagination navigation helpers
const canGoPrevious = computed(() => currentPage.value > 1)
const canGoNext = computed(() => currentPage.value < totalPages.value)
const pageJump = ref<number | null>(null)
const canJump = computed(() => {
  const v = Number(pageJump.value)
  return Number.isFinite(v) && v >= 1 && v <= totalPages.value && v !== currentPage.value
})

const pageNumbers = computed(() => {
  const pages = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(displayTotalPages.value, startPage + maxVisiblePages - 1)

  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return pages
})

// Methods
const loadPlants = async () => {
  const { total } = await store.loadPage(currentPage.value, plantsPerPage.value, selectedCategory.value, searchQuery.value.trim())
  // Kick off background prefetch of subsequent pages
  store.startPrefetch(plantsPerPage.value, selectedCategory.value, searchQuery.value.trim())
  totalFromServer.value = total
}

// Handle page size change
const handlePageSizeChange = () => {
  console.log('[PlantsView] Page size changed to:', plantsPerPage.value)
  currentPage.value = 1 // Reset to first page when changing page size
  loadPlants()
}

const handleSearch = () => {
  currentPage.value = 1
  loadPlants()
}

const setCategory = (category: 'all' | 'vegetable' | 'herb' | 'flower') => {
  selectedCategory.value = category
  // Reset to first page when changing category
  currentPage.value = 1
  // Keep user at top when switching via navigation
  window.scrollTo({ top: 0, behavior: 'smooth' })
  loadPlants()
}

// Pagination methods
const goToPage = async (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    await loadPlants()
    // Scroll to top of plant results
    scrollToResults()
  }
}

function jumpToPage() {
  const v = Number(pageJump.value)
  if (!Number.isFinite(v)) return
  const page = Math.min(Math.max(1, Math.trunc(v)), totalPages.value)
  pageJump.value = page
  goToPage(page)
}

const goToPreviousPage = () => {
  if (canGoPrevious.value) {
    goToPage(currentPage.value - 1)
  }
}

const goToNextPage = () => {
  if (canGoNext.value) {
    goToPage(currentPage.value + 1)
  }
}

const scrollToResults = () => {
  const resultsElement = document.querySelector('.plants-results')
  if (resultsElement) {
    resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const selectPlant = (plant: Plant) => {
  selectedPlant.value = plant
}

const closeModal = () => {
  selectedPlant.value = null
}

// Start tracking handler
const auth = useAuthStore()
async function startTracking(plant: Plant) {
  if (!auth.userIsLoggedIn) {
    promptSignIn('Please sign in first to start tracking this plant.')
    return
  }
  try {
    loadingModal.value = { show: true, message: 'Starting tracking...' }
    const pid = Number((plant as unknown as { databaseId?: number })?.databaseId || plant.id)
    const nickname = String(plant.name || '').trim() || undefined
    let locationDetails: string | undefined = undefined
    try {
      const sidRaw = localStorage.getItem('profile_suburb_id') || localStorage.getItem('profile_suburb') || ''
      const sid = parseInt(String(sidRaw), 10)
      if (Number.isFinite(sid)) {
        const name = await plantApiService.getSuburbNameById(sid)
        if (name) locationDetails = name
      }
    } catch {}
    const req = { plant_id: pid, plant_nickname: nickname, location_details: locationDetails }
    console.log('[UI] startTracking request', req)
    const resp = await plantApiService.startPlantTrackingByProfile(req)
    console.log('[UI] startTracking response', resp)
    const instanceId = Number((resp as unknown as { instance_id?: number })?.instance_id || 0)
    if (Number.isFinite(instanceId) && instanceId > 0) {
      try { await plantApiService.startGrowingInstance(instanceId) } catch (e) { console.warn('[UI] startGrowingInstance failed', e) }
    }
    toast.success(`${plant.name} added to your journal!`)
  } catch (e) {
    console.error('[UI] startTracking error', e)
    toast.error('Failed to add plant to journal')
  } finally {
    loadingModal.value = { show: false, message: '' }
  }
  try { localStorage.setItem('journal_refresh_at', String(Date.now())) } catch {}
}

// No explicit sign-in redirect per request; OK simply closes

// Get image + debug step info for diagnostics
const getPlantImage = (plant: Plant): { src: string; step: string } => {
  // 1) backend image_url
  if (plant.image_url) {
    const src = plant.image_url
    console.debug('[IMG PICK] step=1 image_url', plant.name, src)
    return { src, step: '1-image_url' }
  }

  // 2) base64
  if (plant.image_base64) {
    const src = plant.image_base64.startsWith('data:')
      ? plant.image_base64
      : `data:image/jpeg;base64,${plant.image_base64}`
    console.debug('[IMG PICK] step=2 base64', plant.name)
    return { src, step: '2-base64' }
  }

  // 3) proxy candidates from imagePath
  if (plant.imagePath) {
    const p = plant.imagePath
    const primaryUrl = import.meta.env.VITE_API_URL || 'https://budgets-accepting-porcelain-austin.trycloudflare.com'
    const candidates = [
      `${primaryUrl}/api/v1/plant-image/${encodeURIComponent(p)}`,
      `${primaryUrl}/api/v1/plant-image?path=${encodeURIComponent(p)}`,
      `${primaryUrl}/api/v1/images/${encodeURIComponent(p)}`,
      `${primaryUrl}/static/${p}`,
      `${primaryUrl}/media/${p}`
    ]
    console.debug('[IMG PICK] step=3 imagePath-proxy (first candidate)', plant.name, candidates[0])
    return { src: candidates[0], step: '3-imagePath-proxy' }
  }

  // 4) category placeholder
  if (plant.category) {
    const c = plant.category.toLowerCase()
    const src = c === 'flower' ? '/Flower.jpg' : c === 'herb' ? '/Herb.jpg' : c === 'vegetable' ? '/Vegetable.jpg' : '/placeholder-plant.svg'
    console.debug('[IMG PICK] step=4 category-placeholder', plant.name, src)
    return { src, step: '4-category-placeholder' }
  }

  // 5) generic placeholder
  console.debug('[IMG PICK] step=5 generic-placeholder', plant.name)
  return { src: '/placeholder-plant.svg', step: '5-generic-placeholder' }
}

// Handle image loading errors - using Google Drive helper
const handleImageError = (event: Event, plantId: string) => {
  const img = event.target as HTMLImageElement
  console.warn('[PLANTS VIEW] Failed to load plant image:', img.src)
  const step = (img as HTMLImageElement & { dataset: DOMStringMap }).dataset?.srcStep
  if (step) {
    console.warn('[PLANTS VIEW] Image load failed at step:', step)
  }

  // Track this plant as having image error
  imageErrors.value.add(plantId)

  // Try to find the plant and get its category for fallback
  const plant = plants.value.find(p => p.id === plantId)
  const category = plant?.category

  // Use the helper function to handle the error with category context
  handleImageErrorHelper(event, category)

  // Hide the broken image
  img.style.display = 'none'
}

// Check if plant has image error
const hasImageError = (plantId: string): boolean => {
  return imageErrors.value.has(plantId)
}

// Check if plant has any features to display
const hasPlantFeatures = (plant: Plant): boolean => {
  return !!(plant.edible || plant.fragrant || plant.container_ok || plant.indoor_ok ||
           plant.habit || (plant.flower_colors && plant.flower_colors.length) ||
           plant.maintainability_score !== undefined)
}

// Check if climate data has any non-empty values
const hasClimateData = (climateData: Record<string, unknown> | null | undefined): boolean => {
  if (!climateData) return false
  return Object.values(climateData).some(value => value && value !== '')
}

// Get maintenance level from score
const getMaintenanceLevel = (score: number): string => {
  if (score >= 0.8) return 'Low'
  if (score >= 0.5) return 'Medium'
  return 'High'
}

// Dynamic color palette for All Plants card backgrounds
type Palette = { bgStart: string; bgEnd: string }
const normalizeColor = (s?: string): string => String(s || '').toLowerCase()
const pickColor = (p: Plant): string => {
  const arr = (p.flower_colors || []) as (string | undefined)[]
  if (Array.isArray(arr) && arr.length > 0) return normalizeColor(arr[0])
  const desc = normalizeColor(p.description)
  const keywords = ['red','pink','purple','blue','yellow','orange','white','green']
  for (const k of keywords) if (desc.includes(k)) return k
  return 'default'
}
const paletteFor = (c: string): Palette => {
  switch (c) {
    case 'red': return { bgStart: '#f87171', bgEnd: '#ef4444' }
    case 'pink': return { bgStart: '#f472b6', bgEnd: '#ec4899' }
    case 'purple': return { bgStart: '#a78bfa', bgEnd: '#8b5cf6' }
    case 'blue': return { bgStart: '#60a5fa', bgEnd: '#3b82f6' }
    case 'yellow': return { bgStart: '#f59e0b', bgEnd: '#d97706' }
    case 'orange': return { bgStart: '#fb923c', bgEnd: '#f97316' }
    case 'white': return { bgStart: '#9ca3af', bgEnd: '#6b7280' } // Darker grey for better contrast with white text
    case 'green': return { bgStart: '#22c55e', bgEnd: '#16a34a' } // Darker green for better contrast with white text
    default: return { bgStart: '#86efac', bgEnd: '#4ade80' } // More vibrant default green for better readability
  }
}
const getCardStyle = (p: Plant) => {
  const pal = paletteFor(pickColor(p))
  // Sky-like vertical gradient: vivid at top -> soft -> near-white bottom
  return {
    background: `linear-gradient(180deg, ${pal.bgStart} 0%, ${pal.bgEnd} 55%, #ffffff 100%)`,
    animation: 'cardPulse 6s ease-in-out infinite'
  }
}

// Capitalize first letter
const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Watch for page size changes
watch(plantsPerPage, (newSize, oldSize) => {
  if (oldSize && newSize !== oldSize) {
    console.log('[PlantsView] plantsPerPage watcher triggered:', oldSize, '->', newSize)
    // Clear the page cache when page size changes to force fresh data fetch
    store.pageCache = {}
    store.loadedPagesMax = 0
    currentPage.value = 1
    loadPlants()
  }
})

// Lifecycle
onMounted(async () => {
  // if navigated with ?category=vegetables|herbs|flowers, map to internal keys
  const route = useRoute()
  const q = String(route.query.category || '').toLowerCase()
  if (q === 'vegetables') selectedCategory.value = 'vegetable'
  else if (q === 'herbs') selectedCategory.value = 'herb'
  else if (q === 'flowers') selectedCategory.value = 'flower'

  await loadPlants()
  // First, migrate any legacy local favourites to server, then load server state
  await store.syncLocalFavouritesToServer()
  await store.loadFavouritesFromApi()
})
</script>

<style scoped>
/* Background and Page Setup - Same as RecommendationsView */
.plants-page {
  min-height: 100vh;
  position: relative;
  background: transparent !important;
}

/* Ensure Bootstrap containers don't have white backgrounds */
.container-fluid,
.container-xl,
.row,
.col-xl-3,
.col-xl-9,
.col-lg-4,
.col-lg-8,
.col-md-12,
.col-12 {
  background: transparent !important;
}

/* Remove default horizontal padding so full-width backgrounds can bleed to edges */
.plants-page .container-fluid {
  padding-left: 0;
  padding-right: 0;
}

/* Background image - Same as RecommendationsView */
.plants-page::after {
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

/* Top Section */
.top-section {
  background: transparent;
  border-bottom: 0;
  padding: 2rem 0;
  margin-top: 20px;
  position: relative;
  z-index: 1;
  backdrop-filter: none;
  width: 100%;
  isolation: isolate;
}

.page-header {
  text-align: center;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 0;
}

/* Content Section */
.content-section {
  padding-top: 1rem;
}

.content-panel {
  padding: 1.5rem 0;
  background: transparent;
  min-height: calc(100vh - 200px);
}

/* Search and Filter Bar */
.search-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.search-input-group {
  flex: 1;
  max-width: 400px;
}

.search-input {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  outline: none;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

/* search button removed */

.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.filter-btn:hover {
  border-color: #10b981;
  color: #10b981;
}

.filter-btn.active {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

/* Loading Spinner */
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e6edd8;
  border-top: 4px solid #0d9488;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Plants Results */
.plants-results {
  padding: 1rem 0;
}

/* Results Controls */
.results-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.plants-count-display {
  color: #374151;
  font-weight: 600;
  font-size: 0.95rem;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-size-selector label {
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
  margin: 0;
}

.page-size-select {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-size-select:hover {
  border-color: #10b981;
}

.page-size-select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.plants-count {
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  font-weight: 500;
}

.plants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
  max-width: 100%;
}

/* Ensure optimal grid layout for different screen sizes */
@media (min-width: 1200px) {
  .plants-grid {
    grid-template-columns: repeat(4, 1fr); /* 4 columns on large screens */
  }
}

@media (min-width: 992px) and (max-width: 1199px) {
  .plants-grid {
    grid-template-columns: repeat(3, 1fr); /* 3 columns on medium screens */
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .plants-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on small screens */
  }
}

@media (max-width: 767px) {
  .plants-grid {
    grid-template-columns: 1fr; /* 1 column on mobile */
  }
}

/* Plant Card */
.plant-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

@keyframes cardPulse {
  0% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(8deg); }
  100% { filter: hue-rotate(0deg); }
}

.plant-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
}

.plant-image {
  height: 200px;
  overflow: hidden;
  position: relative;
}

.plant-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

/* Image placeholder styles - following RecommendationsView pattern */
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  color: #64748b;
  text-align: center;
  padding: 1rem;
}

.placeholder-icon {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #10b981;
}

.placeholder-text {
  font-size: 0.875rem;
  color: #64748b;
  text-transform: capitalize;
}

.plant-card:hover .plant-image img {
  transform: scale(1.05);
}

.plant-info {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.bottom-stack { display: flex; flex-direction: column; gap: 0.5rem; margin-top: auto; }
.grow-btn { margin-top: 6px; padding: 0.5rem; background:#10b981; color:#fff; border:none; border-radius:8px; font-weight:700; cursor:pointer; }
.grow-btn:hover { background:#059669; }

.desc-head { display:flex; align-items:center; gap:8px; }
.desc-title-row { display:flex; align-items:baseline; justify-content:space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; margin-bottom: 0.75rem; }
.fav-btn { border:none; background:transparent; line-height:1; cursor:pointer; color:#9ca3af; width:22px; height:22px; display:flex; align-items:center; justify-content:center; }
.fav-btn svg { width:18px; height:18px; }
.fav-btn.active { color:#10b981; }

.plant-name {
  font-size: 1.25rem;
  font-weight: 600;
    color: #ffffff;
  margin-bottom: 0.25rem;
}

.plant-scientific {
  font-style: italic;
  color: #ffffff;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.plant-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.plant-tag {
  background: #ecfdf5;
  color: #065f46;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.plant-care {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: auto;
}

.category-chip {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  color: #065f46;
  border: 2px solid #a7f3d0;
  border-radius: 10px;
  width: fit-content;
  text-transform: lowercase;
  font-weight: 600;
  font-size: 0.875rem;
}

.care-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.care-label {
  font-weight: 500;
  color: #4b5563;
}

.care-value {
  color: #6b7280;
}

/* Plant Features Styles */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.feature-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-item strong {
  color: #374151;
  font-weight: 600;
}

.feature-yes {
  color: #10b981;
  font-weight: 600;
}

/* Climate Sowing Styles */
.climate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.climate-item {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #10b981;
}

.climate-item strong {
  color: #374151;
  font-weight: 600;
}

/* Pagination Styles */
.pagination-controls {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding: 1rem 0;
}

.pagination {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.page-item {
  margin: 0;
}

.page-link {
  display: block;
  padding: 0.5rem 0.75rem;
  margin: 0;
  color: #374151;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  min-width: 44px;
  text-align: center;
}

.page-link:hover:not(:disabled) {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border-color: #10b981;
}

.page-link:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.page-item.active .page-link {
  color: white;
  background: #10b981;
  border-color: #10b981;
  font-weight: 700;
}

.page-item.disabled .page-link {
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.5;
}

.page-item.disabled .page-link:hover {
  color: #9ca3af;
  background: transparent;
  border-color: transparent;
}

/* Page jump styles */
.page-jump-item { display:flex; align-items:center; gap: 0.5rem; margin-left: 0.75rem; }
.jump-label { color:#374151; font-weight:500; }
.jump-input { width: 64px; padding: 0.5rem 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; text-align:center; background:#ffffff; color:#374151; }
.jump-input:focus { border-color:#10b981; outline:none; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
.jump-total { color:#6b7280; }
.jump-btn { padding: 0.5rem 0.75rem; border: 2px solid #10b981; background:#10b981; color:#fff; border-radius:8px; font-weight:600; cursor:pointer; }
.jump-btn:disabled { background:#a7f3d0; border-color:#a7f3d0; cursor:not-allowed; }

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 1200px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
}

.plant-detail-image {
  width: fit-content;
  max-width: 100%;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #a7f3d0;
  margin: 0 auto 1rem auto;
  padding: 0.5rem;
  overflow: hidden;
}

.plant-detail-image img {
  max-width: 100%;
  max-height: 250px;
  height: auto;
  object-fit: contain;
  object-position: center;
  border-radius: 0.875rem;
  display: block;
}

.plant-detail-image .image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #059669;
  text-align: center;
}

.plant-detail-image .placeholder-icon { font-size: 2rem; }

.plant-detail-image .placeholder-text { font-size: 1rem; }

.scientific-name {
  font-style: italic;
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.description,
.plant-type,
.growing-details,
.care-requirements,
.additional-info,
.characteristics,
.plant-features,
.climate-sowing,
.plant-tags-detail {
  margin-bottom: 1.5rem;
}

.description h4,
.plant-type h4,
.growing-details h4,
.care-requirements h4,
.additional-info h4,
.characteristics h4,
.plant-features h4,
.climate-sowing h4,
.plant-tags-detail h4 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.care-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.care-detail {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  background: #ecfdf5;
  color: #065f46;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Alert Styles */
.error-state .alert {
  background: rgba(254, 242, 242, 0.9) !important;
  border-color: rgba(254, 202, 202, 0.6) !important;
  backdrop-filter: blur(8px);
}

.no-results-state .alert {
  background: rgba(239, 246, 255, 0.9) !important;
  border-color: rgba(191, 219, 254, 0.6) !important;
  backdrop-filter: blur(8px);
}

/* Responsive Pagination */
@media (max-width: 768px) {
  .pagination {
    gap: 0.125rem;
    padding: 0.25rem;
  }

  .page-link {
    padding: 0.375rem 0.5rem;
    font-size: 0.875rem;
    min-width: 36px;
  }
}

@media (max-width: 480px) {
  .pagination-controls {
    margin-top: 1.5rem;
  }

  .page-link {
    padding: 0.25rem 0.375rem;
    font-size: 0.75rem;
    min-width: 32px;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .results-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .plants-count-display,
  .page-size-selector {
    text-align: center;
    justify-content: center;
  }

  .search-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input-group {
    max-width: none;
  }

  .filter-buttons {
    justify-content: center;
  }

  .plants-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .modal-content {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }

  .care-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }

  .plants-grid {
    grid-template-columns: 1fr;
  }

  .filter-buttons {
    flex-direction: column;
  }

  .modal-header,
  .modal-body {
    padding: 1rem;
  }
}
.loading-text {
  color: #ffffff;
}

/* Floating grow button specifically for All Plants detail modal */
/* Row with tags and grow button */
.tags-list-row { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.grow-inline-btn { background:#10b981; color:#fff; border:none; border-radius:12px; padding:0.6rem 1rem; font-weight:800; cursor:pointer; }
.grow-inline-btn:hover { background:#059669; }
</style>
