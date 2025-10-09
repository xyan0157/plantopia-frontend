import { defineStore } from 'pinia'
import { plantApiService, type Plant } from '@/services/api'

interface PlantsState {
  plants: Plant[]
  loading: boolean
  error: string | null
  initialized: boolean
  totalCount: number
  lastKey: string | null
  firstPageShown: boolean
  favourites: Set<string>
}

export const usePlantsStore = defineStore('plants', {
  state: (): PlantsState => ({
    plants: [],
    loading: false,
    error: null,
    initialized: false,
    totalCount: 0,
    lastKey: null,
    firstPageShown: false,
    favourites: new Set<string>(JSON.parse(localStorage.getItem('favourite_plants') || '[]')),
  }),
  actions: {
    toggleFavourite(id: string) {
      if (this.favourites.has(id)) this.favourites.delete(id)
      else this.favourites.add(id)
      localStorage.setItem('favourite_plants', JSON.stringify(Array.from(this.favourites)))
    },
    isFavourite(id: string): boolean { return this.favourites.has(id) },
    async ensureLoaded(): Promise<void> {
      if (this.initialized) return
      // Preload default dataset on app startup (all categories, empty search)
      try {
        await this.preloadAllPaginated(12)
      } catch {
        // swallow errors to not block app start
      }
    },

    async loadPage(page: number, limit: number, category?: string, search?: string): Promise<{ total: number }> {
      this.loading = true
      this.error = null
      try {
        const { plants, total_count } = await plantApiService.getPlantsPaginated({ page, limit, category, search })
        this.plants = plants
        this.initialized = true
        return { total: total_count }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load plants'
        throw err
      } finally {
        this.loading = false
      }
    },

    async preloadAllPaginated(limit: number): Promise<{ total: number }> {
      // Preload once with fixed condition (all + empty search); reuse cache regardless of later condition changes
      const key = 'global_all'
      if (this.lastKey === key && this.initialized && this.plants.length >= Math.min(this.totalCount, this.plants.length)) {
        return { total: this.totalCount }
      }

      this.loading = true
      this.error = null
      try {
        // First page
        const first = await plantApiService.getPlantsPaginated({ page: 1, limit })
        this.plants = first.plants
        // Hide loading after first page is ready; continue background preloading silently
        this.loading = false
        this.firstPageShown = true

        const total = first.total_count || 0
        this.totalCount = total
        this.lastKey = key
        const totalPages = Math.max(1, Math.ceil(total / limit))

        // Load remaining pages progressively
        for (let p = 2; p <= totalPages; p++) {
          try {
            const next = await plantApiService.getPlantsPaginated({ page: p, limit })
            this.plants = [...this.plants, ...next.plants]
          } catch (e) {
            // Capture error but continue attempting subsequent pages
            console.warn('[plants store] preload page failed:', p, e)
          }
          // Yield to UI thread
          await new Promise(resolve => setTimeout(resolve, 0))
        }

        this.initialized = true
        return { total }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load plants'
        throw err
      } finally {
        // Ensure loading cleared in any path (already false after first page)
        this.loading = false
      }
    },
  },
})


