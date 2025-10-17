<template>
  <!--
    Plant Recommendations Page
    Main container for the plant recommendation system
    Includes search form, results display, and plant detail modal
  -->
  <div class="recommendations-page">
    <!-- Bootstrap Container -->
    <div class="container-fluid bg-transparent">
      <!-- Top Search Bar - Full Width (unchanged) -->
      <div class="top-search-section">
        <div class="container-xl top-inline">
          <div class="scale-root"><div class="scale-inner">
            <SearchForm @find-plants="handleFindPlants" />
          </div></div>
          <div class="filter-col">
            <FilterSidebar
              :filters="filterData"
              @update-filters="handleUpdateFilters"
            />
          </div>
        </div>
      </div>

      <!-- Content section with left filter and right results -->
      <div class="content-section">
        <div class="scale-root"><div class="scale-inner results-shift">
        <div class="content-layout">
          <aside class="filters-column"></aside>
          <section class="results-column">
            <div class="container-xl">
              <div class="content-panel">
                <!-- Loading State -->
                <div v-if="loading" class="loading-state text-center py-5">
                  <div class="loading-spinner mx-auto mb-3"></div>
                  <p class="mb-0">Finding the perfect plants for you...</p>
                </div>

                <!-- Error State -->
                <div v-else-if="error" class="error-state">
                  <div class="alert alert-danger d-flex align-items-center" role="alert">
                    <div class="flex-grow-1">{{ error }}</div>
                    <button @click="error = null" class="btn btn-outline-danger btn-sm ms-3">Close</button>
                  </div>
                </div>

                <!-- Plant Cards Grid -->
                <div v-else-if="showResults && plants.length > 0" class="plant-results">
                  <div class="plant-grid">
                    <PlantCard
                      v-for="plant in visiblePlants"
                      :key="plant.id"
                      :plant="plant"
                      @select="selectPlant"
                    />
                  </div>
                  <div v-if="!showAll && plants.length > initialCount" class="more-toggle" @click="showAll = true">
                    <span class="more-text">Show More</span>
                    <svg class="more-icon down" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div v-if="showAll && plants.length > initialCount" class="more-toggle" @click="showAll = false">
                    <span class="more-text">Show Less</span>
                    <svg class="more-icon up" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 14l5-5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>

                <!-- No Results State -->
                <div v-else-if="showResults && plants.length === 0" class="no-results-state">
                  <div class="alert alert-info text-center" role="alert">
                    <p class="mb-0">No plants found for your criteria. Try adjusting your preferences.</p>
                  </div>
                </div>


              </div>
            </div>
          </section>
        </div>
        </div></div>
      </div>

      <!-- Plant Detail Modal - shows detailed plant information when plant is selected -->
      <PlantDetailModal
        :plant="selectedPlant"
        @close="closeModal"
        @select-plant="selectPlant"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import SearchForm from './recommendation/SearchForm.vue'
import PlantCard from './recommendation/PlantCard.vue'
import PlantDetailModal from './recommendation/PlantDetailModal.vue'
import FilterSidebar from './recommendation/FilterSidebar.vue'
import { plantApiService, buildApiRequest, type Plant } from '@/services/api'
import { useRecommendationsStore } from '@/stores/recommendations'

const route = useRoute()

// Search parameters interface matching the SearchForm
interface SearchParams {
  location: string
  locationType: string
  areaM2: number
  sunlight: string
  windExposure: string
  containers: boolean
  containerSizes: string[]
  goal: string
  edibleTypes: string[]
  ornamentalTypes: string[]
  maintainability: string
  watering: string
  timeToResults: string
  seasonIntent: string
  colors: string[]
  fragrant: boolean
  pollenSensitive: boolean
  petsOrToddlers: boolean
  budget: string
  hasBasicTools: boolean
  organicOnly: boolean
}

