<template>
  <!-- 
    Single Plant Card Component
    Displays an individual plant with image, details, icons, and action button
    Emits 'select' event when clicked to open plant details modal
  -->
  <div class="plant-card" :style="cardStyle" @click="$emit('select', plant)">
    <!-- Plant Image Section -->
    <div class="plant-card-image">

      
      <img 
        :src="getImageSource()"
        :alt="plant.name"
        class="plant-image"
        @error="handleImageError"
        @load="() => {}"
      />
    </div>

    <!-- Plant Information Section -->
    <div class="plant-card-content" :style="contentStyle">
      <!-- Plant Name with Score -->
      <div class="plant-header">
        <h3 class="plant-card-title">{{ plant.name }}</h3>
        <div class="plant-score" v-if="plant.score">
          {{ plant.score.toFixed(1) }}/100
        </div>
      </div>
      
      <!-- Plant Description with clamp/expand + favourite star -->
      <div ref="descRef" class="plant-card-description" :class="{ clamped: !isExpanded }" v-html="renderedDescription"></div>
      <button
        v-if="isExpanded || canClamp"
        class="show-more-btn"
        @click.stop="isExpanded = !isExpanded"
      >
        {{ isExpanded ? 'Show less' : 'Show more' }}
      </button>

      <!-- Bottom group: Requirements (element) + Why + Learn More stick to bottom -->
      <div class="bottom-actions">
        <!-- Plant Care Requirements (separated component) placed right above Why -->
        <PlantRequirements 
          :sunlight="plant.sunlight || ''"
          :water="plant.water || ''"
          :effort="plant.effort || ''"
        />
        <!-- Why This Plant is Recommended Section -->
        <div class="why-recommended">
          <strong>Why Recommended:</strong> 
          <span v-if="Array.isArray(plant.whyRecommended)">
            {{ plant.whyRecommended.join(' ') }}
          </span>
          <span v-else>
            {{ plant.whyRecommended }}
          </span>
        </div>

        <!-- Action Button to View Plant Details -->
        <div class="actions-row">
          <button class="learn-more-button" @click.stop="$emit('select', plant)">
            Learn More
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { Plant } from '@/services/api'
import { renderMarkdownInline } from '@/services/markdownService'
import PlantRequirements from './PlantRequirements.vue'

// Component props - receives plant data
const props = defineProps<{
  plant: Plant
}>()

// Component events - emits when plant is selected
defineEmits<{
  select: [plant: Plant]
}>()

// State for handling image loading errors
const imageError = ref(false)
const currentImageUrl = ref('')
const urlIndex = ref(0)
const allPossibleUrls = ref<string[]>([])

// Markdown rendering computed property
const renderedDescription = computed(() => {
  if (!props.plant.description) {
    return 'No description available.'
  }
  return renderMarkdownInline(props.plant.description)
})

// Clamp/expand state for description
const isExpanded = ref(false)
const descRef = ref<HTMLElement | null>(null)
const canClamp = ref(false)


onMounted(() => {
  nextTick(() => {
    const el = descRef.value
    if (!el) return
    // Temporarily apply clamp to measure overflow
    const wasExpanded = isExpanded.value
    isExpanded.value = false
    nextTick(() => {
      canClamp.value = el.scrollHeight > el.clientHeight + 4
      isExpanded.value = wasExpanded
    })
  })
})

// Dynamic color palette based on plant color
type Palette = { bgStart: string; bgEnd: string; border: string }
const normalizeColor = (s?: string): string => String(s || '').toLowerCase()
const pickDominantColor = (): string => {
  const arr = (props.plant.flower_colors || []) as (string | undefined)[]
  if (Array.isArray(arr) && arr.length > 0) return normalizeColor(arr[0])
  // attempt parse from description keywords
  const desc = normalizeColor(props.plant.description)
  const keywords = ['red','pink','purple','blue','yellow','orange','white','green']
  for (const k of keywords) if (desc.includes(k)) return k
  return 'default'
}
const toPalette = (c: string): Palette => {
  switch (c) {
    case 'red':
      return { bgStart: '#f87171', bgEnd: '#ef4444', border: '#b91c1c' }
    case 'pink':
      return { bgStart: '#f472b6', bgEnd: '#ec4899', border: '#be185d' }
    case 'purple':
      return { bgStart: '#a78bfa', bgEnd: '#8b5cf6', border: '#6d28d9' }
    case 'blue':
      return { bgStart: '#60a5fa', bgEnd: '#3b82f6', border: '#1d4ed8' }
    case 'yellow':
      return { bgStart: '#f59e0b', bgEnd: '#d97706', border: '#b45309' }
    case 'orange':
      return { bgStart: '#fb923c', bgEnd: '#f97316', border: '#c2410c' }
    case 'white':
      return { bgStart: '#e5e7eb', bgEnd: '#d1d5db', border: '#9ca3af' }
    case 'green':
      return { bgStart: '#34d399', bgEnd: '#10b981', border: '#047857' }
    default:
      return { bgStart: '#e8f6ee', bgEnd: '#bbf7d0', border: '#a7f3d0' }
  }
}
const palette = computed<Palette>(() => toPalette(pickDominantColor()))
const cardStyle = computed(() => ({
  background: `linear-gradient(180deg, ${palette.value.bgStart}33 0%, ${palette.value.bgEnd}4D 55%, rgba(255,255,255,0.96) 100%)`,
  animation: 'cardPulse 6s ease-in-out infinite',
  borderColor: palette.value.border
}))

