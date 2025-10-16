// API service for plantopiaa Recommendation Engine
// Handles all communication with the backend recommendation API

// Configuration - Use VITE_API_URL from .env, or fallback to empty string for Vite proxy
// When VITE_API_URL is empty, API calls will go through Vite dev proxy
const PRIMARY_API_URL = import.meta.env.VITE_API_URL || ''

// API Response interfaces matching the backend structure
export interface ApiPlantRecommendation {
  id: number
  plant_name: string
  scientific_name: string
  plant_category: string
  description: string
  score: number
  why: string[]
  fit: {
    sun_need: string
    time_to_maturity_days: number
    maintainability: string
    container_ok: boolean
    indoor_ok: boolean
  }
  sowing: {
    climate_zone: string
    months: string[]
    method: string
    season_label: string
  }
  media: {
    image_url?: string     // Direct URL from backend (with special character fixes)
    image_path: string
    image_base64?: string  // Base64 encoded image data
    drive_url?: string     // Google Drive URL
    drive_thumbnail?: string // Google Drive thumbnail URL
    has_image?: boolean    // Whether image is available
  }
}

export interface ApiRecommendationResponse {
  recommendations: ApiPlantRecommendation[]
  notes: string[]
  suburb: string
  climate_zone: string
  month_now: string
}

// All Plants API Response interface
export interface ApiAllPlantsResponse {
  plants: ApiPlantData[]
  total_count: number
  categories: {
    vegetable: number
    herb: number
    flower: number
  }
}

// Paginated plants response (server-side pagination)
export interface ApiPaginatedPlantsResponse extends ApiAllPlantsResponse {
  page?: number
  limit?: number
}

// Individual plant data from /plants endpoint
export interface ApiPlantData {
  id: number
  plant_name: string
  scientific_name: string
  plant_category: 'vegetable' | 'herb' | 'flower'
  plant_type: string
  description: string
  image_url?: string
  additional_information?: string
  days_to_maturity: number
  plant_spacing: string
  sowing_depth: string
  position: string
  sun_need: string
  season: string
  germination_period: string
  sowing_method: string
  hardiness_life_cycle: string
  characteristics: string
  climate_specific_sowing: {
    [key: string]: string  // e.g., "temperate": "Mar-May, Sep-Nov"
  }
  container_ok: boolean
  indoor_ok: boolean
  edible: boolean
  fragrant: boolean
  flower_colors: string[]
  habit: string
  maintainability_score: number
  media: {
    image_path: string
    image_url?: string
    image_base64?: string
    drive_url?: string
    drive_thumbnail?: string
    has_image: boolean
  }
}

// Request interfaces matching the correct API requirements
export interface ApiSite {
  location_type: 'indoors' | 'balcony' | 'courtyard' | 'backyard' | 'community_garden'
  area_m2: number
  sun_exposure: 'full_sun' | 'part_sun' | 'bright_shade' | 'low_light'
  wind_exposure: 'sheltered' | 'moderate' | 'windy'
  containers: boolean
  container_sizes?: string[]
}

export interface ApiPreferences {
  goal: 'edible' | 'ornamental' | 'mixed'
  edible_types?: string[]
  ornamental_types?: string[]
  colors?: string[]
  fragrant?: boolean
  maintainability: 'low' | 'medium' | 'high'
  watering?: 'low' | 'medium' | 'high'
  time_to_results: 'quick' | 'standard' | 'patient'
  season_intent?: 'start_now' | 'happy_to_wait'
  pollen_sensitive?: boolean
  pets_or_toddlers?: boolean
}

export interface ApiPractical {
  budget: 'low' | 'medium' | 'high'
  has_basic_tools: boolean
  organic_only: boolean
}

export interface ApiUserEnvironment {
  climate_zone?: string
  month_now?: string
  uv_index?: number
  temperature_c?: number
  humidity_pct?: number
  wind_speed_kph?: number
}

export interface ApiRecommendationRequest {
  suburb: string
  n: number
  climate_zone?: string | null
  user_preferences: {
    user_id: string
    site: ApiSite
    preferences: ApiPreferences
    practical: ApiPractical
    environment: ApiUserEnvironment
  }
}

// Quantify Plant Impact API
export interface ApiQuantifyRequest {
  plant_name: string
  suburb?: string
  climate_zone?: string
  plant_count?: number
  user_preferences: Record<string, unknown>
}

export interface ApiQuantifiedImpact {
  temperature_reduction_c: number
  air_quality_points: number
  co2_absorption_kg_year?: number  // Legacy field (kg)
  co2_absorption_g_year?: number   // New field from backend (grams)
  water_processed_l_week: number
  pollinator_support: string
  edible_yield: string | null
  maintenance_time: string
  water_requirement: string
  risk_badge: string
  confidence_level: string
  why_this_plant: string
  community_impact_potential: string | null
}

// --- Auth types ---
export interface ApiAuthUser {
  id: number
  email?: string
  name?: string
  avatar_url?: string
}

// --- Tracking user/profile types ---
export interface ApiUserCore {
  id: number
  email: string
  name?: string
  suburb_id?: number
  created_at?: string
  updated_at?: string
  last_login?: string
}

