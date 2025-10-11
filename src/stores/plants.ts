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
      // Use server-side pagination: show page 1 immediately, then append remaining pages in background
      const key = 'global_paginated_progressive'
      if (this.lastKey === key && this.initialized && this.plants.length > 0) {
        return { total: this.totalCount }
      }

      this.loading = true
      this.error = null
      try {
        const pageSize = 200
        const first = await plantApiService.getPlantsPaginated({ page: 1, limit: pageSize })
        this.plants = first.plants
        this.totalCount = Number(first.total_count || first.plants.length || 0)
        this.lastKey = key
        this.firstPageShown = true
        this.initialized = true

        // Background progressive append
        ;(async () => {
          const totalPages = Math.max(1, Math.ceil(this.totalCount / pageSize))
          for (let page = 2; page <= totalPages; page += 1) {
            try {
              const { plants } = await plantApiService.getPlantsPaginated({ page, limit: pageSize })
              this.plants = [...this.plants, ...plants]
            } catch {
              // ignore background page errors
            }
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


