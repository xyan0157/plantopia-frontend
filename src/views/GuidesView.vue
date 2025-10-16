<template>
  <div class="guides-page" :class="mode === 'categories' ? 'category-mode' : 'detail-mode'">
    <div class="guides-bg"></div>

    <!-- Top Section: Centered Big Title -->
    <div class="top-section">
      <div class="container-xl">
        <div class="page-header">
          <h1 class="page-title">{{ mode === 'categories' ? 'Climate Gardening Guides' : toLabel(selectedCategory) }}</h1>
          <p v-if="mode === 'categories'" class="page-subtitle">Learn how to grow smarter for your climate</p>
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
                <div class="guide-card-image" :style="getCardBgStyle(c.name || c.slug)"></div>
                <div class="guide-card-info" @click.stop>
                  <div class="guide-card-title">{{ toLabel(c.name || c.slug) }}</div>
                  <div class="guide-card-desc">Browse articles in {{ toLabel(c.name || c.slug) }}</div>
                  <button
                    class="guide-card-cta"
                    @pointerdown.stop
                    @click.stop="openCategory(c.slug)"
                  >
                    Browse Guides
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Category detail: back + search + list -->
          <div v-else>
            <div class="narrow">
              <button class="back-btn" @click="backToCategories">&larr; Back</button>
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

              <!-- Results Controls - Separate Section -->
              <div v-if="!loading && !error" class="results-controls-section">
                <div class="results-controls">
                  <div class="guides-count-display">
                    <span class="count-icon">📚</span>
                    <span>Showing <strong>{{ guidesDisplayRange.start }}-{{ guidesDisplayRange.end }}</strong> of <strong>{{ totalGuides }}</strong> guides</span>
                  </div>
                  <div class="page-size-selector">
                    <label for="page-size">Guides per page:</label>
                    <select
                      id="page-size"
                      v-model="guidesPerPage"
                      @change="handlePageSizeChange"
                      class="page-size-select"
                    >
                      <option v-for="size in pageSizeOptions" :key="size" :value="size">
                        {{ size }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="content-card">
              <div v-if="loading" class="placeholder-text">Loading guides...</div>
              <div v-else-if="error" class="placeholder-text">{{ error }}</div>
              <div v-else>
                <ul class="guide-list">
                  <li v-for="f in paginatedGuides" :key="f.filename" class="guide-item" @click="openFile(f)">
                    <div class="guide-title">{{ formatGuideTitle(f.title || f.filename) }}</div>
                  </li>
                </ul>

                <!-- Pagination Controls -->
                <div v-if="totalPages > 1" class="pagination-controls">
                  <nav aria-label="Guides pagination">
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

                      <!-- Page jump -->
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
                        <span class="jump-total">/ {{ totalPages }}</span>
                        <button class="jump-btn" @click="jumpToPage" :disabled="!canJump">Go</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
              </div>
            </div>

            <!-- File Modal -->
            <div v-if="showModal" class="guide-modal" @click.self="closeModal">
              <div class="guide-modal-dialog" role="dialog" aria-modal="true">
              <div class="guide-modal-header">
                <div class="guide-modal-title">{{ activeFile ? formatGuideTitle(activeFile.title || activeFile.filename) : '' }}</div>
                <div class="guide-fav-actions">
                  <button class="fav-btn" :class="{ active: isFavActive }" @click.stop="toggleFavActive" aria-label="favourite">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
                        :fill="isFavActive ? 'currentColor' : 'none'"
                        :stroke="isFavActive ? 'none' : 'currentColor'" stroke-width="2"/>
                    </svg>
                  </button>
                  <button class="guide-modal-close" @click="closeModal" aria-label="Close">&times;</button>
                </div>
              </div>
                <div class="guide-modal-body">
                  <div v-if="fileLoading" class="placeholder-text">Loading article...</div>
                  <div v-else-if="fileError" class="placeholder-text">{{ fileError }}</div>
                <div v-else class="markdown-content article" v-html="renderedContent"></div>
                </div>
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
    <LoadingModal v-if="loadingModal.show" :message="loadingModal.message" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
// router import removed; not used for OK-only modal
import { type MarkdownFileSummary, type MarkdownCategory } from '@/services/markdownApi'
import { renderMarkdown } from '@/services/markdownService'
import { useGuidesStore } from '@/stores/guides'
import SignInModal from '@/components/SignInModal.vue'
import LoadingModal from '@/components/LoadingModal.vue'

const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const files = ref<MarkdownFileSummary[]>([])
const guides = useGuidesStore()
// Sign-in modal state
const showSignIn = ref(false)
const signInMessage = ref('')
function promptSignIn(message: string) {
  signInMessage.value = message
  showSignIn.value = true
}
// Loading modal state
const loadingModal = ref<{ show: boolean; message: string }>({ show: false, message: '' })
// No explicit sign-in redirect per request; OK simply closes
const categories = computed<MarkdownCategory[]>(() => guides.categories)
const selectedCategory = ref<string>('')
const mode = ref<'categories' | 'category'>('categories')
const activeIndex = ref(0)

// Pagination state
const currentPage = ref(1)
const guidesPerPage = ref(24)
const pageSizeOptions = [12, 24, 48, 96]
const pageJump = ref<number | null>(null)

const handleSearch = () => {
  currentPage.value = 1
}

const filteredFiles = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return files.value
  return files.value.filter(f =>
    f.filename.toLowerCase().includes(q) ||
    (f.title || '').toLowerCase().includes(q)
  )
})

