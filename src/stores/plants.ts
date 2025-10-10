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
        await this.preloadAllPaginated()
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

    async preloadAllPaginated(): Promise<{ total: number }> {
      // Load all plants via GET /api/v1/plants (single request, no server pagination)
      const key = 'global_all_no_pagination'
      if (this.lastKey === key && this.initialized && this.plants.length > 0) {
        return { total: this.totalCount }
      }

      this.loading = true
      this.error = null
      try {
        const res = await plantApiService.getAllPlants()
        const plants = plantApiService.transformAllPlantsToPlants(res)
        // First paint: show first 12 items immediately
        const firstBatchSize = 12
        this.plants = plants.slice(0, firstBatchSize)
        this.totalCount = Number(res.total_count || plants.length || 0)
        this.lastKey = key
        this.firstPageShown = true
        this.initialized = true
        // Background: progressively append remaining items to store in chunks
        ;(async () => {
          const chunkSize = 48
          for (let i = firstBatchSize; i < plants.length; i += chunkSize) {
            const chunk = plants.slice(i, i + chunkSize)
            await new Promise<void>(r => setTimeout(() => r(), 0))
            this.plants = [...this.plants, ...chunk]
          }
        })()

        return { total: this.totalCount }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load plants'
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})


