<template>
  <!-- 
    Plant Detail Modal Component
    Full-screen modal displaying comprehensive plant information
    Includes plant image, care requirements, benefits, and sustainability data
  -->
  <div v-if="plant" class="plant-detail-overlay" @click="$emit('close')">
    <!-- Modal Container - prevents close on modal content click -->
    <div class="plant-detail-modal" @click.stop>
      <!-- Back/Close Button -->
      <button @click="$emit('close')" class="back-button">
        <ArrowLeftIcon class="w-5 h-5" />
        Back
      </button>

      <!-- Main Content Container with Top Image Layout -->
      <div class="plant-detail-container">
        <!-- Top Section - Plant Image -->
        <div class="plant-detail-image">
          <img 
            v-if="!imageError && getImageSrcComputed" 
            :src="getImageSrcComputed"
            :alt="plant.name"
            class="plant-image"
            @error="handleImageError"
          />
          <!-- Fallback placeholder if no image or image fails to load -->
          <div v-if="imageError" class="image-placeholder">
            <div class="placeholder-icon">Plant</div>
            <span class="placeholder-text">{{ plant.category || 'Plant' }}</span>
          </div>
        </div>

        <!-- Bottom Section - Plant Information -->
        <div class="plant-detail-info">
          <!-- Plant Header -->
          <div class="plant-header">
            <h2 class="plant-detail-title">{{ plant.name }}</h2>
            <p class="plant-detail-scientific">{{ plant.scientificName }}</p>
            <div class="recommendation-score" v-if="plant.score">
              <span class="score-label">Recommendation Score:</span>
              <span class="score-value">{{ plant.score.toFixed(1) }}/100</span>
              <button class="impact-btn" @click="openImpact">View Impact</button>
            </div>
          </div>

          <!-- Information Grid -->
          <div class="info-grid">
            <!-- Description Section -->
            <div class="info-card">
              <h3 class="card-title">Description:</h3>
              <div class="card-content plant-description" v-html="renderedDescription"></div>
              <div class="recommendation-reasons" v-if="plant.whyRecommended?.length">
                <p v-for="reason in plant.whyRecommended" :key="reason" class="reason-item">
                  - {{ reason }}
                </p>
              </div>
            </div>

            <!-- Sowing Information Card -->
            <div class="info-card" v-if="plant.sowingInfo">
              <h3 class="card-title">Sowing Information:</h3>
              <div class="card-content">
                <div class="info-item">
                  <span class="info-icon">Climate:</span>
                  <span>{{ plant.sowingInfo.climateZone }}</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">Months:</span>
                  <span>{{ plant.sowingInfo.months.join(', ') }}</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">Season:</span>
                  <span>{{ plant.sowingInfo.seasonLabel }}</span>
                </div>
                <div class="info-item" v-if="plant.timeToMaturity">
                  <span class="info-icon">Time:</span>
                  <span>{{ plant.timeToMaturity }} days</span>
                </div>
              </div>
            </div>

            <!-- Growing Requirements Card -->
            <div class="info-card">
              <h3 class="card-title">Growing Requirements:</h3>
              <div class="card-content">
                <div class="info-item">
                  <span class="info-icon">Sun:</span>
                  <span>{{ formatSunlight(plant.sunlight || '') }}</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">Water:</span>
                  <span>{{ plant.water }}</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">Effort:</span>
                  <span>{{ plant.effort }} Maintenance</span>
                </div>
              </div>
            </div>

            <!-- Sustainability Impact Card -->
            <div class="info-card">
              <h3 class="card-title">Sustainability Impact:</h3>
              <div class="card-content">
                <div class="info-item">
                  <span class="info-icon">Cooling:</span>
                  <span>{{ plant.coolingEffect }}</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">Carbon:</span>
                  <span>{{ plant.carbonReduction }}</span>
                </div>
                <div class="info-item">
                  <span class="info-icon">Drought:</span>
                  <span>{{ plant.droughtTolerance }}</span>
                </div>
              </div>
            </div>

            <!-- Plant Benefits Card -->
            <div class="info-card">
              <h3 class="card-title">Benefits:</h3>
              <div class="card-content benefits-grid">
                <!-- Positive Benefits (Green checkmarks) -->
                <div
                  v-if="plant?.benefits?.petSafe"
                  class="benefit-item benefit-positive"
                >
                  <span class="benefit-icon">+</span>
                  <span>Pet Safe</span>
                </div>
                <div
                  v-if="plant?.benefits?.fragrant"
                  class="benefit-item benefit-positive"
                >
                  <span class="benefit-icon">+</span>
                  <span>Attracts Birds</span>
                </div>
                <div
                  v-if="plant?.benefits?.airPurifying"
                  class="benefit-item benefit-positive"
                >
                  <span class="benefit-icon">+</span>
                  <span>Air Purifying</span>
                </div>
                <div v-if="plant?.benefits?.edible" class="benefit-item benefit-positive">
                  <span class="benefit-icon">+</span>
                  <span>Edible</span>
                </div>
                <div
                  v-if="plant?.benefits?.droughtResistant"
                  class="benefit-item benefit-positive"
                >
                  <span class="benefit-icon">+</span>
                  <span>Drought Resistant</span>
                </div>
                <div
                  v-if="plant?.benefits?.containerFriendly"
                  class="benefit-item benefit-positive"
                >
                  <span class="benefit-icon">+</span>
                  <span>Container Friendly</span>
                </div>
                <div
                  v-if="plant?.benefits?.indoorSuitable"
                  class="benefit-item benefit-positive"
                >
                  <span class="benefit-icon">+</span>
                  <span>Indoor Suitable</span>
                </div>
                
                <!-- Negative Benefits (Red X marks) -->
                <div
                  v-if="!plant?.benefits?.edible"
                  class="benefit-item benefit-negative"
                >
                  <span class="benefit-icon">-</span>
                  <span>Not Edible</span>
                </div>
                
                <!-- Warning Benefits (Yellow triangle) -->
                <div
                  v-if="!plant?.benefits?.petSafe"
                  class="benefit-item benefit-warning"
                >
                  <ExclamationTriangleIcon class="w-4 h-4" />
                  <span>Not Pet Safe</span>
                </div>
              </div>
            </div>

            <!-- Care Tips Card -->
            <div class="info-card">
              <h3 class="card-title">Care Tips:</h3>
              <div class="card-content">
                <ul class="care-tips-list">
                  <li>Plant in sunny spot with well-drained soil</li>
                  <li>Water deeply once per week in summer</li>
                  <li>Prune lightly after flowering</li>
                </ul>
                <!-- Link to Guides -->
                <a href="#" class="guidance-video-link" @click.prevent="goToGuides"> View Guides </a>
              </div>
            </div>
          </div>

          <!-- View History Section -->
          <ViewHistory 
            ref="viewHistoryRef"
            @select-plant="handleHistoryPlantSelect"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Impact Modal (inside detail modal) -->
  <div v-if="showImpact" class="impact-overlay" @click.self="closeImpact">
    <div class="impact-card" role="dialog" aria-modal="true">
      <div class="impact-card-header">
        <div class="impact-title">Quantified Impact</div>
        <button class="impact-close" @click="closeImpact" aria-label="Close">&times;</button>
      </div>
      <div class="impact-body">
        <div v-if="impactLoading" class="placeholder-text">Loading impact...</div>
        <div v-else-if="impactError" class="placeholder-text">{{ impactError }}</div>
        <div v-else-if="impactData" class="impact-proto">
          <!-- Top: gauge + bars + callout -->
          <div class="impact-top">
            <div class="gauge-card">
              <svg class="gauge" viewBox="0 0 200 110" aria-label="CO2 absorption gauge">
                <path d="M10,100 A90,90 0 0,1 190,100" fill="none" stroke="#e5e7eb" stroke-width="14" />
                <g v-for="t in 9" :key="'tick-'+t" :transform="tickTransform(t)">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#9ca3af" stroke-width="2" />
                </g>
                <g :transform="needleTransform">
                  <line x1="100" y1="100" x2="100" y2="26" stroke="#065f46" stroke-width="4" />
                  <circle cx="100" cy="100" r="7" fill="#065f46" />
                </g>
              </svg>
              <div class="gauge-label">CO2 absorption capacity</div>
              <div class="gauge-value">{{ co2Absorption.toFixed(1) }} kg/year</div>
            </div>

            <div class="bars-callout">
              <div class="bars">
                <div class="bar-row">
                  <div class="bar-label">Cooling Effect</div>
                  <div class="bar"><div class="bar-fill cooling" :style="{ width: coolingEffectPercent + '%' }"></div></div>
                  <div class="bar-value">{{ temperatureReduction.toFixed(1) }} °C</div>
                </div>
                <div class="bar-row">
                  <div class="bar-label">Air Quality</div>
                  <div class="bar"><div class="bar-fill air" :style="{ width: airPointsPercent + '%' }"></div></div>
                  <div class="bar-value">{{ airQualityPoints }}</div>
                </div>
                <div class="bar-row">
                  <div class="bar-label">Water Processed</div>
                  <div class="bar"><div class="bar-fill water" :style="{ width: waterProcessedPercent + '%' }"></div></div>
                  <div class="bar-value">{{ waterProcessed.toFixed(1) }} L/week</div>
                </div>
              </div>

              <div class="callout">
                <div class="callout-title">Supports pollinators</div>
                <div class="callout-text">Helps filter dust/pollution and boosts local biodiversity.</div>
              </div>
            </div>
          </div>

          <!-- KPI grid -->
          <div class="kpi-grid">
            <div class="kpi"><div class="kpi-title">Temperature Reduction</div><div class="kpi-value">{{ temperatureReduction.toFixed(1) }} °C</div></div>
            <div class="kpi"><div class="kpi-title">Air Quality Points</div><div class="kpi-value">{{ airQualityPoints }}</div></div>
            <div class="kpi"><div class="kpi-title">CO2 Absorption</div><div class="kpi-value">{{ co2Absorption.toFixed(1) }} kg/year</div></div>
            <div class="kpi"><div class="kpi-title">Water Processed</div><div class="kpi-value">{{ waterProcessed.toFixed(1) }} L/week</div></div>
            <div class="kpi"><div class="kpi-title">Pollinator Support</div><div class="kpi-value">{{ pollinatorSupport }}</div></div>
            <div class="kpi"><div class="kpi-title">Confidence</div><div class="kpi-value">{{ confidence }}</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import type { Plant } from '@/services/api'