// Pagination computed properties
const totalGuides = computed(() => filteredFiles.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalGuides.value / guidesPerPage.value)))

const paginatedGuides = computed(() => {
  const start = (currentPage.value - 1) * guidesPerPage.value
  const end = start + guidesPerPage.value
  return filteredFiles.value.slice(start, end)
})

const guidesDisplayRange = computed(() => {
  const start = (currentPage.value - 1) * guidesPerPage.value + 1
  const end = Math.min(currentPage.value * guidesPerPage.value, totalGuides.value)
  return { start, end }
})

const canGoPrevious = computed(() => currentPage.value > 1)
const canGoNext = computed(() => currentPage.value < totalPages.value)
const canJump = computed(() => {
  const v = Number(pageJump.value)
  return Number.isFinite(v) && v >= 1 && v <= totalPages.value && v !== currentPage.value
})

const pageNumbers = computed(() => {
  const pages = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1)

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return pages
})

// Pagination methods
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
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
  const resultsElement = document.querySelector('.content-card')
  if (resultsElement) {
    resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handlePageSizeChange = () => {
  currentPage.value = 1
}

// Format guide title - remove file paths and convert to title case
function formatGuideTitle(title: string): string {
  // Remove file extensions
  let cleaned = title.replace(/\.(md|txt|pdf)$/i, '')

  // Remove directory paths (everything before last slash)
  const lastSlash = cleaned.lastIndexOf('/')
  if (lastSlash !== -1) {
    cleaned = cleaned.substring(lastSlash + 1)
  }

  // Replace underscores and hyphens with spaces
  cleaned = cleaned.replace(/[_-]/g, ' ')

  // Convert to title case
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim()
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    await guides.ensureLoaded()
    await guides.ensureFavouritesLoaded()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load guides'
  } finally {
    loading.value = false
  }
})

async function openCategory(slug: string) {
  // if it was a drag, ignore the click
  if (isDragging.value || dragMoved) return
  selectedCategory.value = slug
  mode.value = 'category'
  await loadFilesForSelected()
}