export interface ApiUserProfileCore {
  id: number
  user_id: number
  experience_level?: string
  garden_type?: string
  climate_goals?: string
  available_space_m2?: number
  sun_exposure?: string | null
  has_containers?: boolean | null
  organic_preference?: boolean | null
  budget_level?: string | null
  notification_preferences?: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiUserUpsertResponse {
  success?: boolean
  message?: string
  user?: ApiUserCore
  profile?: ApiUserProfileCore
}

// Removed: ApiGoogleLoginResponse (deprecated with /api/v1/auth/google)

export interface ApiSuitabilityScore {
  total_score: number
  breakdown: Record<string, number>
}

export interface ApiQuantifyResponse {
  plant_name: string
  scientific_name?: string | null
  plant_category: string
  quantified_impact: ApiQuantifiedImpact
  suitability_score: ApiSuitabilityScore
  suburb: string
  climate_zone: string
  plant_count: number
}

// Tracking: user's plant instances (journal plants)
export interface ApiUserPlantInstanceSummary {
  instance_id: number
  plant_id: number
  plant_name: string
  plant_nickname?: string
  start_date?: string
  expected_maturity_date?: string
  current_stage?: string
  days_elapsed?: number
  progress_percentage?: number
  location_details?: string
  image_url?: string
}

export interface ApiUserPlantsResponse {
  plants: ApiUserPlantInstanceSummary[]
  total_count?: number
  active_count?: number
  pagination?: { page?: number; limit?: number; total_pages?: number }
}

// Favorites
export interface ApiFavoriteItem {
  id: number
  plant_id: number
  notes?: string
  priority_level?: number
  created_at?: string
  plant?: Partial<ApiPlantData> & { plant_name?: string; plant_category?: string; image_url?: string }
}

// Frontend Plant interface (transformed from API response)
export interface Plant {
  id: string
  databaseId: number
  name: string
  scientific_name: string
  description: string
  category: 'vegetable' | 'herb' | 'flower'
  plant_type?: string
  additional_information?: string
  days_to_maturity: number
  plant_spacing?: string
  sowing_depth?: string
  position?: string
  season?: string
  germination_period?: string
  sowing_method?: string
  hardiness_life_cycle?: string
  characteristics?: string
  climate_specific_sowing?: { [key: string]: string }
  image_url?: string
  image_base64?: string
  has_image?: boolean
  tags?: string[]
  care_requirements?: {
    sunlight?: string
    watering?: string
    soil?: string
    temperature?: string
  }
  // Additional plant properties from API
  container_ok?: boolean
  indoor_ok?: boolean
  edible?: boolean
  fragrant?: boolean
  flower_colors?: string[]
  habit?: string
  maintainability_score?: number
  // Legacy fields for backwards compatibility with recommendation system
  scientificName?: string
  score?: number
  sunlight?: 'full' | 'partial' | 'shade'
  water?: 'low' | 'medium' | 'high'
  effort?: 'low' | 'medium' | 'high'
  whyRecommended?: string[]
  benefits?: {
    edible: boolean
    fragrant: boolean
    petSafe: boolean
    airPurifying: boolean
    droughtResistant: boolean
    containerFriendly: boolean
    indoorSuitable: boolean
  }
  coolingEffect?: string
  carbonReduction?: string
  droughtTolerance?: string
  timeToMaturity?: number
  sowingInfo?: {
    climateZone: string
    months: string[]
    method: string
    seasonLabel: string
  }
  imagePath?: string
  imageData?: string
  // Companion planting (comma-separated from API)
  beneficial_companions?: string
  harmful_companions?: string
  neutral_companions?: string
}

// API Service class
export class PlantRecommendationService {
  private primaryUrl: string
  private currentBaseUrl: string
  private gcsPlantImagesBaseUrl: string

  constructor(primaryUrl: string = PRIMARY_API_URL) {
    this.primaryUrl = primaryUrl
    this.currentBaseUrl = primaryUrl
    const envObj = (import.meta as unknown as { env?: Record<string, string> }).env || {}
    // Prefer env override if provided; otherwise use the shared bucket base
    this.gcsPlantImagesBaseUrl = envObj.VITE_IMAGES_BASE_URL || 'https://storage.googleapis.com/plantopia-images-1757656642/plant_images'
  }

  private async fetchWithFallback(endpoint: string, options?: RequestInit): Promise<Response> {
    const url = `${this.currentBaseUrl}${endpoint}`
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return response
  }

  // Removed: googleLogin (backend endpoint deprecated)

  // Health check endpoint
  async healthCheck(): Promise<{ message: string }> {
    try {
      const response = await this.fetchWithFallback('/api/v1/')
      return await response.json()
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }

  // Get all plants endpoint
  async getAllPlants(): Promise<ApiAllPlantsResponse> {
    try {
      // console.debug('[PLANTS API] Get All Plants Request')
      const response = await this.fetchWithFallback('/api/v1/plants')
      const responseData = await response.json()
      return responseData
    } catch (error) {
      // console.error('[PLANTS API] Error Debug', error)
      throw error
    }
  }

  // Get plants with server-side pagination
  async getPlantsPaginated(params: { page: number; limit: number; category?: string; search?: string }): Promise<{ plants: Plant[]; total_count: number; page: number; limit: number }> {
    const { page, limit, category, search } = params
    try {
      const qp = new URLSearchParams({ page: String(page), limit: String(Math.min(Math.max(limit, 1), 100)) })
      if (category && category !== 'all') qp.set('category', category)
      if (search && search.trim()) qp.set('search', search.trim())
      // console.debug('[PLANTS API] Get Plants Paginated Request', qp.toString())
      const response = await this.fetchWithFallback(`/api/v1/plants/paginated?${qp.toString()}`)

      const responseData: unknown = await response.json()
      const data = responseData as Partial<ApiPaginatedPlantsResponse> & { pagination?: { total?: number; total_count?: number; page?: number; limit?: number } }

      const totalFromApi =
        data.total_count ??
        data.pagination?.total_count ??
        data.pagination?.total ??
        (data as { total?: number }).total ?? 0

      const pageFromApi = data.page ?? data.pagination?.page ?? page
      const limitFromApi = data.limit ?? data.pagination?.limit ?? limit

      const plants = this.transformAllPlantsToPlants({
        plants: data.plants || [],
        total_count: totalFromApi || 0,
        categories: data.categories || { vegetable: 0, herb: 0, flower: 0 },
      })

      return {
        plants,
        total_count: Number(totalFromApi || 0),
        page: Number(pageFromApi),
        limit: Number(limitFromApi),
      }
    } catch (error) {
      throw error
    }
  }

  // Main recommendation endpoint
  async getRecommendations(request: ApiRecommendationRequest): Promise<ApiRecommendationResponse> {
    try {
      // console.debug('[PLANT API] /recommendations request')
      const response = await this.fetchWithFallback('/api/v1/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
      const responseData = await response.json()
      return responseData
    } catch (error) {
      // console.error('[PLANT API] recommendations error:', error)
      throw error
    }
  }

  // Quantify plant impact endpoint
  async quantifyPlantImpact(request: ApiQuantifyRequest, signal?: AbortSignal): Promise<ApiQuantifyResponse> {
    try {
      // console.debug('[PLANT API] Quantify Plant Impact Request')
      const response = await this.fetchWithFallback('/api/v1/quantify-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal, // Add abort signal support
      })

      const data = await response.json()
      return data as ApiQuantifyResponse
    } catch (error) {
      // console.error('[PLANT API] quantifyPlantImpact error:', error)
      throw error
    }
  }

  // Batch quantify endpoint
  async batchQuantifyImpact(requests: ApiQuantifyRequest[]): Promise<ApiQuantifyResponse[]> {
    try {
      const response = await this.fetchWithFallback('/api/v1/batch-quantify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requests),
      })
      const data = await response.json()
      return data as ApiQuantifyResponse[]
    } catch (error) {
      // console.error('[PLANT API] batchQuantifyImpact error:', error)
      throw error
    }
  }