import { addToViewHistory } from '@/services/viewHistory'
import ViewHistory from './ViewHistory.vue'
import { renderMarkdown } from '@/services/markdownService'
import { plantApiService } from '@/services/api'
import { useRecommendationsStore } from '@/stores/recommendations'

// Component props - receives plant data or null when modal is closed
const props = defineProps<{
  plant: Plant | null
}>()

// Component events - emits close event when modal is dismissed
const emit = defineEmits<{
  close: []
  'select-plant': [plant: Plant]
}>()
// Router for navigation to Guides
const router = useRouter()
const recStore = useRecommendationsStore()

function goToGuides() {
  router.push('/guides')
  emit('close')
}

// State for handling image loading errors
const imageError = ref(false)

// Markdown rendering computed property
const renderedDescription = computed(() => {
  if (!props.plant || !props.plant.description) {
    return 'No description available.'
  }
  return renderMarkdown(props.plant.description)
})

// Reference to ViewHistory component
const viewHistoryRef = ref<InstanceType<typeof ViewHistory> | null>(null)

// Watch for plant changes and add to view history
watch(() => props.plant, (newPlant) => {
  if (newPlant) {
    addToViewHistory(newPlant)
    // Refresh history display after a short delay to ensure the new item is saved
    setTimeout(() => {
      viewHistoryRef.value?.refreshHistory()
    }, 100)
  }
}, { immediate: true })

