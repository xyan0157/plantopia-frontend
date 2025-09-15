export function getPlantImageUrl(category: string, imageName?: string | null): Promise<string | null>
export function getCategoryImages(category: string): Promise<Array<any>>
export function getPlaceholderImage(category: string): string
export function getPlantCategories(): string[]
export function isValidCategory(category: string): boolean
export function handleImageError(event: Event, category?: string | null): void
export function preloadPlantImages(categories?: string[]): Promise<any[]>
declare const _default: {
  getPlantImageUrl: typeof getPlantImageUrl
  getCategoryImages: typeof getCategoryImages
  getPlaceholderImage: typeof getPlaceholderImage
  getPlantCategories: typeof getPlantCategories
  isValidCategory: typeof isValidCategory
  handleImageError: typeof handleImageError
  preloadPlantImages: typeof preloadPlantImages
}
export default _default