  // --- AI Chat (General) ---
  async startGeneralChatByEmail(email: string): Promise<{ chat_id: number; expires_at?: string }> {
    try {
      const payload = { email }
      console.log('[Chat] start/general request', payload)
      const response = await this.fetchWithFallback('/api/v1/chat/general/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      console.log('[Chat] start/general response', data)
      const chatId = Number((data.chat_id ?? data.id) || 0)
      return { chat_id: chatId, expires_at: data.expires_at }
    } catch (error) {
      try { console.error('[Chat] start/general failed', { email, error }) } catch {}
      throw error
    }
  }

  // --- Tracking: Build user_data from profile/localStorage ---
  buildTrackingUserDataFromProfile(): {
    email: string
    name: string
    suburb_id: number
    experience_level: string
    garden_type: string
    available_space: number
    climate_goal: string
    start_date: string
  } {
    const email = ((): string => {
      try { return localStorage.getItem('plantopia_user_email') || '' } catch { return '' }
    })()
    const savedName = ((): string => {
      try { return localStorage.getItem('profile_display_name') || localStorage.getItem('plantopia_user_name') || '' } catch { return '' }
    })()
    const experience = ((): string => {
      try { return localStorage.getItem('profile_experience') || 'beginner' } catch { return 'beginner' }
    })()
    const gardenType = ((): string => {
      try { return localStorage.getItem('profile_garden_type') || 'backyard' } catch { return 'backyard' }
    })()
    const available = ((): number => {
      try { const v = parseFloat(localStorage.getItem('profile_available_space') || '') ; return Number.isFinite(v) ? v : 10.0 } catch { return 10.0 }
    })()
    const goal = ((): string => {
      try { return localStorage.getItem('profile_climate_goal') || 'general gardening' } catch { return 'general gardening' }
    })()
    const suburbId = ((): number => {
      try {
        const sid = localStorage.getItem('profile_suburb_id') || localStorage.getItem('profile_suburb') || ''
        const n = parseInt(sid as string, 10)
        return Number.isFinite(n) ? n : 0
      } catch { return 0 }
    })()
    const today = new Date();
    const startDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())).toISOString().slice(0, 10)

    return {
      email,
      name: savedName || 'User',
      suburb_id: suburbId,
      experience_level: experience,
      garden_type: gardenType,
      available_space: available,
      climate_goal: goal,
      start_date: startDate,
    }
  }

  // Build user upsert payload (without start_date)
  buildUserUpsertDataFromProfile(): {
    email: string
    name?: string
    suburb_id?: number
    experience_level?: string
    garden_type?: string
    available_space?: number
    climate_goal?: string
  } {
    const email = ((): string => {
      try { return localStorage.getItem('plantopia_user_email') || '' } catch { return '' }
    })()
    const savedName = ((): string | undefined => {
      try { return localStorage.getItem('profile_display_name') || localStorage.getItem('plantopia_user_name') || undefined } catch { return undefined }
    })()
    const experience = ((): string | undefined => {
      try { const v = localStorage.getItem('profile_experience'); return v || undefined } catch { return undefined }
    })()
    const gardenType = ((): string | undefined => {
      try { const v = localStorage.getItem('profile_garden_type'); return v || undefined } catch { return undefined }
    })()
    const available = ((): number | undefined => {
      try { const v = parseFloat(localStorage.getItem('profile_available_space') || '') ; return Number.isFinite(v) ? v : undefined } catch { return undefined }
    })()
    const goal = ((): string | undefined => {
      try { const v = localStorage.getItem('profile_climate_goal'); return v || undefined } catch { return undefined }
    })()
    const suburbId = ((): number | undefined => {
      try {
        const sid = localStorage.getItem('profile_suburb_id') || localStorage.getItem('profile_suburb') || ''
        const n = parseInt(sid as string, 10)
        return Number.isFinite(n) ? n : undefined
      } catch { return undefined }
    })()

    const payload: {
      email: string
      name?: string
      suburb_id?: number
      experience_level?: string
      garden_type?: string
      available_space?: number
      climate_goal?: string
    } = { email }
    if (savedName) payload.name = savedName
    if (typeof suburbId === 'number') payload.suburb_id = suburbId
    if (experience) payload.experience_level = experience
    if (gardenType) payload.garden_type = gardenType
    if (typeof available === 'number') payload.available_space = available
    if (goal) payload.climate_goal = goal
    return payload
  }