// Handle plant selection from history
const handleHistoryPlantSelect = (plant: Plant) => {
  emit('select-plant', plant)
}

// Impact modal state
const showImpact = ref(false)
const impactLoading = ref(false)
const impactError = ref<string | null>(null)
import type { ApiQuantifyResponse } from '@/services/api'
const impactData = ref<ApiQuantifyResponse | null>(null)

// Derived values for prototype visuals (fallback to 0 if missing)
const temperatureReduction = computed(() => Number(impactData.value?.quantified_impact.temperature_reduction_c || 0))
const airQualityPoints = computed<number>(() => Number(impactData.value?.quantified_impact.air_quality_points || 0))
const co2Absorption = computed<number>(() => Number(impactData.value?.quantified_impact.co2_absorption_kg_year || 0))
const waterProcessed = computed<number>(() => Number(impactData.value?.quantified_impact.water_processed_l_week || 0))
const pollinatorSupport = computed<string>(() => String(impactData.value?.quantified_impact.pollinator_support || 'Unknown'))
const confidence = computed<string>(() => String(impactData.value?.quantified_impact.confidence_level || 'Unknown'))

// Gauge helpers
const co2Max = 50
const angle = computed(() => {
  const v = Math.max(0, Math.min(co2Absorption.value, co2Max))
  return -90 + (v / co2Max) * 180
})
const needleTransform = computed(() => `rotate(${angle.value} 100 100)`)
function tickTransform(t: number) {
  const a = -90 + (t / 9) * 180
  const rad = (a * Math.PI) / 180
  const r = 80
  const cx = 100 + Math.cos(rad) * r
  const cy = 100 + Math.sin(rad) * r
  return `translate(${cx} ${cy}) rotate(${a})`
}

