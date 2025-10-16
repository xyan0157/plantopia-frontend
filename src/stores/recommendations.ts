import { defineStore } from 'pinia'
import { ref } from 'vue'
import { plantApiService, buildApiRequest, type Plant } from '@/services/api'

// Search parameters interface matching the SearchForm
export interface SearchParams {
  location: string
  locationType: string
  areaM2: number
  sunlight: string
  windExposure: string
  containers: boolean
  containerSizes: string[]
  goal: string
  edibleTypes: string[]
  ornamentalTypes: string[]
  maintainability: string
  watering: string
  timeToResults: string
  seasonIntent: string
  colors: string[]
  fragrant: boolean
  pollenSensitive: boolean
  petsOrToddlers: boolean
  budget: string
  hasBasicTools: boolean
  organicOnly: boolean
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

      console.log('[STORE] Building API request with params:', params)

      const apiReq = buildApiRequest({
        location: params.location,
        locationType: params.locationType,
        areaM2: params.areaM2 || 2.0,
        sunlight: params.sunlight,
        windExposure: params.windExposure || 'Moderate',
        containers: params.containers,
        containerSizes: params.containerSizes,
        goal: params.goal,
        edibleTypes: params.edibleTypes,
        ornamentalTypes: params.ornamentalTypes,
        maintainability: params.maintainability || 'Low',
        watering: params.watering || 'Medium',
        timeToResults: params.timeToResults,
        seasonIntent: params.seasonIntent || 'Start Now',
        colors: params.colors,
        fragrant: params.fragrant,
        pollenSensitive: params.pollenSensitive,
        petsOrToddlers: params.petsOrToddlers,
        budget: params.budget || 'Medium',
        hasBasicTools: params.hasBasicTools,
        organicOnly: params.organicOnly,
      })

      console.log('[STORE] Final API request:', apiReq)

      const apiResp = await plantApiService.getRecommendations(apiReq)
      const transformed = plantApiService.transformApiResponseToPlants(apiResp)
      plants.value = transformed
      showResults.value = true
    } catch (err: any) {
      error.value = err?.message || 'Failed to get recommendations. Please try again.'
      // keep previous results state; do not clear old results here
    } finally {
      loading.value = false

    }
  }

  function updateFilters(newFilters: any) {
    filters.value = { ...newFilters }
  }

  function clearResults() {
    plants.value = []
    showResults.value = false
    error.value = null
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
    clearResults,
  }
})


