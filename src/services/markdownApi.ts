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
}

export const markdownApiService = new MarkdownApiService()