async function loadFilesForSelected() {
  loading.value = true
  error.value = null
  try {
    // Use cached if present, otherwise fetch
    const cached = guides.getCategoryFiles(selectedCategory.value)
    if (!cached || cached.length === 0) {
      await guides.getFiles(selectedCategory.value)
    }
    files.value = guides.getCategoryFiles(selectedCategory.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load guides'
  } finally {
    loading.value = false
  }
}

function backToCategories() {
  mode.value = 'categories'
  searchQuery.value = ''
  files.value = []
}

//

const toLabel = (s: string) => {
  const words = s
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Build background image style from public/images/{slug}.jpg (or png)
function getCardBgStyle(nameOrSlug: string) {
  const raw = String(nameOrSlug).toLowerCase().trim()
  // explicit remaps for special category names
  const mapping: Record<string, string> = {
    'pests disease': 'pests disease',
    'pests diseases': 'pests disease',
    'pests_diseases': 'pests disease',
    'companion planting': 'diverse garden planting',
  }
  // direct url overrides (hardcode)
  const mappingUrl: Record<string, string> = {
    'pests disease': "/images/pests%20disease.jpg",
    'pests diseases': "/images/pests%20disease.jpg",
    'pests_diseases': "/images/pests%20disease.jpg",
  }
  if (mappingUrl[raw]) {
    return { backgroundImage: `url('${mappingUrl[raw]}')` }
  }
  const mapped = mapping[raw] || raw
  const variants = Array.from(new Set([
    mapped,
    mapped.replace(/\s+/g, '_'),
    mapped.replace(/\s+/g, '-'),
    mapped.replace(/_/g, ' '),
    mapped.replace(/-/g, ' '),
    mapped.replace(/[\s_-]+/g, ' '),
  ]))
  const exts = ['jpg', 'jpeg', 'png', 'webp']
  const urls: string[] = []
  variants.forEach(v => {
    exts.forEach(ext => {
      urls.push(`/images/${v}.${ext}`)
    })
  })
  // Build multiple backgrounds; browser will use the first that loads
  const bgList = urls.map(u => `url('${u.replace(/\s/g, '%20')}')`).join(', ')
  return {
    backgroundImage: bgList,
  }
}

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

function onPointerUp() {
  if (!isDragging.value) return
  isDragging.value = false
  snapToNearest()
  // reset drag flag after finishing drag
  dragMoved = false
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
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

// Removed global scroll locking to allow vertical scrolling on Guides page

// File modal state and actions
const showModal = ref(false)
const activeFile = ref<MarkdownFileSummary | null>(null)
const fileLoading = ref(false)
const fileError = ref<string | null>(null)
const renderedContent = ref('')
const readingMinutes = ref(1)

// favourite state for active file
const isFavActive = computed(() => {
  if (!activeFile.value) return false
  return guides.isFavouriteGuide(selectedCategory.value, activeFile.value.filename)
})
async function toggleFavActive() {
  if (!activeFile.value) return
  const email = localStorage.getItem('plantopia_user_email') || ''
  if (!email) { promptSignIn('Please sign in to use favourites.'); return }
  try {
    loadingModal.value = { show: true, message: 'Saving favourite...' }
    await guides.toggleFavouriteGuide(selectedCategory.value, activeFile.value.filename)
  } finally {
    loadingModal.value = { show: false, message: '' }
  }
}

async function openFile(f: MarkdownFileSummary) {
  activeFile.value = f
  showModal.value = true
  await loadActiveFile()
}

async function loadActiveFile() {
  if (!activeFile.value) return
  fileLoading.value = true
  fileError.value = null
  try {
    const content = await guides.getFileContent(selectedCategory.value, activeFile.value.filename)
  renderedContent.value = renderMarkdown(content)
  // estimate reading time (~200 wpm)
  const textOnly = content.replace(/<[^>]+>/g, '')
  const words = textOnly.trim().split(/\s+/).length
  readingMinutes.value = Math.max(1, Math.round(words / 200))
  } catch (e) {
    fileError.value = e instanceof Error ? e.message : 'Failed to load article'
  } finally {
    fileLoading.value = false
  }
}

function closeModal() {
  showModal.value = false
  renderedContent.value = ''
  fileError.value = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showModal.value) {
    e.preventDefault()
    closeModal()
  }
}
</script>

<style scoped>
.guides-page {
  min-height: 100vh;
  position: relative;
  background: transparent !important;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* In categories (card slider) mode, lock the page height and disable vertical scroll */
/* Allow vertical scrolling in categories mode */
.guides-page.category-mode { height: auto; overflow: visible; }

/* In detail mode, allow vertical scrolling for long lists */
.guides-page.detail-mode { overflow-y: auto; }

@media (max-width: 768px) {}

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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.search-input-group { flex: 1; max-width: 700px; }
.search-input {
  border: 2px solid #d1fae5;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  width: 100%;
}
.search-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
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

.back-btn {
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #10b981;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  color: #047857;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.back-btn:hover {
  background: #10b981;
  color: white;
  transform: translateX(-4px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
.category-title { display:none; }

.content-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.placeholder-text {
  color: #1c3d21;
  font-size: 1rem;
}

/* Results Controls Section - Separate from content card */
.results-controls-section {
  margin-bottom: 1.5rem;
}

.results-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 2px solid #d1fae5;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.12);
  transition: all 0.3s ease;
}

.results-controls:hover {
  border-color: #10b981;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.18);
}

.guides-count-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #047857;
  font-size: 1.05rem;
}

.count-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.guides-count-display strong {
  color: #10b981;
  font-weight: 700;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background: rgba(240, 253, 244, 0.6);
  border-radius: 10px;
  border: 1px solid #d1fae5;
}

.page-size-selector label {
  color: #047857;
  font-weight: 600;
  font-size: 0.95rem;
  margin: 0;
}

.page-size-select {
  padding: 0.5rem 0.75rem;
  border: 2px solid #d1fae5;
  border-radius: 8px;
  background: white;
  color: #047857;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
}

.page-size-select:hover {
  border-color: #10b981;
  background: #f0fdf4;
}

.page-size-select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.guide-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem; }
.guide-item {
  padding: 1.5rem 1.75rem;
  border: 2px solid #d1fae5;
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.guide-item:hover {
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  transform: translateY(-2px);
}
.guide-title {
  font-weight: 700;
  color: #047857;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  line-height: 1.4;
}
.guide-meta {
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
}

/* Horizontal slider large card */
.slider-card { background: transparent; border-radius: 1rem; padding: 1rem; box-shadow: none; }
.slider { display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory; cursor: grab; 
  /* Slightly narrower than previous (about 1.8 cards per viewport) */
  --card-width: clamp(520px, calc((100% - 2rem) / 1.8), 1000px);
  /* Side paddings keep the first card centered in the page */
  padding: 0 calc((100% - var(--card-width)) / 2) 0.5rem;
  /* Hide scrollbar in Firefox and old Edge */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.slider.dragging { cursor: grabbing; user-select: none; }
/* Hide scrollbar in WebKit browsers */
.slider::-webkit-scrollbar { display: none; height: 0; }
/* Keep for safety; won't show when scrollbar is hidden */
.slider::-webkit-scrollbar-thumb { background: transparent; border-radius: 6px; }
.guide-card { height: 560px; border-radius: 16px; background: #111827; color: white; position: relative; flex: 0 0 var(--card-width); min-width: var(--card-width); max-width: var(--card-width); scroll-snap-align: center; box-shadow: 0 10px 20px rgba(0,0,0,0.2); cursor: pointer; transition: opacity .2s ease, filter .2s ease, transform .2s ease, box-shadow .2s ease; display: flex; flex-direction: column; }
.guide-card-image { flex: 1 1 auto; background-size: cover; background-position: center; border-top-left-radius: 16px; border-top-right-radius: 16px; }
.guide-card-info { background: #e8f6ee; padding: 1rem; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; }
.guide-card.dim-left { opacity: 0.35; filter: grayscale(100%) brightness(0.9); transform: scale(0.96); }
.guide-card.dim-right { opacity: 0.35; filter: grayscale(100%) brightness(0.9); transform: scale(0.96); }
.guide-card.active { opacity: 1; filter: none; transform: scale(1); box-shadow: 0 16px 32px rgba(0,0,0,0.3); }
.guide-card-content { position: absolute; inset: 0; padding: 1.25rem; display: none; flex-direction: column; }
.guide-card-title { font-size: 1.5rem; font-weight: 800; color: #10b981; margin-bottom: 0.75rem; }
.guide-card-desc { color: #10b981; line-height: 1.5; flex: 1; }
.guide-card-meta { color: #9ca3af; font-size: 0.875rem; margin-top: 0.75rem; }

.guide-card-cta {
  position: absolute;
  right: 16px;
  bottom: 16px;
  background: #10b981;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(16,185,129,0.4);
  transition: transform .15s ease, box-shadow .15s ease, background-color .15s ease;
}
.guide-card-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 18px rgba(16,185,129,0.45); }
.guide-card-cta:active { transform: translateY(0); box-shadow: 0 4px 10px rgba(16,185,129,0.35); }

/* Make list items clickable */
.guide-item { cursor: pointer; transition: background-color .15s ease, box-shadow .15s ease; }
.guide-item:hover { background: #f9fafb; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }

/* Modal styles */
.guide-modal {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  backdrop-filter: blur(4px);
}
.guide-modal-dialog {
  width: min(1400px, 95vw);
  max-height: 92vh;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
}
.guide-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2rem;
  border-bottom: 2px solid #e5e7eb;
  background: linear-gradient(to bottom, #ffffff, #f9fafb);
}
.guide-modal-title {
  font-weight: 700;
  color: #065f46;
  font-size: 1.5rem;
}
.guide-fav-actions { display:flex; align-items:center; gap:12px; }
.fav-btn {
  border: none;
  background: transparent;
  line-height: 1;
  cursor: pointer;
  color: #9ca3af;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.fav-btn:hover { color: #10b981; transform: scale(1.1); }
.fav-btn svg { width: 22px; height: 22px; }
.fav-btn.active { color: #10b981; }
.guide-meta { color:#6b7280; font-size:12px; margin-top:2px; display:flex; align-items:center; gap:6px; }
.guide-chip { background:#e8f6ee; color:#065f46; border:1px solid #a7f3d0; padding:2px 8px; border-radius:9999px; font-weight:700; }
.dot { opacity:.6; }
.guide-modal-close {
  background: transparent;
  border: none;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.guide-modal-close:hover {
  color: #047857;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
}
.guide-modal-body {
  padding: 2.5rem 5rem;
  overflow: auto;
  background: #ffffff;
}

/* Narrow container for category detail */
.narrow { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }

/* Responsive adjustments for mobile */
@media (max-width: 768px) {
  .guide-modal {
    padding: 0.5rem;
  }

  .guide-modal-dialog {
    width: 100%;
    max-height: 95vh;
    border-radius: 12px;
  }

  .guide-modal-header {
    padding: 1rem 1.25rem;
  }

  .guide-modal-title {
    font-size: 1.1rem;
  }

  .guide-modal-body {
    padding: 1.5rem 2rem;
  }

  .guide-title {
    font-size: 1.1rem;
  }

  .guide-item {
    padding: 1.25rem 1.5rem;
  }

  .search-bar {
    padding: 1rem;
  }

  .search-input {
    font-size: 1rem;
    padding: 0.875rem 1rem;
  }

  .back-btn {
    padding: 0.625rem 1rem;
    font-size: 0.9rem;
  }

  .content-card {
    padding: 1.5rem;
  }
}

/* Pagination Controls */
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  border: 1px solid #d1fae5;
}

.page-item {
  margin: 0;
}

.page-link {
  display: block;
  padding: 0.625rem 0.875rem;
  margin: 0;
  color: #047857;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
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

.page-jump-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.75rem;
}

.jump-label {
  color: #047857;
  font-weight: 600;
}

.jump-input {
  width: 64px;
  padding: 0.5rem 0.75rem;
  border: 2px solid #d1fae5;
  border-radius: 8px;
  text-align: center;
  background: #ffffff;
  color: #047857;
  font-weight: 600;
}

.jump-input:focus {
  border-color: #10b981;
  outline: none;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}

.jump-total {
  color: #6b7280;
  font-weight: 500;
}

.jump-btn {
  padding: 0.5rem 0.875rem;
  border: 2px solid #10b981;
  background: #10b981;
  color: #fff;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.jump-btn:hover:not(:disabled) {
  background: #059669;
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.jump-btn:disabled {
  background: #a7f3d0;
  border-color: #a7f3d0;
  cursor: not-allowed;
}

/* Responsive Pagination */
@media (max-width: 768px) {
  .results-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem 1.25rem;
  }

  .guides-count-display {
    text-align: center;
    justify-content: center;
    font-size: 0.95rem;
  }

  .count-icon {
    font-size: 1.25rem;
  }

  .page-size-selector {
    justify-content: center;
    padding: 0.5rem 0.75rem;
  }

  .pagination {
    gap: 0.125rem;
    padding: 0.5rem;
  }

  .page-link {
    padding: 0.5rem 0.625rem;
    font-size: 0.875rem;
    min-width: 36px;
  }

  .page-jump-item {
    margin-left: 0.5rem;
    gap: 0.25rem;
  }

  .jump-input {
    width: 50px;
  }
}

/* Enhanced Markdown Content Styling */
.markdown-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 1.05rem;
  line-height: 1.75;
  color: #1f2937;
  max-width: 100%;
}

/* Headings with gradient backgrounds and icons */
.markdown-content h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #065f46;
  margin: 2.5rem 0 1.5rem 0;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-left: 6px solid #10b981;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  position: relative;
}

.markdown-content h1::before {
  content: '📖';
  margin-right: 0.75rem;
  font-size: 2rem;
}

.markdown-content h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #047857;
  margin: 2rem 0 1rem 0;
  padding: 1rem 1.25rem;
  background: linear-gradient(to right, #f0fdf4 0%, transparent 100%);
  border-left: 5px solid #10b981;
  border-radius: 8px;
  position: relative;
}

.markdown-content h2::before {
  content: '🌱';
  margin-right: 0.5rem;
  font-size: 1.5rem;
}

.markdown-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #065f46;
  margin: 1.5rem 0 0.75rem 0;
  padding: 0.75rem 1rem;
  background: rgba(209, 250, 229, 0.3);
  border-left: 4px solid #34d399;
  border-radius: 6px;
}

.markdown-content h3::before {
  content: '▸ ';
  color: #10b981;
  font-weight: 700;
}

.markdown-content h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #047857;
  margin: 1.25rem 0 0.5rem 0;
  padding-left: 0.75rem;
  border-left: 3px solid #6ee7b7;
}

/* Paragraphs with better spacing */
.markdown-content p {
  margin: 1.25rem 0;
  line-height: 1.85;
  color: #374151;
  text-align: justify;
}

.markdown-content p:first-of-type {
  font-size: 1.1rem;
  color: #1f2937;
  font-weight: 500;
}

/* Lists with custom styling */
.markdown-content ul,
.markdown-content ol {
  margin: 1.25rem 0;
  padding-left: 2rem;
  color: #374151;
}

.markdown-content ul {
  list-style: none;
}

.markdown-content ul li {
  position: relative;
  margin: 0.75rem 0;
  padding-left: 1.75rem;
  line-height: 1.75;
}

.markdown-content ul li::before {
  content: '🌿';
  position: absolute;
  left: 0;
  font-size: 1rem;
}

.markdown-content ol {
  counter-reset: item;
}

.markdown-content ol li {
  margin: 0.75rem 0;
  padding-left: 0.5rem;
  counter-increment: item;
  line-height: 1.75;
}

.markdown-content ol li::marker {
  content: counter(item) ". ";
  color: #10b981;
  font-weight: 700;
  font-size: 1.1rem;
}

/* Nested lists */
.markdown-content ul ul li::before {
  content: '•';
  color: #10b981;
  font-size: 1.2rem;
}

/* Links with hover effects */
.markdown-content a {
  color: #059669;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.markdown-content a:hover {
  color: #047857;
  border-bottom-color: #10b981;
}

.markdown-content a::after {
  content: '↗';
  margin-left: 0.25rem;
  font-size: 0.85em;
  opacity: 0.6;
}

/* Code blocks with syntax highlighting styles */
.markdown-content pre {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 12px;
  overflow-x: auto;
  margin: 1.5rem 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border: 1px solid #334155;
  position: relative;
}

.markdown-content pre::before {
  content: '< code >';
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  font-size: 0.75rem;
  color: #64748b;
  font-family: 'Courier New', monospace;
}

.markdown-content pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

/* Inline code */
.markdown-content code {
  background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
  color: #065f46;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  border: 1px solid #a7f3d0;
}

/* Blockquotes with gradient and icon */
.markdown-content blockquote {
  margin: 1.5rem 0;
  padding: 1.25rem 1.5rem 1.25rem 4rem;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-left: 5px solid #f59e0b;
  border-radius: 12px;
  color: #78350f;
  font-style: italic;
  position: relative;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.markdown-content blockquote::before {
  content: '💡';
  position: absolute;
  left: 1.25rem;
  top: 1.25rem;
  font-size: 2rem;
  opacity: 0.8;
}

.markdown-content blockquote p {
  margin: 0.5rem 0;
  color: #78350f;
  font-weight: 500;
}

/* Tables with modern styling */
.markdown-content table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.markdown-content thead {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.markdown-content th {
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 700;
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.markdown-content td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.markdown-content tbody tr {
  background: white;
  transition: all 0.2s ease;
}

.markdown-content tbody tr:nth-child(even) {
  background: #f9fafb;
}

.markdown-content tbody tr:hover {
  background: #f0fdf4;
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

/* Horizontal rules with gradient */
.markdown-content hr {
  border: none;
  height: 3px;
  background: linear-gradient(to right, transparent, #10b981, transparent);
  margin: 2.5rem 0;
  border-radius: 2px;
}

/* Images with captions and hover effects */
.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  margin: 1.5rem auto;
  display: block;
  transition: all 0.3s ease;
}

.markdown-content img:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}

/* Strong/Bold text */
.markdown-content strong {
  color: #065f46;
  font-weight: 700;
  background: linear-gradient(to right, #d1fae5 0%, transparent 100%);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
}

/* Emphasis/Italic */
.markdown-content em {
  color: #047857;
  font-style: italic;
}

/* Definition lists */
.markdown-content dl {
  margin: 1.5rem 0;
}

.markdown-content dt {
  font-weight: 700;
  color: #065f46;
  margin-top: 1rem;
  font-size: 1.1rem;
}

.markdown-content dd {
  margin-left: 2rem;
  margin-top: 0.5rem;
  color: #374151;
  padding-left: 1rem;
  border-left: 3px solid #d1fae5;
}

/* Task lists with checkboxes */
.markdown-content input[type="checkbox"] {
  margin-right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #10b981;
}

/* Footnotes */
.markdown-content sup {
  color: #10b981;
  font-weight: 700;
}

/* Info boxes (using specific classes if needed) */
.markdown-content .info-box {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-left: 5px solid #3b82f6;
  padding: 1.25rem 1.5rem 1.25rem 4rem;
  border-radius: 12px;
  margin: 1.5rem 0;
  position: relative;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.markdown-content .info-box::before {
  content: 'ℹ️';
  position: absolute;
  left: 1.25rem;
  font-size: 1.75rem;
}

/* Warning boxes */
.markdown-content .warning-box {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left: 5px solid #f59e0b;
  padding: 1.25rem 1.5rem 1.25rem 4rem;
  border-radius: 12px;
  margin: 1.5rem 0;
  position: relative;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.markdown-content .warning-box::before {
  content: '⚠️';
  position: absolute;
  left: 1.25rem;
  font-size: 1.75rem;
}

/* Success boxes */
.markdown-content .success-box {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-left: 5px solid #10b981;
  padding: 1.25rem 1.5rem 1.25rem 4rem;
  border-radius: 12px;
  margin: 1.5rem 0;
  position: relative;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.markdown-content .success-box::before {
  content: '✅';
  position: absolute;
  left: 1.25rem;
  font-size: 1.75rem;
}

/* Smooth scrolling for anchor links */
.markdown-content {
  scroll-behavior: smooth;
}

/* Print styles */
@media print {
  .markdown-content {
    color: #000;
  }

  .markdown-content pre {
    background: #f5f5f5;
    color: #000;
    border: 1px solid #ddd;
  }
}
</style>

<!-- Non-scoped styles for markdown content rendered via v-html -->
<style>
/* Enhanced Markdown Content Styling */
.markdown-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 1.05rem;
  line-height: 1.75;
  color: #1f2937;
  max-width: 100%;
}

/* Headings with solid backgrounds and icons */
.markdown-content h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #065f46;
  margin: 2.5rem 0 1.5rem 0;
  padding: 1.25rem 1.5rem;
  background: #d1fae5;
  border-left: 6px solid #10b981;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  position: relative;
}

.markdown-content h1::before {
  content: '📖';
  margin-right: 0.75rem;
  font-size: 2rem;
}

.markdown-content h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #047857;
  margin: 2rem 0 1rem 0;
  padding: 1rem 1.25rem;
  background: #f0fdf4;
  border-left: 5px solid #10b981;
  border-radius: 8px;
  position: relative;
}

.markdown-content h2::before {
  content: '🌱';
  margin-right: 0.5rem;
  font-size: 1.5rem;
}

.markdown-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #065f46;
  margin: 1.5rem 0 0.75rem 0;
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border-left: 4px solid #34d399;
  border-radius: 6px;
}

.markdown-content h3::before {
  content: '▸ ';
  color: #10b981;
  font-weight: 700;
}

.markdown-content h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #047857;
  margin: 1.25rem 0 0.5rem 0;
  padding-left: 0.75rem;
  border-left: 3px solid #6ee7b7;
}

/* Paragraphs with better spacing */
.markdown-content p {
  margin: 1.25rem 0;
  line-height: 1.85;
  color: #374151;
  text-align: justify;
}

.markdown-content p:first-of-type {
  font-size: 1.1rem;
  color: #1f2937;
  font-weight: 500;
}

/* Lists with custom styling */
.markdown-content ul,
.markdown-content ol {
  margin: 1.25rem 0;
  padding-left: 2rem;
  color: #374151;
}

.markdown-content ul {
  list-style: none;
}

.markdown-content ul li {
  position: relative;
  margin: 0.75rem 0;
  padding-left: 1.75rem;
  line-height: 1.75;
}

.markdown-content ul li::before {
  content: '🌿';
  position: absolute;
  left: 0;
  font-size: 1rem;
}

.markdown-content ol {
  counter-reset: item;
  list-style: none;
}

.markdown-content ol li {
  position: relative;
  margin: 0.75rem 0;
  padding-left: 2rem;
  counter-increment: item;
  line-height: 1.75;
}

.markdown-content ol li::before {
  content: counter(item) ". ";
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: 700;
  font-size: 1.1rem;
}

/* Nested lists */
.markdown-content ul ul li::before {
  content: '•';
  color: #10b981;
  font-size: 1.2rem;
}

/* Nested ordered lists inside unordered lists should use numbers */
.markdown-content ul ol li::before {
  content: counter(item) ". ";
  color: #10b981;
}

/* Nested unordered lists inside ordered lists should use bullets */
.markdown-content ol ul li::before {
  content: '•';
  color: #10b981;
  font-size: 1.2rem;
}

/* Links with hover effects */
.markdown-content a {
  color: #059669;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.markdown-content a:hover {
  color: #047857;
  border-bottom-color: #10b981;
}

.markdown-content a::after {
  content: '↗';
  margin-left: 0.25rem;
  font-size: 0.85em;
  opacity: 0.6;
}

/* Code blocks with syntax highlighting styles */
.markdown-content pre {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 12px;
  overflow-x: auto;
  margin: 1.5rem 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border: 1px solid #334155;
  position: relative;
}

.markdown-content pre::before {
  content: '< code >';
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  font-size: 0.75rem;
  color: #64748b;
  font-family: 'Courier New', monospace;
}

.markdown-content pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.95rem;
  line-height: 1.6;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

/* Inline code */
.markdown-content code {
  background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
  color: #065f46;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  border: 1px solid #a7f3d0;
}

/* Blockquotes with gradient and icon */
.markdown-content blockquote {
  margin: 1.5rem 0;
  padding: 1.25rem 1.5rem 1.25rem 4rem;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-left: 5px solid #f59e0b;
  border-radius: 12px;
  color: #78350f;
  font-style: italic;
  position: relative;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.markdown-content blockquote::before {
  content: '💡';
  position: absolute;
  left: 1.25rem;
  top: 1.25rem;
  font-size: 2rem;
  opacity: 0.8;
}

.markdown-content blockquote p {
  margin: 0.5rem 0;
  color: #78350f;
  font-weight: 500;
}

/* Tables with modern styling */
.markdown-content table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.markdown-content thead {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.markdown-content th {
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 700;
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.markdown-content td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}

.markdown-content tbody tr {
  background: white;
  transition: all 0.2s ease;
}

.markdown-content tbody tr:nth-child(even) {
  background: #f9fafb;
}

.markdown-content tbody tr:hover {
  background: #f0fdf4;
  transform: scale(1.01);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

/* Horizontal rules with gradient */
.markdown-content hr {
  border: none;
  height: 3px;
  background: linear-gradient(to right, transparent, #10b981, transparent);
  margin: 2.5rem 0;
  border-radius: 2px;
}

/* Images with captions and hover effects */
.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  margin: 1.5rem auto;
  display: block;
  transition: all 0.3s ease;
}

.markdown-content img:hover {
  transform: scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}

/* Strong/Bold text */
.markdown-content strong {
  color: #065f46;
  font-weight: 700;
  background: linear-gradient(to right, #d1fae5 0%, transparent 100%);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
}

/* Emphasis/Italic */
.markdown-content em {
  color: #047857;
  font-style: italic;
}

/* Definition lists */
.markdown-content dl {
  margin: 1.5rem 0;
}

.markdown-content dt {
  font-weight: 700;
  color: #065f46;
  margin-top: 1rem;
  font-size: 1.1rem;
}

.markdown-content dd {
  margin-left: 2rem;
  margin-top: 0.5rem;
  color: #374151;
  padding-left: 1rem;
  border-left: 3px solid #d1fae5;
}

/* Task lists with checkboxes */
.markdown-content input[type="checkbox"] {
  margin-right: 0.5rem;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #10b981;
}

/* Footnotes */
.markdown-content sup {
  color: #10b981;
  font-weight: 700;
}

/* Info boxes (using specific classes if needed) */
.markdown-content .info-box {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-left: 5px solid #3b82f6;
  padding: 1.25rem 1.5rem 1.25rem 4rem;
  border-radius: 12px;
  margin: 1.5rem 0;
  position: relative;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.markdown-content .info-box::before {
  content: 'ℹ️';
  position: absolute;
  left: 1.25rem;
  font-size: 1.75rem;
}

/* Warning boxes */
.markdown-content .warning-box {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left: 5px solid #f59e0b;
  padding: 1.25rem 1.5rem 1.25rem 4rem;
  border-radius: 12px;
  margin: 1.5rem 0;
  position: relative;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.markdown-content .warning-box::before {
  content: '⚠️';
  position: absolute;
  left: 1.25rem;
  font-size: 1.75rem;
}

/* Success boxes */
.markdown-content .success-box {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-left: 5px solid #10b981;
  padding: 1.25rem 1.5rem 1.25rem 4rem;
  border-radius: 12px;
  margin: 1.5rem 0;
  position: relative;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
}

.markdown-content .success-box::before {
  content: '✅';
  position: absolute;
  left: 1.25rem;
  font-size: 1.75rem;
}

/* Smooth scrolling for anchor links */
.markdown-content {
  scroll-behavior: smooth;
}

/* Print styles */
@media print {
  .markdown-content {
    color: #000;
  }

  .markdown-content pre {
    background: #f5f5f5;
    color: #000;
    border: 1px solid #ddd;
  }
}
</style>