  // Upsert user/profile to backend using current local profile
  async upsertUserByProfile(): Promise<ApiUserUpsertResponse> {
    const body = this.buildUserUpsertDataFromProfile()
    if (!body.email) return { success: false }
    const response = await this.fetchWithFallback('/api/v1/tracking/user/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    try { const data = await response.json(); return data as ApiUserUpsertResponse } catch { return { success: true } }
  }

  // --- Suburbs cache and helper ---
  private static SUBURBS_CACHE_KEY = 'suburbs_cache_v1'
  private static SUBURBS_CACHE_TTL_MS = 24 * 60 * 60 * 1000

  private readCachedSuburbs(): Array<{ id: number; name: string }> | null {
    try {
      const raw = localStorage.getItem(PlantRecommendationService.SUBURBS_CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { ts?: number; list?: Array<{ id: number; name: string }> }
      if (!parsed?.list || !Array.isArray(parsed.list)) return null
      const ts = typeof parsed.ts === 'number' ? parsed.ts : 0
      if (Date.now() - ts > PlantRecommendationService.SUBURBS_CACHE_TTL_MS) return null
      return parsed.list
    } catch { return null }
  }

  private writeCachedSuburbs(list: Array<{ id: number; name: string }>) {
    try { localStorage.setItem(PlantRecommendationService.SUBURBS_CACHE_KEY, JSON.stringify({ ts: Date.now(), list })) } catch {}
  }

  async fetchAllSuburbs(): Promise<Array<{ id: number; name: string }>> {
    const cached = this.readCachedSuburbs()
    if (cached) return cached
    try {
      const resp = await this.fetchWithFallback('/api/v1/suburbs')
      const json: unknown = await resp.json()
      const arr: Array<Record<string, unknown>> = Array.isArray(json)
        ? (json as Array<Record<string, unknown>>)
        : (Array.isArray((json as { suburbs?: unknown }).suburbs) ? (json as { suburbs: Array<Record<string, unknown>> }).suburbs : [])
      const list = arr
        .map((s) => ({ id: Number((s.id ?? (s as { suburb_id?: unknown }).suburb_id) || 0), name: String((s.name ?? (s as { suburb?: unknown }).suburb) || '') }))
        .filter((s) => Number.isFinite(s.id) && Boolean(s.name))
      this.writeCachedSuburbs(list)
      return list
    } catch { return [] }
  }

  async getSuburbNameById(id: number): Promise<string | null> {
    const list = await this.fetchAllSuburbs()
    const found = list.find((s) => s.id === id)
    return found?.name || null
  }

  // --- Tracking timeline for a plant (growth stages template) ---
  async getPlantGrowthTimeline(plantId: number): Promise<Record<string, unknown>> {
    try {
      const resp = await this.fetchWithFallback(`/api/v1/tracking/timeline/${encodeURIComponent(String(plantId))}`)
      return await resp.json()
    } catch (e) {
      console.error('Failed to fetch growth timeline', e)
      throw e
    }
  }

  // --- Tracking: Instance details & operations ---
  async getPlantInstanceDetails(instanceId: number): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}`)
    return await resp.json()
  }

  async getPlantInstanceTips(instanceId: number, limit: number = 3): Promise<Record<string, unknown>> {
    const qs = new URLSearchParams()
    if (limit) qs.set('limit', String(limit))
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}/tips${qs.toString() ? `?${qs.toString()}` : ''}`)
    return await resp.json()
  }

  async updatePlantInstanceProgress(instanceId: number, body: { current_stage?: string; user_notes?: string; location_details?: string; align_to_stage_start?: boolean }): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}/progress`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    return await resp.json()
  }

  async initializeChecklistForInstance(instanceId: number): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}/initialize-checklist`, { method: 'POST' })
    return await resp.json()
  }

  async completeChecklistItem(payload: { instance_id: number; checklist_item_key: string; is_completed: boolean; user_notes?: string }): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback('/api/v1/tracking/checklist/complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    return await resp.json()
  }

  async updateInstanceNickname(instanceId: number, plant_nickname: string): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}/nickname`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plant_nickname })
    })
    return await resp.json()
  }

  async autoUpdateInstanceStage(instanceId: number): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}/auto-update-stage`, { method: 'POST' })
    return await resp.json()
  }

  // New: explicitly mark an instance as started growing
  async startGrowingInstance(instanceId: number, startDate?: string): Promise<Record<string, unknown>> {
    const body = startDate ? { start_date: startDate } : {}
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}/start-growing`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    try { return await resp.json() } catch { return {} }
  }

  async getPlantRequirements(plantId: number): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/requirements/${encodeURIComponent(String(plantId))}`)
    return await resp.json()
  }

  async getPlantInstructions(plantId: number): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instructions/${encodeURIComponent(String(plantId))}`)
    return await resp.json()
  }

  // --- Phase 1 New Endpoints ---

  // Get checklist state for an instance
  async getInstanceChecklist(instanceId: number): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}/checklist`)
    return await resp.json()
  }

  // Mark setup as complete
  async completeSetup(instanceId: number): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}/complete-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    return await resp.json()
  }

  // Get comprehensive instance status
  async getInstanceStatus(instanceId: number): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}/status`)
    return await resp.json()
  }

  // --- Tracking: Delete/Deactivate a plant instance (remove from journal) ---
  async deletePlantInstance(instanceId: number): Promise<Record<string, unknown>> {
    const resp = await this.fetchWithFallback(`/api/v1/tracking/instance/${encodeURIComponent(String(instanceId))}`, { method: 'DELETE' })
    // Backend may return empty body; try json, else return {}
    try { return await resp.json() } catch { return {} }
  }

  async startPlantTrackingByProfile(params: { plant_id: number; plant_nickname?: string; location_details?: string }): Promise<{ instance_id: number }> {
    const user_data = this.buildTrackingUserDataFromProfile()
    // Match backend schema exactly; include optional fields as empty strings when absent
    const body: Record<string, unknown> = {
      user_data,
      plant_id: params.plant_id,
      plant_nickname: params.plant_nickname ?? '',
      start_date: user_data.start_date,
      location_details: params.location_details ?? ''
    }
    try {
      console.log('[Tracking] POST /api/v1/tracking/start request', body)
      const response = await this.fetchWithFallback('/api/v1/tracking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      // Log response body (json or text) without consuming main stream
      try {
        const clone = response.clone()
        try {
          const loggedJson = await clone.json()
          console.log('[Tracking] /api/v1/tracking/start response', { status: response.status, ok: response.ok, body: loggedJson })
        } catch {
          const loggedText = await clone.text()
          console.log('[Tracking] /api/v1/tracking/start response (text)', { status: response.status, ok: response.ok, body: loggedText })
        }
      } catch {}

      let data: { instance_id?: number; message?: string; error?: string } = {}
      try { data = await response.json() as { instance_id?: number; message?: string; error?: string } } catch {}

      if (!response.ok) {
        const message = String(data?.message || data?.error || 'Request failed')
        const err = new Error(`Tracking start failed: ${response.status} ${message}`)
        console.error('[Tracking] /api/v1/tracking/start error (http)', err)
        throw err
      }

      return { instance_id: Number(data?.instance_id || 0) }
    } catch (error) {
      console.error('[Tracking] /api/v1/tracking/start error', error)
      throw error
    }
  }

  async sendGeneralChatMessage(payload: { chat_id: number; message: string; image?: string | null }): Promise<{ reply: string; token_warning?: boolean; total_tokens?: number }> {
    try {
      const response = await this.fetchWithFallback('/api/v1/chat/general/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json() as { ai_response?: string; reply?: string; message?: string; text?: string; answer?: string; token_warning?: boolean; total_tokens?: number }
      const reply: string = data.ai_response || data.reply || data.message || data.text || data.answer || ''
      return { reply, token_warning: Boolean(data.token_warning), total_tokens: data.total_tokens }
    } catch (error) {
      throw error
    }
  }

  // --- AI Chat (Plant-specific) ---
  async startPlantChat(instanceId: number, email: string): Promise<{ chat_id: number; expires_at?: string }> {
    const response = await this.fetchWithFallback(`/api/v1/chat/plant/${encodeURIComponent(String(instanceId))}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    const data = await response.json()
    return { chat_id: Number(data.chat_id || 0), expires_at: data.expires_at }
  }

  async sendPlantChatMessage(payload: { chat_id: number; message: string; image?: string | null }): Promise<{ reply: string; token_warning?: boolean; total_tokens?: number }> {
    const response = await this.fetchWithFallback('/api/v1/chat/plant/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await response.json() as { ai_response?: string; token_warning?: boolean; total_tokens?: number }
    return { reply: data.ai_response || '', token_warning: Boolean(data.token_warning), total_tokens: data.total_tokens }
  }

    // (temporary suburbs helper removed)

  // --- Tracking: Get user's plant instances (by email as user_id) ---
  async getUserTrackingPlants(userId: string, options?: { active_only?: boolean; page?: number; limit?: number }): Promise<ApiUserPlantsResponse> {
    const qp = new URLSearchParams()
    if (options?.active_only !== undefined) qp.set('active_only', String(Boolean(options.active_only)))
    if (options?.page) qp.set('page', String(options.page))
    if (options?.limit) qp.set('limit', String(options.limit))
    const qs = qp.toString()
    const path = `/api/v1/tracking/user/${encodeURIComponent(String(userId))}${qs ? `?${qs}` : ''}`
    const response = await this.fetchWithFallback(path)
    const data = await response.json()
    return data as ApiUserPlantsResponse
  }

  // New: fetch user tracking plants by email (preferred in new API spec)
  async getUserTrackingPlantsByEmail(email: string, options?: { active_only?: boolean; page?: number; limit?: number }): Promise<ApiUserPlantsResponse> {
    const qp = new URLSearchParams()
    if (options?.active_only !== undefined) qp.set('active_only', String(Boolean(options.active_only)))
    if (options?.page) qp.set('page', String(options.page))
    if (options?.limit) qp.set('limit', String(options.limit))
    const qs = qp.toString()
    const path = `/api/v1/tracking/user/${encodeURIComponent(String(email))}${qs ? `?${qs}` : ''}`
    const response = await this.fetchWithFallback(path)
    const data = await response.json()
    return data as ApiUserPlantsResponse
  }

  // --- Favorites: get current user's favorite plants ---
  async getUserFavorites(): Promise<ApiFavoriteItem[]> {
    try {
      const response = await this.fetchWithFallback('/api/v1/favorites')
      const data = await response.json()
      return (Array.isArray(data) ? data : (data?.favorites || [])) as ApiFavoriteItem[]
    } catch {
      // If unauthorized or endpoint missing, return empty list gracefully
      return []
    }
  }

  // Favorites (email-scoped)
  async getFavoritesByEmail(email: string): Promise<ApiFavoriteItem[]> {
    try {
      const qp = new URLSearchParams({ email })
      const resp = await this.fetchWithFallback(`/api/v1/favorites?${qp.toString()}`)
      const data = await resp.json()
      return (Array.isArray(data) ? data : (data?.favorites || [])) as ApiFavoriteItem[]
    } catch { return [] }
  }

  async addFavoriteByEmail(email: string, plantId: number, notes?: string): Promise<ApiFavoriteItem | null> {
    try {
      const body = { email, plant_id: Number(plantId), ...(notes ? { notes } : {}) }
      try { console.log('[Favorites][Plant] POST /api/v1/favorites request', body) } catch {}
      const resp = await this.fetchWithFallback('/api/v1/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await resp.json()
      try { console.log('[Favorites][Plant] response', data) } catch {}
      return (data || null) as ApiFavoriteItem | null
    } catch { return null }
  }

  async removeFavoriteByEmail(plantId: number, email: string): Promise<{ removed: boolean }> {
    try {
      const qp = new URLSearchParams({ email })
      const resp = await this.fetchWithFallback(`/api/v1/favorites/${encodeURIComponent(String(plantId))}?${qp.toString()}`, { method: 'DELETE' })
      try { return await resp.json() } catch { return { removed: true } }
    } catch { return { removed: false } }
  }

  async syncFavoritesByEmail(email: string, favoritePlantIds: number[]): Promise<ApiFavoriteItem[]> {
    try {
      const resp = await this.fetchWithFallback('/api/v1/favorites/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, favorite_plant_ids: favoritePlantIds }) })
      const data = await resp.json()
      return (Array.isArray(data) ? data : (data?.favorites || [])) as ApiFavoriteItem[]
    } catch { return [] }
  }

  async checkFavoriteByEmail(plantId: number, email: string): Promise<{ is_favorite: boolean }> {
    try {
      const qp = new URLSearchParams({ email })
      const resp = await this.fetchWithFallback(`/api/v1/favorites/check/${encodeURIComponent(String(plantId))}?${qp.toString()}`)
      const data = await resp.json()
      return { is_favorite: Boolean((data as { is_favorite?: boolean }).is_favorite) }
    } catch { return { is_favorite: false } }
  }

  // Transform All Plants API response to frontend Plant interface
  transformAllPlantsToPlants(apiResponse: ApiAllPlantsResponse): Plant[] {
    // console.debug('[TRANSFORM] All Plants -> Plants')
    const transformedPlants = apiResponse.plants.map((apiPlant) => {

      const transformedPlant: Plant = {
        id: String(apiPlant.id),
        databaseId: apiPlant.id,
        name: apiPlant.plant_name,
        scientific_name: apiPlant.scientific_name,
        description: apiPlant.description || 'No description available.',
        category: apiPlant.plant_category,
        plant_type: apiPlant.plant_type,
        additional_information: apiPlant.additional_information || '',
        days_to_maturity: apiPlant.days_to_maturity,
        plant_spacing: apiPlant.plant_spacing,
        sowing_depth: apiPlant.sowing_depth,
        position: apiPlant.position,
        season: apiPlant.season,
        germination_period: apiPlant.germination_period,
        sowing_method: apiPlant.sowing_method,
        hardiness_life_cycle: apiPlant.hardiness_life_cycle,
        characteristics: apiPlant.characteristics,
        climate_specific_sowing: apiPlant.climate_specific_sowing,
        image_url: this.getImageUrlForAllPlants(apiPlant),
        image_base64: apiPlant.media?.image_base64,
        has_image: apiPlant.media?.has_image || false,
        // Companion planting (strings possibly provided by backend)
        beneficial_companions: (apiPlant as unknown as { beneficial_companions?: string }).beneficial_companions,
        harmful_companions: (apiPlant as unknown as { harmful_companions?: string }).harmful_companions,
        neutral_companions: (apiPlant as unknown as { neutral_companions?: string }).neutral_companions,
        // Additional plant properties
        container_ok: apiPlant.container_ok,
        indoor_ok: apiPlant.indoor_ok,
        edible: apiPlant.edible,
        fragrant: apiPlant.fragrant,
        flower_colors: apiPlant.flower_colors,
        habit: apiPlant.habit,
        maintainability_score: apiPlant.maintainability_score,
        // Sustainability impact (derived for All Plants so favourites have values)
        coolingEffect: this.determineCoolingEffect(apiPlant.plant_category),
        carbonReduction: this.determineCarbonReduction(apiPlant.plant_category),
        droughtTolerance: (apiPlant.characteristics || '').toLowerCase().includes('drought') ? 'excellent' : 'moderate',
        // Generate tags from characteristics and plant type
        tags: this.generateTagsFromPlantData(apiPlant),
        // Generate care requirements from plant data
        care_requirements: this.generateCareRequirements(apiPlant),
      }

      return transformedPlant
    })
    // console.debug('[TRANSFORM] Completed All Plants transform')
    return transformedPlants
  }

  // Transform API response to frontend Plant interface
  transformApiResponseToPlants(apiResponse: ApiRecommendationResponse): Plant[] {
    // console.debug('[TRANSFORM] Recommendations -> Plants')
    const transformedPlants = apiResponse.recommendations.map((apiPlant) => {

      const transformedPlant: Plant = {
        id: String(apiPlant.id),
        databaseId: apiPlant.id,
        name: apiPlant.plant_name,
        scientific_name: apiPlant.scientific_name,
        description: apiPlant.description || 'No description available.',
        category: apiPlant.plant_category as 'vegetable' | 'herb' | 'flower',
        days_to_maturity: apiPlant.fit.time_to_maturity_days,
        image_url: this.getImageUrl(apiPlant),
        image_base64: apiPlant.media.image_base64,
        has_image: apiPlant.media.has_image,
        // Legacy fields for backwards compatibility
        scientificName: apiPlant.scientific_name,
        score: apiPlant.score,
        sunlight: this.mapSunlightRequirement(apiPlant.fit.sun_need),
        water: this.mapWaterRequirement(apiPlant.fit.maintainability),
        effort: this.mapEffortLevel(apiPlant.fit.maintainability),
        whyRecommended: apiPlant.why,
        benefits: {
          edible: apiPlant.plant_category === 'herb' || apiPlant.plant_category === 'vegetable',
          fragrant: apiPlant.plant_category === 'herb',
          petSafe: true, // Default - would need plant database for accurate info
          airPurifying: apiPlant.fit.indoor_ok,
          droughtResistant: apiPlant.fit.maintainability === 'hardy',
          containerFriendly: apiPlant.fit.container_ok,
          indoorSuitable: apiPlant.fit.indoor_ok,
        },
        coolingEffect: this.determineCoolingEffect(apiPlant.plant_category),
        carbonReduction: this.determineCarbonReduction(apiPlant.plant_category),
        droughtTolerance: apiPlant.fit.maintainability === 'hardy' ? 'excellent' : 'moderate',
        timeToMaturity: apiPlant.fit.time_to_maturity_days,
        sowingInfo: {
          climateZone: apiPlant.sowing.climate_zone,
          months: apiPlant.sowing.months,
          method: apiPlant.sowing.method,
          seasonLabel: apiPlant.sowing.season_label,
        },
        // companion + visual cues
        flower_colors: (apiPlant as unknown as { flower_colors?: string[] }).flower_colors,
        imagePath: apiPlant.media.image_path,
        imageData: apiPlant.media.image_base64, // Base64 encoded image
        // Companion planting (strings possibly provided by backend)
        beneficial_companions: (apiPlant as unknown as { beneficial_companions?: string }).beneficial_companions,
        harmful_companions: (apiPlant as unknown as { harmful_companions?: string }).harmful_companions,
        neutral_companions: (apiPlant as unknown as { neutral_companions?: string }).neutral_companions,
      }

      return transformedPlant
    })
    // console.debug('[TRANSFORM] Completed Recommendations transform')
    return transformedPlants
  }

  // Helper methods for data transformation
  private mapSunlightRequirement(sunNeed: string): 'full' | 'partial' | 'shade' {
    switch (sunNeed.toLowerCase()) {
      case 'full_sun':
        return 'full'
      case 'part_sun':
      case 'partial_sun':
        return 'partial'
      case 'bright_shade':
      case 'shade':
        return 'shade'
      default:
        return 'partial'
    }
  }

  private mapWaterRequirement(maintainability: string): 'low' | 'medium' | 'high' {
    switch (maintainability.toLowerCase()) {
      case 'hardy':
        return 'low'
      case 'moderate':
        return 'medium'
      case 'high_maintenance':
        return 'high'
      default:
        return 'medium'
    }
  }

  private mapEffortLevel(maintainability: string): 'low' | 'medium' | 'high' {
    switch (maintainability.toLowerCase()) {
      case 'hardy':
        return 'low'
      case 'moderate':
        return 'medium'
      case 'high_maintenance':
        return 'high'
      default:
        return 'medium'
    }
  }

  private determineCoolingEffect(category: string): string {
    switch (category.toLowerCase()) {
      case 'tree':
        return 'high cooling effect'
      case 'shrub':
        return 'moderate cooling effect'
      case 'flower':
      case 'herb':
        return 'low cooling effect'
      default:
        return 'moderate cooling effect'
    }
  }

  private determineCarbonReduction(category: string): string {
    switch (category.toLowerCase()) {
      case 'tree':
        return 'high'
      case 'shrub':
        return 'moderate'
      case 'flower':
      case 'herb':
      case 'vegetable':
        return 'low'
      default:
        return 'moderate'
    }
  }

  // Generate tags from plant data
  private generateTagsFromPlantData(apiPlant: ApiPlantData): string[] {
    const tags: string[] = []

    // Add category as a tag
    tags.push(apiPlant.plant_category)

    // Add plant type if different from category
    if (apiPlant.plant_type && apiPlant.plant_type !== apiPlant.plant_category) {
      tags.push(apiPlant.plant_type)
    }

    // Extract tags from characteristics
    if (apiPlant.characteristics) {
      const characteristics = apiPlant.characteristics.toLowerCase()
      if (characteristics.includes('drought')) tags.push('drought-tolerant')
      if (characteristics.includes('fragrant')) tags.push('fragrant')
      if (characteristics.includes('compact')) tags.push('compact')
      if (characteristics.includes('climbing')) tags.push('climbing')
      if (characteristics.includes('fast')) tags.push('fast-growing')
      if (characteristics.includes('container')) tags.push('container-friendly')
    }

    // Add season-based tags
    if (apiPlant.season) {
      const season = apiPlant.season.toLowerCase()
      if (season.includes('summer')) tags.push('summer')
      if (season.includes('winter')) tags.push('winter')
      if (season.includes('spring')) tags.push('spring')
      if (season.includes('autumn') || season.includes('fall')) tags.push('autumn')
    }

    // Add maturity-based tags
    if (apiPlant.days_to_maturity <= 60) {
      tags.push('quick-growing')
    } else if (apiPlant.days_to_maturity > 120) {
      tags.push('slow-growing')
    }

    return tags.filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
  }

  // Generate care requirements from plant data
  private generateCareRequirements(apiPlant: ApiPlantData): { sunlight?: string; watering?: string; soil?: string; temperature?: string } {
    const requirements: { sunlight?: string; watering?: string; soil?: string; temperature?: string } = {}

    // Extract sunlight requirements from sun_need field first, then fallback to position
    if (apiPlant.sun_need) {
      const sunNeed = apiPlant.sun_need.toLowerCase()
      if (sunNeed === 'full_sun') {
        requirements.sunlight = 'Full sun (6-8h)'
      } else if (sunNeed === 'part_sun') {
        requirements.sunlight = 'Part sun (3-5h)'
      } else if (sunNeed === 'bright_shade') {
        requirements.sunlight = 'Bright shade (1-3h)'
      }
    } else if (apiPlant.position) {
      // Fallback to position field if sun_need is not available
      const position = apiPlant.position.toLowerCase()
      if (position.includes('full sun')) {
        requirements.sunlight = 'Full sun (6-8h)'
      } else if (position.includes('part sun') || position.includes('partial')) {
        requirements.sunlight = 'Part sun (3-5h)'
      } else if (position.includes('shade')) {
        requirements.sunlight = 'Bright shade (1-3h)'
      }
    }

    // Determine watering needs based on category and characteristics
    if (apiPlant.characteristics) {
      const characteristics = apiPlant.characteristics.toLowerCase()
      if (characteristics.includes('drought')) {
        requirements.watering = 'Low'
      } else if (characteristics.includes('moist') || apiPlant.plant_category === 'vegetable') {
        requirements.watering = 'Medium'
      } else {
        requirements.watering = 'Medium'
      }
    } else {
      // Default watering based on category
      switch (apiPlant.plant_category) {
        case 'herb':
          requirements.watering = 'Low'
          break
        case 'vegetable':
          requirements.watering = 'Medium'
          break
        case 'flower':
          requirements.watering = 'Medium'
          break
        default:
          requirements.watering = 'Medium'
      }
    }

    // Set soil requirements (generic for now)
    requirements.soil = 'Well-draining'

    // Set temperature range based on season and category
    if (apiPlant.season) {
      const season = apiPlant.season.toLowerCase()
      if (season.includes('cool') || season.includes('winter')) {
        requirements.temperature = '10-18°C'
      } else if (season.includes('warm') || season.includes('summer')) {
        requirements.temperature = '18-26°C'
      } else {
        requirements.temperature = '15-22°C'
      }
    } else {
      requirements.temperature = '15-22°C'
    }

    return requirements
  }

  // Helper method to build dataset image URL from GCS for plants without explicit URL
  private findVictoriaPlantImage(plantName: string, scientificName: string, category: string): string | null {
    /**
     * Search for plant images in Victoria Plants Data structure in public folder
     * Returns the first image found or null if no image found
     */
    if (!plantName || !category) {
      return null
    }

    // Map category to folder name
    const categoryFolders: Record<string, string> = {
      'flower': 'flower_plant_images',
      'herb': 'herb_plant_images',
      'vegetable': 'vegetable_plant_images'  // Prepared for when vegetable images are added
    }

    const folderName = categoryFolders[category.toLowerCase()]
    if (!folderName) {
      return null
    }

    // Build robust patterns (underscore/hyphen/stripped) and multiple index candidates
    const toUnderscore = (s: string) => s.replace(/\s+/g, '_')
    const toHyphen = (s: string) => s.replace(/\s+/g, '-')
    const strip = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim()

    const patterns: string[] = []
    const add = (v?: string) => { if (v) patterns.push(v) }

    // Raw and stripped combos (prefer Plant_Scientific first, then Plant)
    add(scientificName ? `${plantName}_${scientificName}` : undefined)
    add(plantName)
    const ps = strip(plantName)
    const ss = scientificName ? strip(scientificName) : ''
    add(ss ? `${ps}_${ss}` : undefined)
    add(ps)

    // Underscore combos
    const pu = toUnderscore(plantName)
    const su = scientificName ? toUnderscore(scientificName) : ''
    add(su ? `${pu}_${su}` : undefined)
    add(pu)
    const psu = toUnderscore(ps)
    const ssu = ss ? toUnderscore(ss) : ''
    add(ssu ? `${psu}_${ssu}` : undefined)
    add(psu)

    // Hyphen combos
    const ph = toHyphen(plantName)
    const sh = scientificName ? toHyphen(scientificName) : ''
    add(sh ? `${ph}_${sh}` : undefined)
    add(ph)
    const psh = toHyphen(ps)
    const ssh = ss ? toHyphen(ss) : ''
    add(ssh ? `${psh}_${ssh}` : undefined)
    add(psh)

    const indexCandidates: string[] = ['1','2','3','4']
    for (const pattern of patterns) {
      if (!pattern) continue
      const encoded = encodeURIComponent(pattern)
      for (const idx of indexCandidates) {
        const imagePath = `${this.gcsPlantImagesBaseUrl}/${folderName}/${encoded}/${encoded}_${idx}.jpg`
        return imagePath
      }
    }

    return null
  }

  private getImageUrl(apiPlant: ApiPlantRecommendation): string {
    /**
     * Get the best available image URL with fallback priority:
     * 1. Backend-provided direct URL (highest priority)
     * 2. Explicit image_path from backend (served via GCS base)
     * 3. Base64 data (if available)
     * 4. Google Drive URL
     * 5. Victoria Plants Data image (derived path)
     * 6. Category-specific fallback image
     */
    // First priority: Backend-provided direct URL (with special character fixes)
    if (apiPlant.media?.image_url) {
      return apiPlant.media.image_url
    }

    // Second priority: Direct path from backend (GCS)
    if (apiPlant.media?.image_path) {
      const direct = this.buildGcsImageUrl(apiPlant.media.image_path)
      if (direct) return direct
    }

    // Third priority: Base64 data
    if (apiPlant.media.image_base64) {
      return `data:image/jpeg;base64,${apiPlant.media.image_base64}`
    }

    // Third priority: Google Drive URL
    if (apiPlant.media.drive_url) {
      return apiPlant.media.drive_url
    }

    // Fourth priority: Victoria Plants Data image
    const victoriaImage = this.findVictoriaPlantImage(
      apiPlant.plant_name,
      apiPlant.scientific_name,
      apiPlant.plant_category
    )
    if (victoriaImage) {
      return victoriaImage
    }

    // Fifth priority: Category-specific fallback
    return this.getCategoryFallbackImage(apiPlant.plant_category)
  }

  private getImageUrlForAllPlants(apiPlant: ApiPlantData): string {
    /**
     * Get the best available image URL for /plants endpoint
     */
    // 0) Backend-provided direct URL (highest priority if present)
    const providedUrl = (apiPlant as Partial<ApiPlantData>)?.media?.image_url || (apiPlant as Partial<ApiPlantData>)?.image_url
    if (providedUrl) {
      return String(providedUrl)
    }

    // 1) Base64 from API
    if (apiPlant.media?.image_base64) {
      return `data:image/jpeg;base64,${apiPlant.media.image_base64}`
    }

    // 2) Direct path from backend (GCS base)
    if (apiPlant.media?.image_path) {
      const direct = this.buildGcsImageUrl(apiPlant.media.image_path)
      if (direct) return direct
    }

    // 3) Google Drive (explicit URLs from backend)
    if (apiPlant.media?.drive_url) {
      return apiPlant.media.drive_url
    }

    // 4) Victoria dataset image derived from plant/scientific name (attempt regardless of has_image flag)
    {
      const victoriaImage = this.findVictoriaPlantImage(
        apiPlant.plant_name,
        apiPlant.scientific_name,
        apiPlant.plant_category
      )
      if (victoriaImage) {
        return victoriaImage
      }
    }

    // 5) Category fallback image
    return this.getCategoryFallbackImage(apiPlant.plant_category)
  }

  private getCategoryFallbackImage(category: string): string {
    /**
     * Return category-specific fallback images
     */
    const fallbackImages: Record<string, string> = {
      'flower': '/Flower.jpg',
      'herb': '/Herb.jpg',
      'vegetable': '/Vegetable.jpg'
    }
    return fallbackImages[category.toLowerCase()] || '/placeholder-plant.svg'
  }

  private buildGcsImageUrl(pathFromApi: string | undefined): string | null {
    if (!pathFromApi) return null
    // If backend already returns a full URL, use it as is
    if (/^https?:\/\//i.test(pathFromApi)) return pathFromApi
    const normalized = pathFromApi.replace(/^\/+/, '')
    // Avoid duplicating plant_images segment if included in path
    const relative = normalized.startsWith('plant_images/')
      ? normalized.substring('plant_images/'.length)
      : normalized
    return `${this.gcsPlantImagesBaseUrl}/${relative}`
  }

}

// Create and export a singleton instance
export const plantApiService = new PlantRecommendationService()

// Helper function to build API request from enhanced form data
export function buildApiRequest(formData: {
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
}): ApiRecommendationRequest {
  console.group('[BUILD REQUEST] Form Data to API Request')
  console.log('[BUILD REQUEST] Input Form Data:', formData)

  // Use location directly as suburb name (no extraction needed)
  const suburb = formData.location.trim()
  console.log('[BUILD REQUEST] Using suburb:', suburb)

  // Check for empty required fields
  console.log('[BUILD REQUEST] Field Check:')
  console.log('  - locationType empty?', !formData.locationType)
  console.log('  - sunlight empty?', !formData.sunlight)
  console.log('  - goal empty?', !formData.goal)
  console.log('  - timeToResults empty?', !formData.timeToResults)

  // Map location type
  const locationTypeMap: { [key: string]: ApiSite['location_type'] } = {
    'Indoors': 'indoors',
    'Balcony': 'balcony',
    'Courtyard': 'courtyard',
    'Backyard': 'backyard',
    'Community Garden': 'community_garden',
  }

  // Map container sizes
  const containerSizeMap: { [key: string]: string } = {
    'Small (<=15cm)': 'small',
    'Medium (16-25cm)': 'medium',
    'Large (26-40cm)': 'large',
    'Very Large (>40cm)': 'very_large',
  }

  // Map sunlight to sun exposure
  const sunExposureMap: { [key: string]: ApiSite['sun_exposure'] } = {
    'Full Sun (6-8h)': 'full_sun',
    'Part Sun (3-5h)': 'part_sun',
    'Bright Shade (1-3h)': 'bright_shade',
    'Low Light (<1h)': 'low_light',
  }

  // Map wind exposure
  const windExposureMap: { [key: string]: ApiSite['wind_exposure'] } = {
    'Sheltered': 'sheltered',
    'Moderate': 'moderate',
    'Windy': 'windy',
  }

  // Map goal
  const goalMap: { [key: string]: ApiPreferences['goal'] } = {
    'Edible': 'edible',
    'Ornamental': 'ornamental',
    'Mixed': 'mixed',
  }

  // Map maintainability
  const maintainabilityMap: { [key: string]: ApiPreferences['maintainability'] } = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
  }

  // Map watering
  const wateringMap: { [key: string]: ApiPreferences['watering'] } = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
  }

  // Map season intent
  const seasonIntentMap: { [key: string]: ApiPreferences['season_intent'] } = {
    'Start Now': 'start_now',
    'Happy to Wait': 'happy_to_wait',
  }

  // Map time to results
  const timeToResultsMap: { [key: string]: ApiPreferences['time_to_results'] } = {
    'Quick (<=60d)': 'quick',
    'Standard (60-120d)': 'standard',
    'Patient (>120d)': 'patient',
  }

  // Map budget
  const budgetMap: { [key: string]: ApiPractical['budget'] } = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
  }

    // Convert edible types to lowercase
  const edibleTypesLower = formData.edibleTypes.map(type => type.toLowerCase())

  // Convert ornamental types to lowercase
  const ornamentalTypesLower = formData.ornamentalTypes.map(type => type.toLowerCase())

  // Convert colors to lowercase
  const colorsLower = formData.colors.map(color => color.toLowerCase())

  // Map container sizes to API format
  const containerSizesApi = formData.containers ?
    formData.containerSizes.map(size => containerSizeMap[size] || size.toLowerCase()) :
    undefined

  const apiRequest: ApiRecommendationRequest = {
    suburb,
    n: 9,
    climate_zone: null,
    user_preferences: {
      user_id: 'anon_mvp',
      site: {
        location_type: locationTypeMap[formData.locationType] || 'backyard',
        area_m2: formData.areaM2 || 2.0,
        sun_exposure: sunExposureMap[formData.sunlight] || 'part_sun',
        wind_exposure: windExposureMap[formData.windExposure] || 'moderate',
        containers: formData.containers,
        container_sizes: containerSizesApi,
      },
      preferences: {
        goal: goalMap[formData.goal] || 'mixed',
        // Only send edible_types if goal is edible or mixed, and user selected them
        // Let backend use its own defaults if not specified
        edible_types: edibleTypesLower.length > 0 ? edibleTypesLower : undefined,
        ornamental_types: ornamentalTypesLower.length > 0 ? ornamentalTypesLower : undefined,
        colors: colorsLower.length > 0 ? colorsLower : undefined,
        fragrant: formData.fragrant,
        maintainability: maintainabilityMap[formData.maintainability] || 'low',
        watering: wateringMap[formData.watering] || 'medium',
        time_to_results: timeToResultsMap[formData.timeToResults] || 'quick',
        season_intent: seasonIntentMap[formData.seasonIntent] || 'start_now',
        pollen_sensitive: formData.pollenSensitive,
        pets_or_toddlers: formData.petsOrToddlers,
      },
      practical: {
        budget: budgetMap[formData.budget] || 'medium',
        has_basic_tools: formData.hasBasicTools,
        organic_only: formData.organicOnly,
      },
      environment: {
        climate_zone: 'temperate',
        month_now: '',
        uv_index: 0.0,
        temperature_c: 8.0,
        humidity_pct: 75,
        wind_speed_kph: 15,
      },
    },
  }

  console.log('[BUILD REQUEST] Field Mappings:')
  console.log('  - Location Type:', formData.locationType, '->', apiRequest.user_preferences.site.location_type)
  console.log('  - Area M2:', formData.areaM2, '->', apiRequest.user_preferences.site.area_m2)
  console.log('  - Sunlight:', formData.sunlight, '->', apiRequest.user_preferences.site.sun_exposure)
  console.log('  - Wind Exposure:', formData.windExposure, '->', apiRequest.user_preferences.site.wind_exposure)
  console.log('  - Goal:', formData.goal, '->', apiRequest.user_preferences.preferences.goal)
  console.log('  - Maintainability:', formData.maintainability, '->', apiRequest.user_preferences.preferences.maintainability)
  console.log('  - Watering:', formData.watering, '->', apiRequest.user_preferences.preferences.watering)
  console.log('  - Time to Results:', formData.timeToResults, '->', apiRequest.user_preferences.preferences.time_to_results)
  console.log('  - Season Intent:', formData.seasonIntent, '->', apiRequest.user_preferences.preferences.season_intent)
  console.log('  - Budget:', formData.budget, '->', apiRequest.user_preferences.practical.budget)
  console.log('  - Edible Types (input):', formData.edibleTypes, 'length:', formData.edibleTypes.length)
  console.log('  - Edible Types (output):', apiRequest.user_preferences.preferences.edible_types, '(undefined if empty)')
  console.log('  - Ornamental Types (input):', formData.ornamentalTypes, 'length:', formData.ornamentalTypes.length)
  console.log('  - Ornamental Types (output):', apiRequest.user_preferences.preferences.ornamental_types, '(undefined if empty)')
  console.log('  - Colors:', formData.colors, '->', apiRequest.user_preferences.preferences.colors)
  console.log('  - Fragrant:', formData.fragrant)
  console.log('  - Pollen Sensitive:', formData.pollenSensitive)
  console.log('  - Pets/Toddlers:', formData.petsOrToddlers)

  console.log('[BUILD REQUEST] Final API Request:', apiRequest)
  console.groupEnd()

  return apiRequest
}