const contentStyle = computed(() => ({
  background: 'transparent'
}))

// Function to get image source with Victoria Plants Data priority
const getImageSource = (): string => {
  // Priority 1: Use Base64 data if available
  if (props.plant.imageData) {
    // Check if it's already a data URL
    if (props.plant.imageData.startsWith('data:')) {
      return props.plant.imageData
    }
    
    // If it's just the base64 string, add the data URL prefix
    return `data:image/jpeg;base64,${props.plant.imageData}`
  }
  
  // Priority 2: Try Victoria Plants Data image
  const victoriaImage = findVictoriaPlantImage()
  if (victoriaImage) {
    return victoriaImage
  }
  
  // Priority 3: Fall back to existing URL construction
  if (props.plant.imagePath) {
    return getImageUrl(props.plant.imagePath)
  }
  
  // Priority 4: Use category-specific placeholder image
  return getCategoryPlaceholder()
}

// Function to find Victoria Plants Data image
const findVictoriaPlantImage = (): string | null => {
  if (!props.plant.name || !props.plant.category) {
    return null
  }

  // Map category to folder name
  const categoryFolders: Record<string, string> = {
    'flower': 'flower_plant_images',
    'herb': 'herb_plant_images',
    'vegetable': 'vegetable_plant_images'  // Prepared for when vegetable images are added
  }

  const folderName = categoryFolders[props.plant.category.toLowerCase()]
  if (!folderName) {
    return null
  }

  // Search patterns to try
  const searchPatterns: string[] = []
  
  // Primary pattern: PlantName_ScientificName
  if (props.plant.scientificName) {
    searchPatterns.push(`${props.plant.name}_${props.plant.scientificName}`)
  }
  
  // Secondary pattern: just PlantName
  searchPatterns.push(props.plant.name)
  
  // Alternative patterns with normalized names (remove special chars)
  const normalizedPlant: string = String(props.plant.name).replace(/[^\w\s-]/g, '').trim()
  if (normalizedPlant !== props.plant.name) {
    searchPatterns.push(normalizedPlant)
    if (props.plant.scientificName) {
      const normalizedSci = props.plant.scientificName.replace(/[^\w\s-]/g, '').trim()
      searchPatterns.push(`${normalizedPlant}_${normalizedSci}`)
    }
  }

  const gcsBase = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_IMAGES_BASE_URL || 'https://storage.googleapis.com/plantopia-images-1757656642/plant_images'
  // Try each pattern to construct the image URL
  for (const pattern of searchPatterns) {
    if (!pattern) continue
    
    // Construct the expected image path (GCS)
    const imagePath = `${gcsBase}/${folderName}/${pattern}/${pattern}_1.jpg`
    
    // Return the first viable path - browser will handle 404s with our error handler
    return imagePath
  }

  return null
}

// Function to get category-specific placeholder image
const getCategoryPlaceholder = (): string => {
  const category = props.plant.category?.toLowerCase()
  
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

// Function to construct full image URL (fallback method)
const getImageUrl = (imagePath: string): string => {
  // If the path is already a full URL, use it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // Base URL for your backend with environment variables
  const primaryUrl = import.meta.env.VITE_API_URL || 'https://budgets-accepting-porcelain-austin.trycloudflare.com'
  
  // For separated frontend/backend projects, we need API endpoints
  const possibleUrls = [
    `${primaryUrl}/api/v1/plant-image/${encodeURIComponent(imagePath)}`,
    `${primaryUrl}/api/v1/plant-image?path=${encodeURIComponent(imagePath)}`,
    `${primaryUrl}/api/v1/images/${encodeURIComponent(imagePath)}`,
    `${primaryUrl}/image/${encodeURIComponent(imagePath)}`,
    `${primaryUrl}/static/${imagePath}`,           
    `${primaryUrl}/media/${imagePath}`,
  ]
  
  // Store all possible URLs for fallback
  allPossibleUrls.value = possibleUrls
  urlIndex.value = 0
  
  currentImageUrl.value = possibleUrls[0]
  return possibleUrls[0]
}

// Handle image loading errors with automatic fallback
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  
  // Simple fallback: if Victoria image fails, use category placeholder
  const placeholderUrl = getCategoryPlaceholder()
  
  // Avoid infinite loop if placeholder image also fails
  if (img.src !== placeholderUrl) {
    img.src = placeholderUrl
  } else {
    // If even the placeholder fails, hide the image
    imageError.value = true
    img.style.display = 'none'
  }
}

// requirement helpers moved to PlantRequirements component

// Grow button moved to detail modal after impact section
</script>

