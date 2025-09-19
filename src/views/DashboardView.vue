<template>
  <div class="dashboard">
    <video class="page-bg" src="/Guide%20background.mp4" autoplay muted playsinline></video>
    <div class="page-container">
      <div class="hero-header">
        <h1 class="hero-title">Urban Heat Island Dashboard</h1>
        <p class="hero-subtitle">Explore Melbourne's heat intensity and vegetation coverage</p>
      </div>
      <div class="content-card">
        <div class="map-toolbar">
          <input
            ref="searchInputRef"
            type="text"
            class="map-search-input"
            placeholder="Search address or place to center map..."
            aria-label="Search location"
          />
        </div>
        <div class="layout-grid">
          <div class="layout-left">
            <div class="map-panel">
              <div class="map-card-header">{{ activeLayer === 'heat' ? 'Heat Intensity' : 'Vegetation Coverage' }}</div>
              <div id="gmap" class="map" v-show="activeLayer === 'heat'"></div>
              <div id="vegmap" class="map" v-show="activeLayer === 'veg'"></div>
              <div id="uhi-legend" class="uhi-legend" v-show="activeLayer === 'heat' && legendHtml" v-html="legendHtml"></div>
              <div id="veg-legend" class="uhi-legend" v-show="activeLayer === 'veg' && vegLegendHtml" v-html="vegLegendHtml"></div>
            </div>
          </div>
          <aside class="layout-right">
            <div class="filter-card">
              <div class="filter-title">Layer</div>
              <select class="select-input" v-model="activeLayer" aria-label="Select layer">
                <option value="heat">Heat</option>
                <option value="veg">Vegetation</option>
              </select>
              <div class="hint-text">Pick a layer to view on the map.</div>
            </div>
            <div class="history-section">
              <div class="filter-title">Recent Searches</div>
              <div v-if="!searchHistory.length" class="hint-text">No recent searches.</div>
              <div v-else class="history-cards">
                <div
                  v-for="item in searchHistory"
                  :key="item.label"
                  class="filter-card history-card"
                >
                  <div class="history-card-header">
                    <div class="history-card-title">{{ item.label }}</div>
                    <button class="history-remove" @click="removeHistory(item)" aria-label="remove">&times;</button>
                  </div>
                  <div class="history-card-actions">
                    <span class="layer-badge" :class="item.layer">{{ item.layer === 'heat' ? 'Heat' : 'Vegetation' }}</span>
                    <button class="history-go" @click="centerTo(item)">Center on map</button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <!-- Charts Card (same width as map content card) -->
      <div class="content-card charts-card">
        <div class="charts-section">
          <div class="chart-card">
            <div class="chart-title">Heat categories</div>
            <div class="chart-rows">
              <div class="chart-row" v-for="row in heatChartRows" :key="row.key">
                <div class="chart-label">{{ row.label }}</div>
                <div class="chart-bar">
                  <div class="chart-bar-fill" :style="{ width: row.percent + '%', background: row.color }"></div>
                </div>
                <div class="chart-value">{{ row.count }}</div>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-title">Vegetation (%)</div>
            <div class="chart-rows">
              <div class="chart-row" v-for="row in vegChartRows" :key="row.bucket">
                <div class="chart-label">{{ row.bucket }}</div>
                <div class="chart-bar">
                  <div class="chart-bar-fill" :style="{ width: row.percent + '%', background: row.color }"></div>
                </div>
                <div class="chart-value">{{ row.count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { onMounted, ref, watch, nextTick } from 'vue'
import { ensureGoogleMapsLoaded } from '@/services/gmapsLoader'

const loadGoogleMaps = ensureGoogleMapsLoaded

const gmapRef = ref<any>(null)
const vegMapRef = ref<any>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const legendHtml = ref('')
const vegLegendHtml = ref('')
let lastSimplified = true
let categoriesMap: Record<string, { color: string; label: string }> = {}
const activeLayer = ref<'heat' | 'veg'>('heat')
const searchHistory = ref<Array<{ label: string; center: { lat: number; lng: number }; layer: 'heat' | 'veg' }>>([])
// Map suburb identifiers to vegetation total (%) sourced from /data endpoint
let vegTotalsMap: Record<string, number> = {}
// Chart state
const heatChartRows = ref<Array<{ key: string; label: string; color: string; count: number; percent: number }>>([])
const vegChartRows = ref<Array<{ bucket: string; color: string; count: number; percent: number }>>([])

function normKey(v: unknown): string {
  return String(v ?? '').toLowerCase().trim().replace(/\s+/g, '_')
}

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
    // Build legend first
    vegLegendHtml.value = '<div class="legend-title">Vegetation (%)</div>' +
      ['0-10','10-20','20-30','30-40','40+'].map((b, i) => `
        <div class="legend-row" style="display:flex; align-items:center; gap:12px;">
          <span class="legend-label">${b}</span>
          <span style="background:${['#fef3c7','#fde68a','#86efac','#34d399','#059669'][i]}; width:18px; height:18px; display:inline-block; border-radius:3px; border:1px solid rgba(0,0,0,0.25); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4); margin-left:auto;"></span>
        </div>
      `).join('')

    // Load vegetation totals from /data once
    if (!Object.keys(vegTotalsMap).length) {
      try {
        const dataResp = await fetch(uhiUrl('/api/v1/uhi/data'))
        if (dataResp.ok) {
          const data = await dataResp.json()
          const suburbs: Array<any> = Array.isArray(data?.suburbs) ? data.suburbs : []
          vegTotalsMap = {}
          suburbs.forEach((s) => {
            const total = Number(s?.vegetation?.total)
            if (Number.isFinite(total)) {
              if (s?.id) vegTotalsMap[normKey(s.id)] = total
              if (s?.name) vegTotalsMap[normKey(s.name)] = total
            }
          })
        }
      } catch {
        // ignore network errors; map stays empty which yields default colors
      }
    }
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
  // Prefer mapped totals from /data; match by id or name
  const sid = feature.getProperty('SUBURB_ID') || feature.getProperty('id')
  const sname = feature.getProperty('SUBURB_NAME') || feature.getProperty('name')
  const keyId = normKey(sid)
  const keyName = normKey(sname)
  const pct = (vegTotalsMap[keyId] ?? vegTotalsMap[keyName] ?? 0) as number
  const color = pct >= 40 ? '#059669' : pct >= 30 ? '#34d399' : pct >= 20 ? '#86efac' : pct >= 10 ? '#fde68a' : '#fef3c7'
  return {
    fillColor: color,
    fillOpacity: 0.35,
    strokeWeight: 0.8,
    strokeOpacity: 0.7,
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
  // sort by min descending so hottest on top
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
      if (lo != null && hi != null && hi < 900) range = ` (${fmt(lo)}&ndash;${fmt(hi)}°C)`
      else if (lo != null && (hi == null || hi >= 900)) range = ` (&ge;${fmt(lo)}°C)`
      else if (hi != null && (lo == null)) range = ` (&le;${fmt(hi)}°C)`
      return `
      <div class="legend-row" style="display:flex; align-items:center; gap:12px;">
        <span class="legend-label">${v.label}${range}</span>
        <span style="background:${v.color}; width:18px; height:18px; display:inline-block; border-radius:3px; border:1px solid rgba(0,0,0,0.25); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4); margin-left:auto;"></span>
      </div>
    `
    }),
  ].join('')
  legendHtml.value = html
}

