/* eslint-disable @typescript-eslint/no-explicit-any */
let loadingPromise: Promise<void> | null = null

export function ensureGoogleIdentityLoaded(clientId?: string): Promise<void> {
  if ((window as any).google?.accounts?.id) return Promise.resolve()
  if (loadingPromise) return loadingPromise

  const envObj = (import.meta as unknown as { env?: Record<string, string> }).env || {}
  const cid = clientId || envObj.VITE_GOOGLE_CLIENT_ID
  if (!cid) {
    // Script can load without clientId; actual initialization will require it
  }

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity script')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.setAttribute('data-google-identity', '1')
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity script'))
    document.head.appendChild(script)
  })

  return loadingPromise
}

export function parseJwtCredential(credential: string): { name?: string; email?: string; picture?: string } {
  try {
    const parts = credential.split('.')
    if (parts.length < 2) return {}
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return { name: payload?.name, email: payload?.email, picture: payload?.picture }
  } catch {
    return {}
  }
}