<style scoped>
/* Main plant card container styling */
.plant-card {
  border: 2px solid #a7f3d0;      /* Light green border */
  border-radius: 1rem;            /* Rounded corners */
  background: white;              /* White background */
  overflow: hidden;               /* Hide overflow content */
  transition: all 0.3s ease;     /* Smooth hover transition */
  cursor: pointer;                /* Show pointer cursor */
  display: flex;                  /* Stack image + content vertically */
  flex-direction: column;
}

/* Hover effect for plant card */
.plant-card:hover {
  transform: translateY(-4px);                        /* Lift card up */
  box-shadow: 0 12px 30px rgba(5, 150, 105, 0.15);  /* Add shadow */
  border-color: #059669;                              /* Darker green border */
}

/* Plant image section styling */
.plant-card-image {
  height: 200px;                                      /* Increased height for better image display */
  background: linear-gradient(135deg, #f0fdf4, #dcfce7); /* Green gradient */
  border-bottom: 2px solid #a7f3d0;                  /* Bottom border */
  display: flex;                                      /* Center content */
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;                                   /* Hide overflow for cropped images */
}

/* Actual plant image styling */
.plant-image {
  width: 100%;
  height: 100%;
  object-fit: cover;                                  /* Cover the entire area while maintaining aspect ratio */
  object-position: center;                            /* Center the image */
  transition: transform 0.3s ease;                   /* Smooth hover effect */
}

.plant-card:hover .plant-image {
  transform: scale(1.05);                             /* Slight zoom on hover */
}
@keyframes cardPulse {
  0% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(8deg); }
  100% { filter: hue-rotate(0deg); }
}

/* Image error handling - hide broken images */
.plant-image[style*="display: none"] {
  display: none !important;
}



/* Plant card content container */
.plant-card-content {
  padding: 1.5rem;              /* Inner spacing */
  display: flex;                /* Allow bottom block to push to bottom */
  flex-direction: column;
  flex: 1;                      /* Fill remaining height under image */
}
.bottom-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;                  /* tighter gaps between element and why */
  margin-top: auto;             /* push to bottom */
}

/* Plant header with title and score */
.plant-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

/* Plant name styling */
.plant-card-title {
  font-size: 1.125rem;          /* Larger font size */
  font-weight: 600;             /* Semi-bold */
  color: #ffffff;               /* White */
  margin: 0;                    /* Remove default margin */
  flex: 1;                      /* Take available space */
}

/* Plant score styling */
.plant-score {
  background: #047857;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Plant description styling */
.plant-card-description {
  color: #ffffff;               /* White */
  font-size: 0.875rem;          /* Smaller font size */
  margin-bottom: 1rem;          /* Space below */
  line-height: 1.5;             /* Better line spacing */
}

/* Ensure v-html content (not scoped) also renders in white */
:deep(.plant-card-description),
:deep(.plant-card-description *),
:deep(.plant-card-description a),
:deep(.plant-card-description a:visited) {
  color: #ffffff !important;
}


.plant-card-description.clamped {
  display: -webkit-box;
  -webkit-line-clamp: 6; /* approx half */
  -webkit-box-orient: vertical;
  overflow: hidden;
  position: relative;
}

.plant-card-description.clamped::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 2.25rem;
  background: linear-gradient(180deg, rgba(255,255,255,0), #ffffff);
}

.show-more-btn {
  background: transparent;
  border: none;
  color: #ffffff;               /* White */
  font-weight: 600;
  cursor: pointer;
  padding: 0; margin-top: -0.25rem; margin-bottom: 0.5rem;
  align-self: flex-start;
}

/* Care requirement icons container */
.plant-card-requirements {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  justify-content: space-between;
}

.requirement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}

.requirement-label {
  font-weight: 600;
  color: #047857;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.requirement-value {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

/* Why recommended section styling */
.why-recommended {
  font-size: 0.875rem;                               /* Smaller font */
  color: #1c3d21;                                     /* Keep dark text */
  margin-top: 0.5rem;                                 /* small top gap from requirements */
  margin-bottom: 1rem;                                /* Space below */
  padding: 0.75rem;                                   /* Inner padding */
  background: linear-gradient(135deg, #f0fdf4, #dcfce7); /* Light green gradient */
  border-radius: 0.75rem;                             /* Rounded corners */
  border-left: 3px solid #1c3d21;                    /* Left accent border */
  font-weight: 500;                                   /* Medium font weight */
}

/* Learn more button styling */
.learn-more-button {
  width: 100%;                  /* Full width */
  padding: 0.75rem;             /* Inner spacing */
  background: #ffffff;          /* Solid white background */
  border: 2px solid #ffffff;   /* White border */
  color: #065f46;               /* Dark green text for contrast */
  border-radius: 0.75rem;       /* Rounded corners */
  font-weight: 600;             /* Semi-bold text */
  cursor: pointer;              /* Show pointer cursor */
  transition: all 0.2s;        /* Smooth hover transition */
}

/* Button hover effect */
.learn-more-button:hover {
  background: #e5e7eb;                              /* Light hover */
  color: #065f46;
  transform: translateY(-1px);                     /* Slight lift */
  box-shadow: 0 4px 12px rgba(28, 61, 33, 0.3);   /* Add shadow */
}

.actions-row { display:flex; flex-direction: column; gap: 8px; margin-top: 8px; }
</style>