// Bars percentages
const coolingEffectPercent = computed(() => Math.min(100, Math.max(0, (temperatureReduction.value / 2) * 100)))
const airPointsPercent = computed(() => Math.min(100, (airQualityPoints.value / 10) * 100))
const waterProcessedPercent = computed(() => Math.min(100, (waterProcessed.value / 10) * 100))

function openImpact() {
  showImpact.value = true
  if (!impactData.value) {
    fetchImpact()
  }
}

function closeImpact() {
  showImpact.value = false
}

async function fetchImpact() {
  if (!props.plant) return
  impactLoading.value = true
  impactError.value = null
  try {
    const res = await plantApiService.quantifyPlantImpact({
      plant_name: props.plant.name,
      suburb: recStore.lastParams?.location || 'Richmond',
      climate_zone: undefined,
      plant_count: 1,
      user_preferences: {},
    })
    impactData.value = res
  } catch (e) {
    impactError.value = e instanceof Error ? e.message : 'Failed to load impact'
  } finally {
    impactLoading.value = false
  }
}

// Function to get image source (Base64 or URL)
const getImageSource = (): string => {
  if (!props.plant) return ''

  // 0) New API base64 field
  const imageBase64 = (props.plant as unknown as { image_base64?: string }).image_base64
  if (imageBase64) return imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`

  // 1) Legacy base64 field
  if (props.plant.imageData) return props.plant.imageData.startsWith('data:') ? props.plant.imageData : `data:image/jpeg;base64,${props.plant.imageData}`

  // 2) API-provided image_url (backend now provides; prefer any host)
  const imageUrl = (props.plant as unknown as { image_url?: string }).image_url
  if (imageUrl) return imageUrl

  // 3) Relative image path served by backend (proxy endpoints)
  if (props.plant.imagePath) return getImageUrl(props.plant.imagePath)

  // 4) Category placeholder image (default image)
  return getCategoryPlaceholder()
}

const getImageSrcComputed = computed<string | null>(() => {
  const s = getImageSource()
  return s && typeof s === 'string' ? s : null
})

// Function to construct full image URL (fallback method)
const getImageUrl = (imagePath: string): string => {
  // If the path is already a full URL, use it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // If it's a relative path, construct candidate URLs with backend base
  const primaryUrl = import.meta.env.VITE_API_URL || 'https://budgets-accepting-porcelain-austin.trycloudflare.com'
  const candidates = [
    `${primaryUrl}/api/v1/plant-image/${encodeURIComponent(imagePath)}`,
    `${primaryUrl}/api/v1/plant-image?path=${encodeURIComponent(imagePath)}`,
    `${primaryUrl}/api/v1/images/${encodeURIComponent(imagePath)}`,
    `${primaryUrl}/static/${imagePath}`,
    `${primaryUrl}/media/${imagePath}`,
  ]
  return candidates[0]
}

// Category placeholder
const getCategoryPlaceholder = (): string => {
  const category = props.plant?.category?.toLowerCase()
  switch (category) {
    case 'flower':
      return '/Flower.jpg'
    case 'herb':
      return '/Herb.jpg'
    case 'vegetable':
      return '/Vegetable.jpg'
    default:
      return '/placeholder-plant.svg'
  }
}

// Handle image loading errors
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  const fallback = getCategoryPlaceholder()
  // If not already showing fallback, switch to fallback image
  if (!img.src.includes(fallback)) {
    img.src = fallback
    return
  }
  // If even fallback fails, hide image and show placeholder block
  imageError.value = true
  img.style.display = 'none'
}

// Helper function to format sunlight requirements for display
const formatSunlight = (sunlight: string): string => {
  switch (sunlight) {
    case 'full':
      return 'Full Sun'
    case 'partial':
      return 'Partial Sun'
    case 'shade':
      return 'Shade'
    default:
      return sunlight // Return original value if not recognized
  }
}
</script>

<style scoped>
.plant-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  backdrop-filter: blur(8px);
}

.plant-detail-modal {
  background: white;
  border-radius: 1.5rem;
  padding: 2rem;
  max-width: 1200px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #a7f3d0;
  border-radius: 0.75rem;
  color: #047857;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2rem;
}

.back-button:hover {
  background: #f0fdf4;
  border-color: #059669;
}

.plant-detail-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
  overflow: hidden;
}

.plant-detail-image .plant-image {
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

.plant-detail-image .placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.plant-detail-image .placeholder-text {
  font-size: 1.125rem;
  font-weight: 600;
  text-transform: capitalize;
  opacity: 0.8;
}

.plant-detail-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plant-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #a7f3d0;
}

.recommendation-score {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.score-label {
  font-weight: 600;
  color: #047857;
}

.score-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
  background: #f0fdf4;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  border: 2px solid #a7f3d0;
}

.impact-btn {
  margin-left: 0.5rem;
  background: linear-gradient(135deg, #10b981, #22c55e);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 0.45rem 0.9rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(16, 185, 129, 0.4);
  transition: transform .15s ease, box-shadow .15s ease, background-color .15s ease;
}
.impact-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(16,185,129,0.45); }
.impact-btn:active { transform: translateY(0); box-shadow: 0 4px 10px rgba(16,185,129,0.35); }

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.info-card:hover {
  border-color: #a7f3d0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #047857;
  margin: 0 0 1rem 0;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: white;
  border-radius: 0.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: nowrap;
}

.info-item:last-child {
  border-bottom: none;
}

.info-icon {
  font-size: 0.875rem;
  font-weight: 600;
  color: #047857;
  min-width: 4rem;
  flex-shrink: 0;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
}

.plant-basic-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.plant-detail-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #047857;
  margin: 0;
}

.plant-detail-scientific {
  font-size: 1rem;
  color: #059669;
  font-style: italic;
  margin: 0;
}

.plant-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #047857;
  margin-bottom: 0.5rem;
}

.plant-section p {
  color: #059669;
  line-height: 1.6;
  margin: 0;
}

.requirement-list,
.impact-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.requirement-item,
.impact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #047857;
  font-weight: 500;
}

.requirement-icon,
.impact-icon {
  font-size: 1rem;
}

.recommendation-reasons {
  margin-top: 0.5rem;
}

.reason-item {
  color: #059669;
  line-height: 1.5;
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.sowing-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sowing-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #047857;
  font-weight: 500;
}

.sowing-icon {
  font-size: 1rem;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.benefit-positive {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  color: #047857;
}

.benefit-negative {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #991b1b;
}

.benefit-warning {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.benefit-icon {
  font-size: 1rem;
}

.care-tips-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #047857;
  margin-bottom: 0.5rem;
}

.care-tips-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.care-tips-list li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #a7f3d0;
  color: #059669;
  font-weight: 500;
}

.care-tips-list li:last-child {
  border-bottom: none;
}

.guidance-video-link {
  display: inline-block;
  color: #047857;
  text-decoration: underline;
  font-weight: 600;
  transition: color 0.2s;
}

.guidance-video-link:hover {
  color: #065f46;
}

/* Impact modal */
.impact-overlay { position: fixed; inset: 0; z-index: 120; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.impact-card { width: min(900px, 96%); background: #ffffff; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.35); overflow: hidden; }
.impact-card-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
.impact-title { font-weight: 700; color: #065f46; }
.impact-close { background: transparent; border: none; font-size: 1.5rem; line-height: 1; cursor: pointer; color: #374151; }
.impact-body { padding: 1rem 1.25rem; }

/* Prototype-style layout */
.impact-proto { display: grid; gap: 1rem; }
.impact-top { display: grid; grid-template-columns: 320px 1fr; gap: 1rem; align-items: center; }
.gauge-card { display: flex; flex-direction: column; align-items: center; }
.gauge { width: 100%; max-width: 320px; height: auto; }
.gauge-label { margin-top: 4px; color: #374151; font-weight: 600; }
.gauge-value { color: #065f46; font-weight: 700; }

.bars-callout { display: grid; grid-template-columns: 1fr 260px; gap: 1rem; align-items: start; }
.bars { display: grid; gap: 10px; }
.bar-row { display: grid; grid-template-columns: 140px 1fr 80px; align-items: center; gap: 8px; }
.bar-label { color: #374151; font-size: 12px; }
.bar { height: 10px; background: #eef2f7; border-radius: 8px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 8px; }
.bar-fill.cooling { background: #60a5fa; }
.bar-fill.air { background: #34d399; }
.bar-fill.water { background: #93c5fd; }
.bar-value { text-align: right; color: #374151; font-size: 12px; }

.callout { background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 12px; }
.callout-title { font-weight: 700; color: #065f46; margin-bottom: 4px; }
.callout-text { color: #065f46; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
.kpi { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
.kpi-title { color: #065f46; font-weight: 700; margin-bottom: 4px; font-size: 0.9rem; }
.kpi-value { color: #111827; font-weight: 700; }

.w-5 {
  width: 1.25rem;
}
.h-5 {
  height: 1.25rem;
}
.w-4 {
  width: 1rem;
}
.h-4 {
  height: 1rem;
}

@media (max-width: 768px) {
  .plant-detail-modal {
    width: 98%;
    padding: 1rem;
    max-height: 95vh;
  }
  
  .plant-detail-image {
    width: fit-content;
    max-width: 95%;
    padding: 0.25rem;
  }
  
  .plant-detail-image .plant-image {
    max-height: 200px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .info-card {
    padding: 1rem;
  }
  
  .benefits-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .plant-detail-modal {
    padding: 0.75rem;
  }
  
  .plant-detail-image {
    width: fit-content;
    max-width: 98%;
    padding: 0.25rem;
  }
  
  .plant-detail-image .plant-image {
    max-height: 150px;
  }
  
  .plant-detail-title {
    font-size: 1.25rem;
  }
}
</style>