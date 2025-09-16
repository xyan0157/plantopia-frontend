<template>
  <div class="guides-page">
    <div class="guides-bg"></div>

    <!-- Top Section: Centered Big Title -->
    <div class="top-section">
      <div class="container-xl">
        <div class="page-header">
          <h1 class="page-title">Climate Gardening Guides</h1>
          <p class="page-subtitle">Learn how to grow smarter for your climate</p>
        </div>
      </div>
    </div>

    <!-- Categories slider OR Category detail -->
    <div class="content-section">
      <div class="container-xl">
        <div class="content-panel">
          <!-- Categories mode: horizontal slider of category cards -->
          <div v-if="mode === 'categories'" class="slider-card">
            <div v-if="loading" class="placeholder-text">Loading categories...</div>
            <div v-else-if="error" class="placeholder-text">{{ error }}</div>
            <div
              v-else
              class="slider"
              tabindex="0"
              ref="sliderRef"
              :class="{ dragging: isDragging }"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointerleave="onPointerUp"
              @pointercancel="onPointerUp"
              @scroll="onSliderScroll"
            >
              <div
                v-for="(c, idx) in categories"
                :key="c.slug"
                class="guide-card cat-slide"
                :class="{ active: idx === activeIndex, 'dim-left': idx < activeIndex, 'dim-right': idx > activeIndex }"
                @click="openCategory(c.slug)"
              >
                <div class="guide-card-content">
                  <div class="guide-card-title">{{ toLabel(c.name || c.slug) }}</div>
                  <div class="guide-card-desc">Browse articles in {{ toLabel(c.name || c.slug) }}</div>
                  <div class="guide-card-meta">{{ c.file_count ? c.file_count + ' files' : '' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Category detail: back + search + list -->
          <div v-else>
            <button class="back-btn" @click="backToCategories">← Back</button>
            <h2 class="category-title">{{ toLabel(selectedCategory) }}</h2>
            <div class="search-bar">
              <div class="search-input-group">
                <input
                  type="text"
                  class="form-control search-input"
                  placeholder="Search guides..."
                  v-model="searchQuery"
                  @input="handleSearch"
                >
              </div>
            </div>

            <div class="content-card">
              <div v-if="loading" class="placeholder-text">Loading guides...</div>
              <div v-else-if="error" class="placeholder-text">{{ error }}</div>
              <ul v-else class="guide-list">
                <li v-for="f in filteredFiles" :key="f.filename" class="guide-item">
                  <div class="guide-title">{{ f.title || f.filename }}</div>
                  <div class="guide-meta">{{ f.file_path }}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { markdownApiService, type MarkdownFilesByCategoryResponse, type MarkdownFileSummary, type MarkdownCategory } from '@/services/markdownApi'

const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const files = ref<MarkdownFileSummary[]>([])
const categories = ref<MarkdownCategory[]>([])
const selectedCategory = ref<string>('')
const mode = ref<'categories' | 'category'>('categories')
const activeIndex = ref(0)

const handleSearch = () => {}

const filteredFiles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return files.value
  return files.value.filter(f =>
    f.filename.toLowerCase().includes(q) ||
    (f.title || '').toLowerCase().includes(q)
  )
})

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const catResp = await markdownApiService.listCategories()
    categories.value = catResp.categories || []
  } catch (e: any) {
    // Fallback categories if API unavailable
    categories.value = [
      { name: 'Grow Guide', slug: 'grow-guide' } as any,
      { name: 'Soil', slug: 'soil' } as any,
      { name: 'Pest Guide', slug: 'pest-guide' } as any,
    ]
  } finally {
    loading.value = false
  }
})

async function openCategory(slug: string) {
  selectedCategory.value = slug
  mode.value = 'category'
  await loadFilesForSelected()
}

async function loadFilesForSelected() {
  loading.value = true
  error.value = null
  try {
    const resp = await markdownApiService.listFilesByCategory(selectedCategory.value)
    files.value = resp.files || []
  } catch (e: any) {
    error.value = e?.message || 'Failed to load guides'
  } finally {
    loading.value = false
  }
}

function backToCategories() {
  mode.value = 'categories'
  searchQuery.value = ''
  files.value = []
}

