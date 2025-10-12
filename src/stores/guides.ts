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
  favouritesLoaded: boolean
  favouritesLoading: boolean
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
    favouritesLoaded: false,
    favouritesLoading: false,
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
      this.favouritesLoaded = true
    },

    saveFavourites() {
      try {
        localStorage.setItem('plantopia_guide_favourites', JSON.stringify(Array.from(this.favourites)))
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to save guide favourites', e)
      }
    },

    async syncFavouritesFromServer(): Promise<void> {
      this.favouritesLoading = true
      try {
        const email = localStorage.getItem('plantopia_user_email') || ''
        if (!email) return
        const favs = await markdownApiService.getGuideFavoritesByEmail(email)
        const keys = favs.map(f => makeFileKey(String(f.category || ''), String(f.guide_name || '')))
        this.favourites = new Set(keys)
      } catch {}
      this.favouritesLoaded = true
      this.favouritesLoading = false
    },

    async toggleFavouriteGuide(categorySlug: string, filename: string) {
      const key = makeFileKey(categorySlug, filename)
      const email = localStorage.getItem('plantopia_user_email') || ''
      if (!email) { // fallback to local only when no email
        if (this.favourites.has(key)) this.favourites.delete(key); else this.favourites.add(key)
        this.saveFavourites()
        return
      }
      if (this.favourites.has(key)) {
        await markdownApiService.removeGuideFavorite(filename, email)
        this.favourites.delete(key)
      } else {
        await markdownApiService.addGuideFavorite(email, filename, categorySlug)
        this.favourites.add(key)
      }
      try { localStorage.setItem('favourites_refresh_at', String(Date.now())) } catch {}
    },

    async ensureFavouritesLoaded(): Promise<void> {
      if (this.favouritesLoaded) return
      const email = localStorage.getItem('plantopia_user_email') || ''
      if (email) await this.syncFavouritesFromServer()
      else { this.loadFavourites(); this.favouritesLoading = false }
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


