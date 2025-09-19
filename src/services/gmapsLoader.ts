/* eslint-disable @typescript-eslint/no-explicit-any */
let loadingPromise: Promise<void> | null = null

export function ensureGoogleMapsLoaded(apiKey?: string): Promise<void> {
  if ((window as any).google?.maps) return Promise.resolve()
  if (loadingPromise) return loadingPromise

  // Fallback dev key kept for local testing to avoid blank key errors
  const fallbackDevKey = 'AIzaSyAsxXNmYoU4g2C8QmY5BkDIHCNK-ihR5js'
  const key = apiKey || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || fallbackDevKey
  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gmaps-loader]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')))
      return
    }
    const script = document.createElement('script')
    // Force English labels and AU regional bias
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=visualization,places,geometry&language=en&region=AU`
    script.async = true
    script.defer = true
    script.setAttribute('data-gmaps-loader', '1')
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })

  return loadingPromise
}


