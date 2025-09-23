// Preloader for Urban Heat Island (UHI) dashboard assets
// Loads metadata, data and boundaries once at app startup and caches them in-memory

type UhiMetadata = Record<string, unknown>
type UhiDataPayload = Record<string, unknown>
type GeoJson = Record<string, unknown>

let preloadPromise: Promise<void> | null = null
let cachedMetadata: UhiMetadata | null = null
let cachedData: UhiDataPayload | null = null
let cachedBoundariesSimplified: GeoJson | null = null
let cachedBoundariesFull: GeoJson | null = null

function baseUrl(): string {
  const envObj = (import.meta as unknown as { env?: Record<string, string> }).env || {}
  return envObj.VITE_API_URL || 'https://budgets-accepting-porcelain-austin.trycloudflare.com'
}

async function fetchJson<T = any>(url: string): Promise<T> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return (await resp.json()) as T
}

async function fetchBoundaryGeoJson(simplified: boolean): Promise<GeoJson> {
  const meta = await fetchJson<{ url: string }>(`${baseUrl()}/api/v1/uhi/boundaries?simplified=${simplified ? 'true' : 'false'}`)
  const geo = await fetchJson<GeoJson>(meta.url)
  return geo
}

export async function preloadUhiAll(): Promise<void> {
  if (preloadPromise) return preloadPromise
  preloadPromise = (async () => {
    try {
      const [metadata, data, geoSimple, geoFull] = await Promise.all([
        fetchJson<UhiMetadata>(`${baseUrl()}/api/v1/uhi/metadata`).catch(() => ({})),
        fetchJson<UhiDataPayload>(`${baseUrl()}/api/v1/uhi/data`).catch(() => ({})),
        fetchBoundaryGeoJson(true).catch(() => ({} as GeoJson)),
        fetchBoundaryGeoJson(false).catch(() => ({} as GeoJson)),
      ])
      cachedMetadata = metadata
      cachedData = data
      cachedBoundariesSimplified = geoSimple
      cachedBoundariesFull = geoFull
    } catch {
      // Swallow errors; dashboard will fallback to on-demand loads
    }
  })()
  return preloadPromise
}

export function getUhiMetadata(): UhiMetadata | null {
  return cachedMetadata
}

export function getUhiData(): UhiDataPayload | null {
  return cachedData
}

export function getBoundaryGeo(simplified: boolean): GeoJson | null {
  return simplified ? cachedBoundariesSimplified : cachedBoundariesFull
}


