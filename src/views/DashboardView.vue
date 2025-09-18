<template>
  <div class="dashboard">
    <video class="page-bg" src="/Guide%20background.mp4" autoplay muted playsinline></video>
    <div class="page-container">
      <h1 class="page-title">Your Climate Impact Dashboard</h1>
      <div class="content-card">
        <div class="map-grid">
          <div class="map-panel">
            <div class="map-card-header">Heat Intensity</div>
            <div id="gmap" class="map"></div>
            <div id="uhi-legend" class="uhi-legend" v-show="legendHtml" v-html="legendHtml"></div>
          </div>
          <div class="map-panel">
            <div class="map-card-header">Vegetation Coverage</div>
            <div id="vegmap" class="map"></div>
            <div id="veg-legend" class="uhi-legend" v-show="vegLegendHtml" v-html="vegLegendHtml"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { onMounted, ref } from 'vue'

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-gmaps-loader]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')))
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization,places,geometry`;
    script.async = true
    script.defer = true
    script.setAttribute('data-gmaps-loader', '1')
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}

const gmapRef = ref<any>(null)
const vegMapRef = ref<any>(null)
const legendHtml = ref('')
const vegLegendHtml = ref('')
let lastSimplified = true
let categoriesMap: Record<string, { color: string; label: string }> = {}

function uhiUrl(path: string) {
  const base = (import.meta as any).env?.VITE_API_URL || 'https://budgets-accepting-porcelain-austin.trycloudflare.com'
  return `${base}${path}`
}

async function initUhiOnMap() {
  try {
    const metaResp = await fetch(uhiUrl('/api/v1/uhi/metadata'))
    if (metaResp.ok) {
      const meta = await metaResp.json()
      categoriesMap = meta?.heat_categories || {}
      buildLegend(categoriesMap)
    }
    await loadBoundaries(true)
    gmapRef.value!.addListener('zoom_changed', async () => {
      const z = gmapRef.value!.getZoom()
      const wantSimplified = !(z >= 12)
      if (wantSimplified !== lastSimplified) {
        lastSimplified = wantSimplified
        await loadBoundaries(wantSimplified)
      }
    })
  } catch (err) {
    console.error('UHI init failed', err)
  }
}

async function initVegetationMap() {
  try {
    vegLegendHtml.value = '<div class="legend-title">Vegetation (%)</div>' +
      ['0-10','10-20','20-30','30-40','40+'].map((b, i) => `
        <div class="legend-row">
          <span class="legend-label">${b}</span>
          <span class="legend-color" style="background:${['#fef3c7','#fde68a','#86efac','#34d399','#059669'][i]}"></span>
        </div>
      `).join('')
    await loadVegetationLayer(true)
    vegMapRef.value!.addListener('zoom_changed', async () => {
      const z = vegMapRef.value!.getZoom()
      const wantSimplified = !(z >= 12)
      await loadVegetationLayer(wantSimplified)
    })
  } catch (err) {
    console.error('Vegetation init failed', err)
  }
}

function vegStyleFeature(feature: any) {
  const pct = Number(feature.getProperty('VEG_TOTAL')) || 0
  const color = pct >= 40 ? '#059669' : pct >= 30 ? '#34d399' : pct >= 20 ? '#86efac' : pct >= 10 ? '#fde68a' : '#fef3c7'
  return {
    fillColor: color,
    fillOpacity: 0.6,
    strokeWeight: 1,
    strokeColor: '#ffffff',
  }
}

async function loadVegetationLayer(simplified: boolean) {
  if (!vegMapRef.value) return
  vegMapRef.value!.data.forEach((f: any) => vegMapRef.value!.data.remove(f))
  const resp = await fetch(uhiUrl(`/api/v1/uhi/boundaries?simplified=${simplified ? 'true' : 'false'}`))
  const { url } = await resp.json()
  const geo = await fetch(url).then(r => r.json())
  vegMapRef.value!.data.addGeoJson(geo)
  vegMapRef.value!.data.setStyle(vegStyleFeature)
}

function styleFeature(feature: any) {
  const cat: string = String(feature.getProperty('HEAT_CATEGORY') || '').toLowerCase().replace(/\s+/g, '_')
  const color = categoriesMap?.[cat]?.color || '#9ca3af'
  return {
    fillColor: color,
    fillOpacity: 0.7,
    strokeWeight: 1,
    strokeColor: '#ffffff',
  }
}

async function loadBoundaries(simplified: boolean) {
  if (!gmapRef.value) return
  gmapRef.value!.data.forEach((f: any) => gmapRef.value!.data.remove(f))
  const resp = await fetch(uhiUrl(`/api/v1/uhi/boundaries?simplified=${simplified ? 'true' : 'false'}`))
  const { url } = await resp.json()
  const geo = await fetch(url).then(r => r.json())
  gmapRef.value!.data.addGeoJson(geo)
  gmapRef.value!.data.setStyle(styleFeature)

  const infowindow = new (window as any).google.maps.InfoWindow()
  gmapRef.value!.data.addListener('mouseover', (e: any) => {
    const name = e.feature.getProperty('SUBURB_NAME') || ''
    const avg = e.feature.getProperty('AVG_HEAT')
    const cat = e.feature.getProperty('HEAT_CATEGORY')
    infowindow.setContent(`<div style="font-weight:600">${name}</div><div>Heat: ${avg?.toFixed ? avg.toFixed(1) : avg}°C (${cat})</div>`)
    infowindow.setPosition(e.latLng)
    infowindow.open(gmapRef.value)
  })
  gmapRef.value!.data.addListener('mouseout', () => {
    infowindow.close()
  })
}

function buildLegend(categories: Record<string, any>) {
  let entries = Object.entries(categories)
  if (!entries.length) return
  // sort by min descending so hottest在上方
  entries = entries.sort((a: any, b: any) => {
    const am = typeof a[1]?.min === 'number' ? a[1].min : -Infinity
    const bm = typeof b[1]?.min === 'number' ? b[1].min : -Infinity
    return bm - am
  })
  const html = [
    '<div class="legend-title">Heat Intensity</div>',
    ...entries.map((entry) => {
      const v = entry[1] as any
      const lo = typeof v.min === 'number' ? v.min : undefined
      const hi = typeof v.max === 'number' ? v.max : undefined
      let range = ''
      const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1))
      if (lo != null && hi != null && hi < 900) range = ` (${fmt(lo)}–${fmt(hi)}°C)`
      else if (lo != null && (hi == null || hi >= 900)) range = ` (≥${fmt(lo)}°C)`
      else if (hi != null && (lo == null)) range = ` (≤${fmt(hi)}°C)`
      return `
      <div class="legend-row">
        <span class="legend-label">${v.label}${range}</span>
        <span class="legend-color" style="background:${v.color}"></span>
      </div>
    `
    }),
  ].join('')
  legendHtml.value = html
}

onMounted(async () => {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAsxXNmYoU4g2C8QmY5BkDIHCNK-ihR5js'
  try {
    await loadGoogleMaps(apiKey)
    const center = { lat: -37.8136, lng: 144.9631 }
    gmapRef.value = new (window as any).google.maps.Map(document.getElementById('gmap'), {
      center,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    vegMapRef.value = new (window as any).google.maps.Map(document.getElementById('vegmap'), {
      center,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    await initUhiOnMap()
    await initVegetationMap()
  } catch {
    // fail silent to avoid breaking dashboard
  }
})
</script>

<style scoped>
.dashboard {
  min-height: calc(100vh - 64px);
  background: transparent;
  padding: 2rem 0;
}

.page-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  filter: brightness(0.9);
  pointer-events: none;
}

.page-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2rem;
}

.content-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.map-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.map-panel { position: relative; }

.map-card-header {
  font-weight: 700;
  color: #065f46;
  margin-bottom: 0.75rem;
}

.map {
  width: 100%;
  height: 640px;
  border-radius: 12px;
  overflow: hidden;
}

.uhi-legend {
  position: absolute;
  left: 24px;
  bottom: 24px;
  background: #ffffff;
  padding: 10px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  font-size: 12px;
}
.legend-title { font-weight: 700; margin-bottom: 6px; color: #065f46; }
.legend-row { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
.legend-color { width: 18px; height: 18px; display: inline-block; border-radius: 3px; border: 1px solid rgba(0,0,0,0.25); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4); }
.legend-label { color: #374151; }

.placeholder-text {
  color: #6b7280;
  font-size: 1rem;
}
</style>