// Reactive state management
// showResults now comes from store; keep this local removed to avoid duplicate declarations
const selectedPlant = ref<Plant | null>(null)     // Currently selected plant for modal display
const searchParams = ref<SearchParams>({          // Current search form parameters
  location: '',
  locationType: '',
  areaM2: 2.0,
  sunlight: '',
  windExposure: '',
  containers: false,
  containerSizes: [],
  goal: '',
  edibleTypes: [],
  ornamentalTypes: [],
  maintainability: '',
  watering: '',
  timeToResults: '',
  seasonIntent: '',
  colors: [],
  fragrant: false,
  pollenSensitive: false,
  petsOrToddlers: false,
  budget: '',
  hasBasicTools: false,
  organicOnly: false,
})
const recStore = useRecommendationsStore()
const plants = computed(() => recStore.plants)
const loading = computed(() => recStore.loading)
const error = computed(() => recStore.error)
const showResults = computed(() => recStore.showResults)

// show 6 first, then reveal all 9 on click
const initialCount = 6
const showAll = ref(false)
const visiblePlants = computed(() => {
  return showAll.value ? plants.value : plants.value.slice(0, initialCount)
})

// Filter data for sidebar
const filterData = ref({
  areaM2: 2.0,
  windExposure: '',
  containers: false,
  containerSizes: [] as string[],
  maintainability: '',
  watering: '',
  seasonIntent: '',
  colors: [] as string[],
  fragrant: false,
  pollenSensitive: false,
  petsOrToddlers: false,
  budget: '',
  hasBasicTools: false,
  organicOnly: false,
})

// Handle search form submission - make API call and show results
const handleFindPlants = async (params: SearchParams) => {
  console.group('[SEARCH] Plant Search Debug')
  console.log('[SEARCH] Initiated with parameters:', params)

  searchParams.value = params
  await recStore.submitSearch(params)
}

// Handle plant selection from results - opens plant detail modal
const selectPlant = (plant: Plant) => {
  selectedPlant.value = plant
}

// Handle modal close - clears selected plant
const closeModal = () => {
  selectedPlant.value = null
}

// Handle filter updates from sidebar
const handleUpdateFilters = async (filters: typeof filterData.value) => {
  filterData.value = { ...filters }
  // Update search params with filter data
  Object.assign(searchParams.value, filters)
  // Trigger a new search if results are already showing
  if (showResults.value && searchParams.value.location) {
    await recStore.submitSearch(searchParams.value)
  }
}

// Handle route query parameters (from dashboard redirect)
const handleRouteQuery = () => {
  const suburb = route.query.suburb as string | undefined
  if (suburb) {
    // Clear previous results when coming from dashboard
    recStore.clearResults()
    // Prefill location in search params (will be picked up by SearchForm)
    searchParams.value.location = suburb
    // Clear the query parameter after handling it
    // Note: We don't clear it from the URL to preserve the link
  }
}

// Watch for route changes (in case user navigates away and back)
watch(() => route.query.suburb, (newSuburb) => {
  if (newSuburb) {
    // Clear results and prefill location
    recStore.clearResults()
    searchParams.value.location = String(newSuburb)
  }
}, { immediate: false })

// Check for suburb query parameter on mount
onMounted(() => {
  handleRouteQuery()
})
</script>

<style scoped>
/* Proportional scale wrapper (keeps layout, scales to 90%) */
.scale-root {
  width: 100%;
}

.scale-inner {
  --rec-scale: 0.9;
  position: relative;
  left: 50%;
  transform: translateX(-50%) scale(var(--rec-scale));
  transform-origin: top left;
  width: 100%;
}

/* Slightly shift results area to the right after scaling */
.results-shift {
  transform: translateX(calc(-50% + 25px)) scale(var(--rec-scale));
}

