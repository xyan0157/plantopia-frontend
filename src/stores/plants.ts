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
  favouritesLoaded: boolean
  loadedPagesMax: number
  lastFilterKey: string | null
  pageCache: Record<number, Plant[]>
  prefetching: boolean
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
    favourites: new Set<string>(),
    favouritesLoaded: false,
    loadedPagesMax: 0,
    lastFilterKey: null,
    pageCache: {},
    prefetching: false,
  }),
  actions: {
    async loadFavouritesFromApi(): Promise<void> {
      if (this.favouritesLoaded) return
      try {
        const email = localStorage.getItem('plantopia_user_email') || ''
        if (!email) { this.favouritesLoaded = true; this.favourites = new Set(); return }
        const favs = await plantApiService.getFavoritesByEmail(email)
        const ids = favs.map(f => String(f.plant_id))
        this.favourites = new Set(ids)
      } catch { this.favourites = new Set() } finally { this.favouritesLoaded = true }
    },
    async syncLocalFavouritesToServer(): Promise<void> {
      try {
        const email = localStorage.getItem('plantopia_user_email') || ''
        if (!email) return
        let localIds: string[] = []
        try { localIds = JSON.parse(localStorage.getItem('favourite_plants') || '[]') } catch { localIds = [] }
        const idsNum = (Array.isArray(localIds) ? localIds : []).map(v => parseInt(String(v), 10)).filter(n => Number.isFinite(n))
        if (idsNum.length === 0) return
        const merged = await plantApiService.syncFavoritesByEmail(email, idsNum)
        const ids = merged.map(f => String(f.plant_id))
        this.favourites = new Set(ids)
        this.favouritesLoaded = true
        try { localStorage.removeItem('favourite_plants') } catch {}
      } catch {}
    },
    async toggleFavourite(id: string) {
      const email = localStorage.getItem('plantopia_user_email') || ''
      if (!email) return
      const pid = parseInt(id, 10)
      if (this.favourites.has(id)) {
        await plantApiService.removeFavoriteByEmail(pid, email)
        this.favourites.delete(id)
      } else {
        await plantApiService.addFavoriteByEmail(email, pid)
        this.favourites.add(id)
      }
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
        // Reset loaded-pages tracker when filter key changes
        const filterKey = `${category || 'all'}|${(search || '').trim()}`
        if (this.lastFilterKey !== filterKey) {
          this.loadedPagesMax = 0
          this.lastFilterKey = filterKey
          this.pageCache = {}
        }
        // Serve from cache if available
        const cached = this.pageCache[page]
        if (cached) {
          this.plants = cached
        } else {
          const { plants } = await plantApiService.getPlantsPaginated({ page, limit, category, search })
          this.plants = plants
          this.pageCache[page] = plants
        }
        // Always refresh total_count from page 1 to keep it accurate
        if (page === 1) {
          try {
            const { total_count } = await plantApiService.getPlantsPaginated({ page: 1, limit, category, search })
            this.totalCount = Number(total_count || 0)
          } catch {}
        }
        this.firstPageShown = page === 1 ? true : this.firstPageShown
        this.initialized = true
        this.loadedPagesMax = Math.max(this.loadedPagesMax, page)
        return { total: this.totalCount }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load plants'
        throw err
      } finally {
        this.loading = false
      }
    },

    async preloadAllPaginated(): Promise<{ total: number }> {
      // Use server-side pagination: load only the first page (12) for initial view
      const key = 'global_paginated_progressive'
      if (this.lastKey === key && this.initialized && this.plants.length > 0) {
        return { total: this.totalCount }
      }

      this.loading = true
      this.error = null
      try {
        const initialLimit = 12
        const first = await plantApiService.getPlantsPaginated({ page: 1, limit: initialLimit })
        this.plants = first.plants
        this.totalCount = Number(first.total_count || first.plants.length || 0)
        this.lastKey = key
        this.firstPageShown = true
        this.initialized = true
        this.loadedPagesMax = 1
        this.lastFilterKey = 'all|'
        this.pageCache = { 1: first.plants }

        return { total: this.totalCount }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load plants'
        throw err
      } finally {
        this.loading = false
      }
    },

    // Background prefetch subsequent pages sequentially; updates loadedPagesMax as pages are cached
    async startPrefetch(limit: number, category?: string, search?: string): Promise<void> {
      const filterKey = `${category || 'all'}|${(search || '').trim()}`
      if (this.prefetching && this.lastFilterKey === filterKey) return
      this.prefetching = true
      try {
        // Ensure we know totalCount by querying page 1 if needed
        if (!this.totalCount) {
          try {
            const { total_count } = await plantApiService.getPlantsPaginated({ page: 1, limit, category, search })
            this.totalCount = Number(total_count || 0)
          } catch {}
        }
        const totalPages = Math.max(1, Math.ceil(Math.max(0, this.totalCount) / Math.max(1, limit)))
        for (let p = Math.max(2, this.loadedPagesMax + 1); p <= totalPages; p += 1) {
          // If filter changes during loop, stop
          if (this.lastFilterKey !== filterKey) break
          try {
            if (!this.pageCache[p]) {
              const { plants } = await plantApiService.getPlantsPaginated({ page: p, limit, category, search })
              this.pageCache[p] = plants
              this.loadedPagesMax = Math.max(this.loadedPagesMax, p)
            }
          } catch {
            // Brief backoff on error and continue with next
            await new Promise((r) => setTimeout(r, 500))
          }
          // Short pacing to avoid hammering server
          await new Promise((r) => setTimeout(r, 150))
        }
      } finally {
        this.prefetching = false
      }
    },
  },
})