const snippet = (s: string) => {
  const t = s.replace(/[#*>`\-\n]/g, ' ').replace(/\s+/g, ' ').trim()
  return t.length > 220 ? t.slice(0, 220) + '…' : t
}

const toLabel = (s: string) => s.replace(/-/g, ' ')

// drag-to-scroll state and handlers
const sliderRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
let dragStartX = 0
let startScrollLeft = 0
let dragMoved = false

function onPointerDown(e: PointerEvent) {
  if (!sliderRef.value) return
  isDragging.value = true
  dragMoved = false
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragStartX = e.clientX
  startScrollLeft = sliderRef.value.scrollLeft
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || !sliderRef.value) return
  const dx = e.clientX - dragStartX
  if (Math.abs(dx) > 3) dragMoved = true
  sliderRef.value.scrollLeft = startScrollLeft - dx
  updateActive()
}

function onPointerUp(e: PointerEvent) {
  if (!isDragging.value) return
  isDragging.value = false
  // If drag happened, temporarily swallow the next click on cards to avoid opening
  if (dragMoved && sliderRef.value) {
    const slider = sliderRef.value
    const onClick = (evt: MouseEvent) => {
      evt.stopPropagation()
      evt.preventDefault()
      slider.removeEventListener('click', onClick, true)
    }
    slider.addEventListener('click', onClick, true)
  }
  snapToNearest()
}

function onSliderScroll() {
  if (!isDragging.value) updateActive()
}

function updateActive() {
  const el = sliderRef.value
  if (!el) return
  const cards = Array.from(el.querySelectorAll<HTMLElement>('.guide-card'))
  if (cards.length === 0) return
  const rect = el.getBoundingClientRect()
  const center = rect.left + rect.width / 2
  let bestIdx = 0
  let bestDist = Number.POSITIVE_INFINITY
  cards.forEach((card, idx) => {
    const r = card.getBoundingClientRect()
    const c = r.left + r.width / 2
    const d = Math.abs(c - center)
    if (d < bestDist) {
      bestDist = d
      bestIdx = idx
    }
  })
  activeIndex.value = bestIdx
}

function snapToNearest() {
  const el = sliderRef.value
  if (!el) return
  const cards = Array.from(el.querySelectorAll<HTMLElement>('.guide-card'))
  const target = cards[activeIndex.value]
  if (!target) return
  const elRect = el.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  const delta = (targetRect.left + targetRect.width / 2) - (elRect.left + elRect.width / 2)
  el.scrollTo({ left: el.scrollLeft + delta, behavior: 'smooth' })
  // ensure neighbors remain partially visible by adding side padding via CSS; no hiding
}

onMounted(() => {
  nextTick(() => {
    updateActive()
    // Center to the first card explicitly on mount
    const el = sliderRef.value
    if (el) {
      const first = el.querySelector<HTMLElement>('.guide-card')
      if (first) {
        const elRect = el.getBoundingClientRect()
        const firstRect = first.getBoundingClientRect()
        const delta = (firstRect.left + firstRect.width / 2) - (elRect.left + elRect.width / 2)
        el.scrollLeft += delta
      }
    }
  })
})
</script>

<style scoped>
.guides-page {
  min-height: 100vh;
  position: relative;
  background: transparent !important;
}

.guides-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('@/assets/photo/plant-1.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  z-index: -1;
  pointer-events: none;
  filter: brightness(0.9);
}

.top-section {
  background: transparent;
  border-bottom: 0;
  padding: 2rem 0;
  margin-top: 20px;
  position: relative;
  z-index: 1;
  width: 100%;
}

.page-header {
  text-align: center;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 2rem;
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 0;
}

.content-section { padding-top: 1rem; }

.content-panel {
  padding: 1.5rem 0;
  background: transparent;
  min-height: calc(100vh - 200px);
}

/* Make slider area full-bleed so first card can center to the page */
.container-xl { max-width: 100%; padding-left: 0; padding-right: 0; }

.search-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.search-input-group { flex: 1; max-width: 600px; }
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

.category-buttons { display: flex; gap: 0.5rem; }
.category-btn { padding: 0.5rem 0.75rem; border-radius: 8px; border: 2px solid #e5e7eb; background: white; color: #374151; font-weight: 500; cursor: pointer; }
.category-btn.active { background: #10b981; border-color: #10b981; color: white; }

/* Categories grid */
.category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
.cat-card { position: relative; height: 180px; border-radius: 16px; overflow: hidden; background: rgba(0,0,0,0.2); cursor: pointer; }
.cat-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(1px); }
.cat-title { position: absolute; top: 20px; left: 20px; color: white; font-size: 1.75rem; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
.cat-cta { position: absolute; bottom: 20px; left: 20px; color: white; border: 2px solid rgba(255,255,255,0.8); padding: 0.5rem 1rem; border-radius: 12px; font-weight: 700; backdrop-filter: blur(2px); }

.back-btn { margin-bottom: 1rem; background: transparent; border: 2px solid #e5e7eb; border-radius: 8px; padding: 0.5rem 0.75rem; cursor: pointer; color: #374151; }
.category-title { color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-bottom: 0.75rem; }

.content-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.placeholder-text {
  color: #1c3d21;
  font-size: 1rem;
}

.guide-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
.guide-item { padding: 0.75rem 1rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #ffffff; }
.guide-title { font-weight: 600; color: #047857; margin-bottom: 0.25rem; }
.guide-meta { color: #6b7280; font-size: 0.875rem; }

/* Horizontal slider large card */
.slider-card { background: transparent; border-radius: 1rem; padding: 1rem; box-shadow: none; }
.slider { display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory; cursor: grab; 
  /* Keep first card centered by adding equal side paddings matching remaining space */
  --card-width: min(960px, calc(100% - 320px));
  padding: 0 calc((100% - var(--card-width)) / 2) 0.5rem;
}
.slider.dragging { cursor: grabbing; user-select: none; }
.slider::-webkit-scrollbar { height: 10px; }
.slider::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 6px; }
.guide-card { height: 560px; border-radius: 16px; background: #111827; color: white; position: relative; flex: 0 0 var(--card-width); min-width: var(--card-width); max-width: var(--card-width); scroll-snap-align: center; box-shadow: 0 10px 20px rgba(0,0,0,0.2); cursor: pointer; transition: opacity .2s ease, filter .2s ease, transform .2s ease, box-shadow .2s ease; }
.guide-card.dim-left { opacity: 0.35; filter: grayscale(100%) brightness(0.9); transform: scale(0.96); }
.guide-card.dim-right { opacity: 0.35; filter: grayscale(100%) brightness(0.9); transform: scale(0.96); }
.guide-card.active { opacity: 1; filter: none; transform: scale(1); box-shadow: 0 16px 32px rgba(0,0,0,0.3); }
.guide-card-content { position: absolute; inset: 0; padding: 1.25rem; display: flex; flex-direction: column; }
.guide-card-title { font-size: 1.5rem; font-weight: 800; color: #93c5fd; margin-bottom: 0.75rem; }
.guide-card-desc { color: #e5e7eb; line-height: 1.5; flex: 1; }
.guide-card-meta { color: #9ca3af; font-size: 0.875rem; margin-top: 0.75rem; }
</style>