/* Background and Page Setup */
.recommendations-page {
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
.recommendations-page .container-fluid {
  padding-left: 0;
  padding-right: 0;
}

/* Remove any potential white backgrounds from results area */
/* Ensure only top bar and filter use overlay; everything else stays transparent */
.results-container > *:not(.alert),
.content-section,
.results-column,
.content-panel,
.container-xl {
  background: transparent !important;
}

/* Remove the overlay - we want clean white background above plant image */

.recommendations-page::after {
  content: '';
  position: fixed;
  top: 0; /* Cover entire viewport from the very top */
  left: 0;
  right: 0;
  bottom: 0;
  background: url('@/assets/photo/plant-1.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  z-index: -2;
  pointer-events: none;
}

/* (Reverted) removed global scale-down rules */

/* Top Search Section - Full Width (unchanged) */
.top-search-section {
  background: transparent;
  border-bottom: 0;
  padding: 1rem 0;
  margin-top: 20px; /* Space for navbar */
  position: relative; /* keeps overlay scoped to this section */
  z-index: 1; /* only above page background */
  backdrop-filter: none;
  width: 100%; /* Full screen width */
  isolation: isolate; /* Create stacking context for background layer */
}

/* Full-width background for the top search section */
.top-search-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  backdrop-filter: none;
  z-index: -1;
  pointer-events: none; /* ensure clicks pass through to form controls */
}

/* Inline filter next to search without affecting search width */
.top-inline {
  position: relative;
}

.filter-col {
  position: absolute;
  top: 3.075rem;
  right: -100px; /* move filter slightly left (reduce negative right) */
  z-index: 3;
}

/* Prevent clipping around ~1940px: pull filter slightly inward */


@media (max-width: 1870px) {
  .filter-col { right: -100px; top: 3.675rem; }
}

/* Responsive adjustments for filter button position */
@media (max-width: 1600px) {
  .filter-col { right: -100px; top: 3.775rem; }
}
@media (max-width: 1440px) {
  .filter-col { right: -100px; top: 3.775rem; }
}
@media (max-width: 1320px) {
  .filter-col { right: -100px; top: 3.775rem; }
}
@media (max-width: 1200px) {
  .filter-col {
    position: static;
    margin-top: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }
}

/* Filter section placed below the top search area */
.filter-below {
  padding: 1rem 0 0 0;
  width: 280px;
  max-width: 100%;
}

/* Main Content Area */
/* Two-column layout */
.content-section {
  padding-top: 0; /* stick filter to bottom edge of the top white area */
}

.content-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  align-items: start;
  min-height: 400px;
}

.filters-column {
  width: 280px;
  margin-left: 0; /* stick to the very left */
  position: sticky;
  top: 80px; /* stick below navbar when it touches top */
  align-self: start;
  z-index: 2; /* above top section */
  display: block; /* ensure it's always visible */
}

.results-column {
  min-width: 0;
  overflow-x: hidden; /* Prevent horizontal overflow */
}

/* Right Content Panel */
.content-panel {
  padding: 1.5rem 0;
  background: transparent;
  min-height: calc(100vh - 160px);
}

/* Results Container */
.results-container {
  background: transparent;
  backdrop-filter: none;
  border-radius: 0.5rem;
  padding: 1.5rem;
  min-height: 400px;
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

.loading-state p {
  color: #ffffff;
}

/* Plant Results Grid */
.plant-results {
  padding: 1rem 0;
}

.plant-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 1rem;
  margin-left: 0;
  justify-content: start;
  justify-items: start;
  /* Match search form width */
  max-width: calc(100vw - 280px - 3rem); /* Account for filter width and gaps */
  width: 100%;
}

/* Nudge only the second row of cards slightly to the right on wide screens (3 cols) */
/* Keep all rows aligned; no horizontal offsets */

/* Custom Alert Styles */
.error-state .alert {
  background: rgba(254, 242, 242, 0.8) !important;
  border-color: rgba(254, 202, 202, 0.6) !important;
  backdrop-filter: blur(8px);
}

.view-more-btn {
  background: linear-gradient(135deg, #10b981, #22c55e);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1.1rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(16, 185, 129, 0.35);
  transition: transform .15s ease, box-shadow .15s ease;
}
.view-more-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(16,185,129,0.45); }
.view-more-btn:active { transform: translateY(0); box-shadow: 0 4px 10px rgba(16,185,129,0.35); }

