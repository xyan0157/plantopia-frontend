import { defineStore } from 'pinia'
import { markdownApiService, type MarkdownCategory, type MarkdownFileSummary } from '@/services/markdownApi'

interface GuidesState {
  categories: MarkdownCategory[]
  filesByCategory: Record<string, MarkdownFileSummary[]>
  fileContentByKey: Record<string, string>
  loading: boolean
  error: string | null
  initialized: boolean
  favourites: Set<string>
}

function makeFileKey(category: string, filename: string): string {
  return `${category}///${filename}`
}

export const useGuidesStore = defineStore('guides', {
  state: (): GuidesState => ({
    categories: [],
    filesByCategory: {},
    fileContentByKey: {},
    loading: false,
    error: null,
    initialized: false,
    favourites: new Set<string>(),
  }),
  getters: {
    getCategoryFiles: (state) => (category: string): MarkdownFileSummary[] => {
      return state.filesByCategory[category] || []
    },
    getCachedFileContent: (state) => (category: string, filename: string): string | undefined => {
      return state.fileContentByKey[makeFileKey(category, filename)]
    },
  },
  actions: {
    loadFavourites() {
      try {
        const raw = localStorage.getItem('plantopia_guide_favourites')
        if (raw) {
          const list = JSON.parse(raw)
          if (Array.isArray(list)) this.favourites = new Set(list.map(String))
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load guide favourites', e)
      }
    },

    saveFavourites() {
      try {
        localStorage.setItem('plantopia_guide_favourites', JSON.stringify(Array.from(this.favourites)))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save guide favourites', e)
      }
    },

    toggleFavouriteGuide(categorySlug: string, filename: string) {
      const key = makeFileKey(categorySlug, filename)
      if (this.favourites.has(key)) this.favourites.delete(key)
      else this.favourites.add(key)
      this.saveFavourites()
    },

    isFavouriteGuide(categorySlug: string, filename: string): boolean {
      return this.favourites.has(makeFileKey(categorySlug, filename))
    },

    async ensureLoaded(): Promise<void> {
      if (this.initialized || this.loading) return
      this.loadFavourites()
      await this.preloadAll()
    },

    async preloadAll(): Promise<void> {
      this.loading = true
      this.error = null
      try {
        const catResp = await markdownApiService.listCategories()
        this.categories = catResp.categories || []

        // Load files for each category in series to be gentle on API
        for (const cat of this.categories) {
          try {
            const resp = await markdownApiService.listFilesByCategory(cat.slug)
            this.filesByCategory[cat.slug] = resp.files || []
          } catch (inner) {
            // Keep going even if one category fails
            // eslint-disable-next-line no-console
            console.warn('Failed to load files for category', cat.slug, inner)
          }
          // Yield to UI between requests
          await new Promise(resolve => setTimeout(resolve, 0))
        }

        this.initialized = true
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load guides'
      } finally {
        this.loading = false
      }
    },

    async getFiles(categorySlug: string): Promise<MarkdownFileSummary[]> {
      if (this.filesByCategory[categorySlug]) {
        return this.filesByCategory[categorySlug]
      }
      const resp = await markdownApiService.listFilesByCategory(categorySlug)
      this.filesByCategory[categorySlug] = resp.files || []
      return this.filesByCategory[categorySlug]
    },

    async getFileContent(categorySlug: string, filename: string): Promise<string> {
      const key = makeFileKey(categorySlug, filename)
      const cached = this.fileContentByKey[key]
      if (cached !== undefined) return cached
      const resp = await markdownApiService.getFile(categorySlug, filename)
      const content = resp.file?.content || ''
      this.fileContentByKey[key] = content
      return content
    },
  },
})


