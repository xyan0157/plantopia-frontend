import { defineStore } from 'pinia'
import { plantApiService, type Plant, type ApiAllPlantsResponse } from '@/services/api'

interface PlantsState {
  plants: Plant[]
  loading: boolean
  error: string | null
  initialized: boolean
}

export const usePlantsStore = defineStore('plants', {
  state: (): PlantsState => ({
    plants: [],
    loading: false,
    error: null,
    initialized: false,
  }),
  actions: {
    async ensureLoaded(): Promise<void> {
      if (this.initialized || this.loading) return
      await this.preloadAll()
    },

    async preloadAll(): Promise<void> {
      this.loading = true
      this.error = null
      try {
        // Health check; let fallback logic inside the service handle base switching
        await plantApiService.healthCheck()

        const apiResponse: ApiAllPlantsResponse = await plantApiService.getAllPlants()

        // First page immediately
        const pageSize = 12
        const firstBatchResponse: ApiAllPlantsResponse = {
          ...apiResponse,
          plants: apiResponse.plants.slice(0, pageSize),
          total_count: apiResponse.total_count,
          categories: apiResponse.categories,
        }
        const firstBatch = plantApiService.transformAllPlantsToPlants(firstBatchResponse)
        this.plants = firstBatch

        // Remaining in background
        for (let i = pageSize; i < (apiResponse.plants?.length || 0); i += pageSize) {
          const nextBatchResponse: ApiAllPlantsResponse = {
            ...apiResponse,
            plants: apiResponse.plants.slice(i, i + pageSize),
            total_count: apiResponse.total_count,
            categories: apiResponse.categories,
          }
          const nextBatch = plantApiService.transformAllPlantsToPlants(nextBatchResponse)
          this.plants = [...this.plants, ...nextBatch]
          await new Promise(resolve => setTimeout(resolve, 0))
        }

        this.initialized = true
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load plants'
      } finally {
        this.loading = false
      }
    },
  },
})