/* Explore-More style toggle */
.more-toggle {
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  user-select: none;
}
.more-text {
  color: #ffffff;
  font-weight: 800;
  letter-spacing: 0.25px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.6);
}
.more-icon {
  width: 28px;
  height: 28px;
  color: #34d399;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
  transition: transform .2s ease;
}
.more-toggle:hover .more-icon.down { transform: translateY(2px); }
.more-toggle:hover .more-icon.up { transform: translateY(-2px); }

.no-results-state .alert {
  background: rgba(239, 246, 255, 0.8) !important;
  border-color: rgba(191, 219, 254, 0.6) !important;
  backdrop-filter: blur(8px);
}

/* Responsive Adjustments - Very conservative to prevent overlap */
@media (max-width: 2000px) {
  .plant-grid {
    margin-left: 0; /* Align to container */
    max-width: calc(100vw - 280px - 2rem);
  }
}

@media (max-width: 1800px) {
  .plant-grid {
    margin-left: 0; /* Align to container */
    max-width: calc(100vw - 280px - 2rem);
  }
}

@media (max-width: 1700px) {
  .plant-grid {
    margin-left: 0; /* Align to container */
    max-width: calc(100vw - 280px - 2rem);
  }
}

@media (max-width: 1650px) {
  .plant-grid {
    margin-left: 0; /* Remove negative margin completely */
    max-width: calc(100vw - 280px - 1.5rem);
  }
}

@media (max-width: 1500px) {
  .plant-grid {
    margin-left: 0; /* Remove all negative margin */
    max-width: calc(100vw - 280px - 1.5rem);
  }
}

@media (max-width: 1400px) {
  .plant-grid {
    margin-left: 0; /* Keep safe */
    max-width: calc(100vw - 280px - 1.5rem);
  }
}

@media (max-width: 1300px) {
  .plant-grid {
    margin-left: 0; /* No negative margin at all */
    max-width: calc(100vw - 280px - 1.5rem);
  }
}

@media (max-width: 1200px) {
  .plant-grid {
    margin-left: 0; /* Keep safe */
    max-width: 100%;
    grid-template-columns: repeat(2, 1fr); /* 2 columns on medium screens */
  }
  /* When 2 columns, the second row starts from the 3rd item */
  .plant-grid > *:nth-child(n+3) {
    transform: translateX(12px);
  }
}

@media (max-width: 991.98px) {
  .content-panel {
    padding: 1rem;
  }

  .plant-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-left: 0; /* Ensure no overlap on smaller screens */
    max-width: 100%;
  }
}

@media (max-width: 767.98px) {
  .plant-grid {
    grid-template-columns: 1fr; /* Single column on mobile */
    gap: 1rem;
    max-width: 100%;
  }
}

@media (max-width: 1199.98px) {
  .filter-below {
    width: 250px;
  }
}

@media (max-width: 991.98px) {
  .filter-below {
    width: 100%;
    max-width: 600px;
    margin: 1rem auto 0;
  }
}

@media (max-width: 1024px) {
  /* Tablet and below - stack filters above results */
  .content-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .filters-column {
    width: 100%;
    position: static;
    order: -1; /* Show filters above results */
  }

  /* Keep filter flowing normally on small screens */
  .filter-col {
    position: static;
    margin-top: 0.5rem;
  }
}

@media (max-width: 767.98px) {
  /* Mobile devices */
  .top-search-section {
    padding: 0.75rem 0;
  }

  .content-panel {
    padding: 1rem;
  }

}

@media (max-width: 575.98px) {
  /* Extra small devices */
  .content-panel {
    padding: 0.75rem;
  }
}

/* Remove left placeholder column on wide screens so results can align left */
@media (min-width: 1025px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
  .filters-column {
    display: none;
  }
}
</style>