onMounted(async () => {
  try {
    await loadGoogleMaps()
    const center = { lat: -37.8136, lng: 144.9631 }
    gmapRef.value = new (window as any).google.maps.Map(document.getElementById('gmap') as HTMLElement, {
      center,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    // Create veg map if its container exists (we render both containers; veg may be hidden)
    const vegEl = document.getElementById('vegmap')
    if (vegEl && !vegMapRef.value) {
      vegMapRef.value = new (window as any).google.maps.Map(vegEl as HTMLElement, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
    }
    await initUhiOnMap()
    if (vegMapRef.value) await initVegetationMap()

    // Setup Google Places Autocomplete on search input
    if (searchInputRef.value) {
      const autocomplete = new (window as any).google.maps.places.Autocomplete(searchInputRef.value as HTMLInputElement, {
        fields: ['geometry', 'name', 'formatted_address'],
        types: ['geocode']
      })
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        const loc = place?.geometry?.location
        if (loc) {
          const center = { lat: loc.lat(), lng: loc.lng() }
          if (gmapRef.value) { gmapRef.value.setCenter(center); gmapRef.value.setZoom(13) }
          if (vegMapRef.value) { vegMapRef.value.setCenter(center); vegMapRef.value.setZoom(13) }
          // Prefer short name without state prefix; fall back to name or coords
          let label = place.name || place.formatted_address || `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`
          if (place.formatted_address) {
            const parts = String(place.formatted_address).split(',').map(s => s.trim())
            // Remove leading country/state like 'Australia' or 'Victoria'
            if (parts.length > 1) {
              const lastTwo = parts.slice(0, -2).join(', ')
              label = lastTwo || (place.name || parts[0])
            }
          }
          addHistory({ label, center, layer: activeLayer.value })
        }
      })
    }

    // Load chart data once
    await buildCharts()
  } catch {
    // fail silent to avoid breaking dashboard
  }
})

// Ensure vegetation map is created when user switches to it and keep instances in sync
watch(activeLayer, async (layer) => {
  if (layer === 'veg' && !vegMapRef.value) {
    await nextTick()
    const el = document.getElementById('vegmap') as HTMLElement | null
    if (!el || !(window as any).google?.maps) return
    const currentCenter = gmapRef.value?.getCenter?.()
    const center = currentCenter ? { lat: currentCenter.lat(), lng: currentCenter.lng() } : { lat: -37.8136, lng: 144.9631 }
    const zoom = gmapRef.value?.getZoom?.() || 13
    vegMapRef.value = new (window as any).google.maps.Map(el, {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    await initVegetationMap()
  } else if (layer === 'heat' && gmapRef.value && vegMapRef.value) {
    // When switching back, sync center/zoom from vegetation map if available
    const vc = vegMapRef.value.getCenter?.()
    if (vc) {
      gmapRef.value.setCenter({ lat: vc.lat(), lng: vc.lng() })
    }
    const vz = vegMapRef.value.getZoom?.()
    if (vz) {
      gmapRef.value.setZoom(vz)
    }
  }
})

function addHistory(item: { label: string; center: { lat: number; lng: number }; layer: 'heat' | 'veg' }) {
  const exists = searchHistory.value.find(h => h.label === item.label)
  if (!exists) {
    searchHistory.value.unshift(item)
    if (searchHistory.value.length > 8) searchHistory.value.pop()
  }
}

function centerTo(item: { label: string; center: { lat: number; lng: number }; layer?: 'heat' | 'veg' }) {
  const { center } = item
  if (item.layer) activeLayer.value = item.layer
  if (gmapRef.value) { gmapRef.value.setCenter(center) }
  if (vegMapRef.value) { vegMapRef.value.setCenter(center) }
}

function removeHistory(item: { label: string }) {
  searchHistory.value = searchHistory.value.filter(h => h.label !== item.label)
}

// keep for potential future UI; remove if unused elsewhere

async function buildCharts() {
  try {
    // Use the same /data payload already fetched above where possible
    const resp = await fetch(uhiUrl('/api/v1/uhi/data'))
    if (!resp.ok) return
    const payload = await resp.json()
    const suburbs: Array<any> = Array.isArray(payload?.suburbs) ? payload.suburbs : []

    // Heat categories count using metadata colors
    const metaCats = payload?.heat_categories || categoriesMap || {}
    const counts: Record<string, { label: string; color: string; count: number }> = {}
    Object.entries(metaCats).forEach(([k, v]: any) => {
      counts[k] = { label: v?.label || k, color: v?.color || '#9ca3af', count: 0 }
    })
    suburbs.forEach((s: any) => {
      const catKey = String(s?.heat?.category || '').toLowerCase().replace(/\s+/g, '_')
      if (counts[catKey]) counts[catKey].count += 1
    })
    const total = suburbs.length || 1
    heatChartRows.value = Object.entries(counts).map(([key, v]) => ({
      key,
      label: v.label,
      color: v.color,
      count: v.count,
      percent: Math.round((v.count / total) * 100)
    })).sort((a, b) => b.percent - a.percent)

    // Vegetation buckets (0-10,10-20,20-30,30-40,40+)
    const buckets = [
      { name: '0-10', min: 0, max: 10, color: '#fef3c7' },
      { name: '10-20', min: 10, max: 20, color: '#fde68a' },
      { name: '20-30', min: 20, max: 30, color: '#86efac' },
      { name: '30-40', min: 30, max: 40, color: '#34d399' },
      { name: '40+', min: 40, max: 1000, color: '#059669' },
    ]
    const vegCounts: Record<string, number> = {}
    buckets.forEach(b => { vegCounts[b.name] = 0 })
    suburbs.forEach((s: any) => {
      const pct = Number(s?.vegetation?.total)
      if (!Number.isFinite(pct)) return
      const b = buckets.find(b => pct >= b.min && pct < b.max)
      if (b) vegCounts[b.name] += 1
    })
    vegChartRows.value = buckets.map(b => ({
      bucket: b.name,
      color: b.color,
      count: vegCounts[b.name] || 0,
      percent: Math.round(((vegCounts[b.name] || 0) / total) * 100)
    }))
  } catch {
    // ignore chart errors
  }
}
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

.hero-header { text-align: center; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-bottom: 1rem; }
.hero-title { font-size: 3rem; font-weight: 800; margin-bottom: 0.5rem; }
.hero-subtitle { font-size: 1.2rem; opacity: 0.9; margin: 0; }

.content-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.map-toolbar { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; }
.map-search-input {
  width: 100%;
  max-width: 100%;
  flex: 1 1 auto;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.map-search-input:focus { border-color: #065f46; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }

.layout-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1rem; align-items: start; }
.layout-left { min-width: 0; }
.layout-right { position: sticky; top: 12px; min-width: 0; align-self: start; }
.filter-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; width: 100%; box-sizing: border-box; }
.filter-title { font-weight: 700; color: #065f46; margin-bottom: 8px; }
.select-input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; background: #fff; }
.select-input:focus { border-color: #065f46; box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
.history-section { margin-top: 1rem; }
.history-cards { display: grid; grid-template-rows: repeat(4, auto); gap: 0.75rem; max-height: 384px; overflow-y: auto; padding-right: 4px; width: 100%; }
.history-card { padding: 12px; width: 100%; max-width: 100%; margin: 0; box-sizing: border-box; }
.history-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.history-card-title { font-weight: 600; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-card-actions { margin-top: 8px; display: flex; justify-content: space-between; align-items: center; }
.layer-badge { font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid #d1d5db; color: #374151; background: #ffffff; }
.layer-badge.heat { border-color: #fca5a5; color: #7f1d1d; background: #fff1f2; }
.layer-badge.veg { border-color: #86efac; color: #065f46; background: #ecfdf5; }
.history-go { background: #065f46; color: white; border: none; border-radius: 6px; padding: 6px 10px; font-size: 12px; cursor: pointer; }
.history-go:hover { background: #047857; }
.history-remove { background: transparent; border: none; color: #9ca3af; cursor: pointer; font-size: 18px; line-height: 1; }
.history-remove:hover { color: #6b7280; }
.history-actions { margin-top: 8px; text-align: right; }
.history-clear { background: transparent; border: none; color: #065f46; cursor: pointer; font-size: 12px; }
.hint-text { color: #6b7280; font-size: 12px; margin-top: 8px; }
.map-panel { position: relative; }

.map-card-header { position: absolute; top: 12px; left: 12px; font-weight: 700; color: #065f46; background: #ffffff; padding: 6px 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }

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
  width: max-content;
}
.legend-title { font-weight: 700; margin-bottom: 6px; color: #065f46; }
.legend-row { display: grid; grid-template-columns: 1fr auto; align-items: center; column-gap: 12px; margin: 6px 0; }
.legend-color { width: 18px; height: 18px; display: inline-block; border-radius: 3px; border: 1px solid rgba(0,0,0,0.25); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4); }
.legend-label { color: #374151; flex: 1 1 auto; }

/* Charts */
.charts-card { margin-top: 1.5rem; }
.charts-section { margin-top: 0.25rem; display: grid; grid-template-columns: 1fr; gap: 1rem; }
.chart-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
.chart-title { font-weight: 700; color: #065f46; margin-bottom: 8px; }
.chart-rows { display: grid; gap: 6px; }
.chart-row { display: grid; grid-template-columns: 120px 1fr 48px; align-items: center; gap: 8px; }
.chart-label { color: #374151; font-size: 12px; }
.chart-bar { height: 10px; background: #eef2f7; border-radius: 8px; overflow: hidden; }
.chart-bar-fill { height: 100%; border-radius: 8px; }
.chart-value { text-align: right; font-size: 12px; color: #374151; }

.placeholder-text {
  color: #6b7280;
  font-size: 1rem;
}

/* Hide Google Maps InfoWindow close (X) button inside this component */
:deep(.gm-ui-hover-effect) { display: none !important; }
</style>
