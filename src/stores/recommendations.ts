import { defineStore } from 'pinia'
import { ref } from 'vue'
import { plantApiService, buildApiRequest, type Plant } from '@/services/api'

// Minimal shape mirrored from RecommendationsView form
export interface SearchParams {
  location: string
  locationType: string
  areaSize: string
  sunlight: string
  windExposure: string
  hasContainers: boolean
  goal: string
  maintainability: string
  timeToResults: string
  budget: string
  hasBasicTools: boolean
  organicOnly: boolean
  edibleTypes: string[]
  ornamentalTypes: string[]
}

export const useRecommendationsStore = defineStore('recommendations', () => {
  const plants = ref<Plant[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const showResults = ref(false)
  const lastParams = ref<SearchParams | null>(null)
  const filters = ref<any>({})

  async function submitSearch(params: SearchParams): Promise<void> {
    lastParams.value = params
    loading.value = true
    error.value = null
    plants.value = []

    try {
      await plantApiService.healthCheck()
      const apiReq = buildApiRequest({
        location: params.location,
        locationType: params.locationType,
        areaM2: Number(params.areaSize) || 2.0,
        sunlight: params.sunlight,
        windExposure: params.windExposure,
        containers: params.hasContainers,
        containerSizes: [],
        goal: params.goal,
        edibleTypes: params.edibleTypes || [],
        ornamentalTypes: params.ornamentalTypes || [],
        maintainability: params.maintainability,
        watering: 'Medium',
        timeToResults: params.timeToResults,
        seasonIntent: 'Start Now',
        colors: [],
        fragrant: false,
        pollenSensitive: false,
        petsOrToddlers: false,
        budget: params.budget,
        hasBasicTools: params.hasBasicTools,
        organicOnly: params.organicOnly,
      } as any)

      const apiResp = await plantApiService.getRecommendations(apiReq)
      const transformed = plantApiService.transformApiResponseToPlants(apiResp)
      plants.value = transformed
      showResults.value = true
    } catch (err: any) {
      error.value = err?.message || 'Failed to get recommendations. Please try again.'
      // 保留 showResults 现状，避免意外清空旧结果
    } finally {
      loading.value = false
    }
  }

  function updateFilters(newFilters: any) {
    filters.value = { ...newFilters }
  }

  return {
    // state
    plants,
    loading,
    error,
    showResults,
    lastParams,
    filters,
    // actions
    submitSearch,
    updateFilters,
  }
})


