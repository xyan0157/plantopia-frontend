import { plantApiService, type Plant, type ApiAllPlantsResponse } from '@/services/api'

function checkImageLoad(url: string, timeoutMs: number = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    let done = false

    const finish = (ok: boolean) => {
      if (done) return
      done = true
      img.onload = null
      img.onerror = null
      resolve(ok)
    }

    img.onload = () => finish(true)
    img.onerror = () => finish(false)

    const timer = setTimeout(() => finish(false), timeoutMs)
    img.onload = () => { clearTimeout(timer); finish(true) }
    img.onerror = () => { clearTimeout(timer); finish(false) }

    img.crossOrigin = 'anonymous'
    img.src = url
  })
}

function isFallbackUrl(url: string | undefined): boolean {
  if (!url) return true
  return /\/Flower\.jpg$|\/Herb\.jpg$|\/Vegetable\.jpg$|placeholder-plant\.svg$/i.test(url)
}

function toCsv(rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  return rows.map(r => r.map(c => escape(c)).join(',')) .join('\n')
}

function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function generateMissingImagesCsvFromPlants(plants: Plant[]): Promise<{ missing: Plant[]; csv: string }> {
  // Only record real load failures (network/404). Do not include placeholders/fallbacks/flag false.
  const header = ['name', 'scientific_name', 'category', 'image_url']
  const rows: string[][] = [header]

  const missingSet = new Set<string>()
  const checks: Array<Promise<void>> = []

  for (const p of plants) {
    const url = p.image_url
    if (!url) continue
    if (isFallbackUrl(url)) continue

    checks.push((async () => {
      const ok = await checkImageLoad(url)
      if (!ok) {
        rows.push([p.name, p.scientific_name || '', p.category, url])
        missingSet.add(p.name)
      }
    })())
  }

  await Promise.all(checks)

  const csv = toCsv(rows)
  downloadCsv('missing_images.csv', csv)
  const missing = plants.filter(p => missingSet.has(p.name))
  return { missing, csv }
}

export async function fetchAllPlantsAndGenerateMissingImagesCsv(): Promise<{ missing: Plant[]; csv: string }> {
  const apiResp: ApiAllPlantsResponse = await plantApiService.getAllPlants()
  const plants: Plant[] = plantApiService.transformAllPlantsToPlants(apiResp)
  return generateMissingImagesCsvFromPlants(plants)
}

declare global {
  interface Window { generateAllPlantsMissingImagesCsv?: () => Promise<{ missing: Plant[]; csv: string }> }
}

if (typeof window !== 'undefined') {
  window.generateAllPlantsMissingImagesCsv = async () => fetchAllPlantsAndGenerateMissingImagesCsv()
}


