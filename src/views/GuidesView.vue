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

              <div class="content-card">
              <div v-if="loading" class="placeholder-text">Loading guides...</div>
              <div v-else-if="error" class="placeholder-text">{{ error }}</div>
              <ul v-else class="guide-list">
                <li v-for="f in filteredFiles" :key="f.filename" class="guide-item" @click="openFile(f)">
                  <div class="guide-title">{{ f.title || f.filename }}</div>
                  <div class="guide-meta">{{ f.file_path }}</div>
                </li>
              </ul>
              </div>
            </div>

            <!-- File Modal -->
            <div v-if="showModal" class="guide-modal" @click.self="closeModal">
              <div class="guide-modal-dialog" role="dialog" aria-modal="true">
              <div class="guide-modal-header">
                <div class="guide-modal-title">{{ (activeFile && (activeFile.title || activeFile.filename)) || '' }}</div>
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

.back-btn { margin-bottom: 1rem; background: transparent; border: 2px solid rgba(255,255,255,0.9); border-radius: 8px; padding: 0.5rem 0.75rem; cursor: pointer; color: #ffffff; }
.back-btn:hover { background: rgba(255,255,255,0.1); }
.category-title { display:none; }

.content-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  padding: 1.5rem;
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
.guide-modal { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.guide-modal-dialog { width: min(960px, 100%); max-height: 85vh; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.35); display: flex; flex-direction: column; }
.guide-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
.guide-modal-title { font-weight: 700; color: #065f46; }
.guide-fav-actions { display:flex; align-items:center; gap:8px; }
.fav-btn { border:none; background:transparent; line-height:1; cursor:pointer; color:#9ca3af; width:22px; height:22px; display:flex; align-items:center; justify-content:center; }
.fav-btn svg { width:18px; height:18px; }
.fav-btn.active { color:#10b981; }
.guide-meta { color:#6b7280; font-size:12px; margin-top:2px; display:flex; align-items:center; gap:6px; }
.guide-chip { background:#e8f6ee; color:#065f46; border:1px solid #a7f3d0; padding:2px 8px; border-radius:9999px; font-weight:700; }
.dot { opacity:.6; }
.guide-modal-close { background: transparent; border: none; font-size: 1.5rem; line-height: 1; cursor: pointer; color: #374151; }
.guide-modal-body { padding: 1rem 1.25rem; overflow: auto; }

/* Narrow container for category detail */
.narrow { max-width: 980px; margin: 0 auto; padding: 0 1rem; }

/* Basic markdown formatting inside modal */
.markdown-content h1, .markdown-content h2, .markdown-content h3 { color: #065f46; }
.markdown-content pre { background: #0b1020; color: #e5e7eb; padding: .75rem; border-radius: 8px; overflow: auto; }
.markdown-content code { background: #f3f4f6; padding: .15rem .35rem; border-radius: 4px; }
.article :where(h1,h2,h3){ border-left:4px solid #10b981; padding-left:.5rem; margin-top:1.25rem; }
.article p { line-height:1.8; color:#1f2937; }
.article ul { margin: .5rem 0 .75rem 1.25rem; }
.article li::marker{ color:#10b981; }
.article blockquote { border-left:4px solid #e5e7eb; padding:.25rem .75rem; color:#374151; background:#f9fafb; border-radius:6px; }
</style>
