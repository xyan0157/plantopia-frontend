// Markdown (Grow Guide) API client for cloud backend only

const PRIMARY_API_URL = import.meta.env.VITE_API_URL || 'https://budgets-accepting-porcelain-austin.trycloudflare.com'

export interface MarkdownCategory {
  name: string
  slug: string
  file_count?: number
}

export interface MarkdownFileSummary {
  filename: string
  title?: string
  content?: string
  file_size?: number
  file_path?: string
}

export interface MarkdownCategoryResponse {
  categories: MarkdownCategory[]
  total_categories?: number
}

export interface MarkdownFilesByCategoryResponse {
  category: string
  files: MarkdownFileSummary[]
}

export interface MarkdownFileResponse {
  category: string
  file: MarkdownFileSummary
}

export class MarkdownApiService {
  private currentBaseUrl: string
  private readonly primaryUrl: string

  constructor(primaryUrl: string = PRIMARY_API_URL) {
    this.primaryUrl = primaryUrl
    this.currentBaseUrl = primaryUrl
  }

  private async fetchWithFallback(endpoint: string, options?: RequestInit): Promise<Response> {
    const res = await fetch(`${this.currentBaseUrl}${endpoint}`, options)
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    return res
  }

  async listCategories(): Promise<MarkdownCategoryResponse> {
    const res = await this.fetchWithFallback('/api/v1/markdown/categories')
    return res.json()
  }

  async listFilesByCategory(categorySlug: string): Promise<MarkdownFilesByCategoryResponse> {
    const endpoint = `/api/v1/markdown/category/${encodeURIComponent(categorySlug)}`
    const res = await this.fetchWithFallback(endpoint)
    return res.json()
  }

  async listGrowGuide(): Promise<MarkdownFilesByCategoryResponse> {
    const res = await this.fetchWithFallback('/api/v1/markdown/grow-guide')
    return res.json()
  }

  async getFile(categorySlug: string, filename: string): Promise<MarkdownFileResponse> {
    const endpoint = `/api/v1/markdown/file/${encodeURIComponent(categorySlug)}/${encodeURIComponent(filename)}`
    const res = await this.fetchWithFallback(endpoint)
    return res.json()
  }

  // --- Guides Favorites (email-scoped) ---
  async addGuideFavorite(email: string, guideName: string, category?: string, notes?: string): Promise<Record<string, unknown> | null> {
    const body: Record<string, unknown> = { email, guide_name: guideName }
    if (category) body.category = category
    if (notes) body.notes = notes
    try { console.log('[Guides][Favorite] POST /api/v1/guides/favorites request', body) } catch {}
    const res = await this.fetchWithFallback('/api/v1/guides/favorites', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    try {
      const json = await res.json()
      try { console.log('[Guides][Favorite] response', json) } catch {}
      return json
    } catch { return null }
  }

  async removeGuideFavorite(guideName: string, email: string): Promise<{ removed: boolean }> {
    const qp = new URLSearchParams({ email })
    const res = await this.fetchWithFallback(`/api/v1/guides/favorites/${encodeURIComponent(guideName)}?${qp.toString()}`, { method: 'DELETE' })
    try { return await res.json() } catch { return { removed: true } }
  }

  async getGuideFavoritesByEmail(email: string): Promise<Array<{ id: number; guide_name: string; category?: string; notes?: string; created_at?: string }>> {
    const qp = new URLSearchParams({ email })
    const res = await this.fetchWithFallback(`/api/v1/guides/favorites/user?${qp.toString()}`)
    const json = await res.json()
    const list = (json as { favorites?: unknown }).favorites
    return Array.isArray(list) ? (list as Array<{ id: number; guide_name: string; category?: string; notes?: string; created_at?: string }>) : []
  }

  async checkGuideFavorite(guideName: string, email: string): Promise<{ is_favorite: boolean }> {
    const qp = new URLSearchParams({ email })
    const res = await this.fetchWithFallback(`/api/v1/guides/favorites/check/${encodeURIComponent(guideName)}?${qp.toString()}`)
    const json = await res.json()
    return { is_favorite: Boolean((json as { is_favorite?: boolean }).is_favorite) }
  }
}

export const markdownApiService = new MarkdownApiService()


