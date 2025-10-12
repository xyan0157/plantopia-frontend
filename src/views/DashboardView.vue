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
          <div v-if="errorMsg" class="inline-error">{{ errorMsg }}</div>
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
                  :key="item.id"
                  class="filter-card history-card"
                >
                  <div class="history-card-header">
                    <div class="history-card-title">{{ item.label }}</div>
                    <button class="history-remove" @click="removeHistory(item)" aria-label="remove">&times;</button>
                  </div>
                  <div class="history-card-actions">
                    <span class="layer-badge" :class="item.layer">{{ item.layer === 'heat' ? (item.heatCategory || 'Heat') : 'Vegetation' }}</span>
                    <template v-if="item.layer==='heat'">
                      <div class="value-group">
                        <span class="value-badge heat">{{ item.heat != null ? formatHeat(item.heat) : 'N/A' }}</span>
                        <span v-if="item.rank != null" class="rank-badge heat">rank: {{ item.rank }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <div class="value-group">
                        <span class="value-badge veg">{{ item.veg != null ? formatVeg(item.veg) : 'N/A' }}</span>
                        <span v-if="item.rank != null" class="rank-badge veg">rank: {{ item.rank }}</span>
                      </div>
                    </template>
                    <button class="history-go" @click="centerTo(item)" aria-label="Center on map">
                      <MapPinIcon />
                    </button>
                  </div>
                <!-- Removed one-line summary between tags and image per request; trend helper kept for later use -->
                <div class="history-report" v-if="getDetailForItem(item)">
                  <div class="report-content" style="grid-column: 1 / -1;">
                    <div class="report-title">Local summary</div>
                    <ul class="kpi-list">
                      <li class="kpi" v-if="getDetailForItem(item)?.heatAvg != null">
                        <span class="kpi-label">Heat</span>
                        <span class="kpi-value">{{ Number(getDetailForItem(item)?.heatAvg).toFixed(1) }}°C ({{ getDetailForItem(item)?.heatCategory || 'N/A' }})</span>
                      </li>
                      <li class="kpi" v-if="getDetailForItem(item)?.vegTotal != null">
                        <span class="kpi-label">Vegetation</span>
                        <span class="kpi-value">{{ Number(getDetailForItem(item)?.vegTotal).toFixed(1) }}%</span>
                      </li>
                      <li class="kpi" v-if="getDetailForItem(item)?.trees != null">
                        <span class="kpi-label">Trees</span>
                        <span class="kpi-value">{{ Number(getDetailForItem(item)?.trees).toFixed(1) }}%</span>
                      </li>
                      <li class="kpi" v-if="getDetailForItem(item)?.shrubs != null">
                        <span class="kpi-label">Shrubs</span>
                        <span class="kpi-value">{{ Number(getDetailForItem(item)?.shrubs).toFixed(1) }}%</span>
                      </li>
                      <li class="kpi" v-if="getDetailForItem(item)?.grass != null">
                        <span class="kpi-label">Grass</span>
                        <span class="kpi-value">{{ Number(getDetailForItem(item)?.grass).toFixed(1) }}%</span>
                      </li>
                      <template v-if="getDetailForItem(item)?.heights">
                        <li class="kpi" v-if="getDetailForItem(item)?.heights?.large_15m_plus != null">
                          <span class="kpi-label">Large trees >=15m</span>
                          <span class="kpi-value">{{ Number(getDetailForItem(item)?.heights?.large_15m_plus).toFixed(1) }}%</span>
                        </li>
                        <li class="kpi" v-if="getDetailForItem(item)?.heights?.medium_10_15m != null">
                          <span class="kpi-label">Medium 10-15m</span>
                          <span class="kpi-value">{{ Number(getDetailForItem(item)?.heights?.medium_10_15m).toFixed(1) }}%</span>
                        </li>
                        <li class="kpi" v-if="getDetailForItem(item)?.heights?.small_3_10m != null">
                          <span class="kpi-label">Small 3-10m</span>
                          <span class="kpi-value">{{ Number(getDetailForItem(item)?.heights?.small_3_10m).toFixed(1) }}%</span>
                        </li>
                      </template>
                    </ul>
                  </div>
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
          <!-- Doughnut: heat categories -->
          <div class="charts-row-2">
            <div class="chart-card">
              <div class="chart-title">Heat categories (doughnut)</div>
              <div class="chart-split">
                <div class="chart-pane">
                  <canvas id="heat-donut" class="chart-canvas"></canvas>
                </div>
                <div class="chart-desc">
                  <div class="desc-title">Summary</div>
                  <p class="desc-text">{{ heatDonutText }}</p>
                  <ul class="desc-list">
                    <li v-for="it in heatDonutTopList" :key="it.label">{{ it.label }}: {{ it.percent }}%</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="chart-card">
              <div class="chart-title">Vegetation (%) (doughnut)</div>
              <div class="chart-split">
                <div class="chart-pane">
                  <canvas id="veg-donut" class="chart-canvas"></canvas>
                </div>
                <div class="chart-desc">
                  <div class="desc-title">Summary</div>
                  <p class="desc-text">{{ vegDonutText }}</p>
                  <ul class="desc-list">
                    <li v-for="it in vegDonutTopList" :key="it.bucket">{{ it.bucket }}: {{ it.percent }}%</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          

          <!-- Scatter: heat vs vegetation -->
          <div class="chart-card">
            <div class="chart-title">Heat vs Vegetation (scatter)</div>
            <div class="chart-split">
              <div class="chart-pane">
                <canvas id="heat-veg-scatter" class="chart-canvas"></canvas>
              </div>
              <div class="chart-desc">
                <div class="desc-title">Summary</div>
                <p class="desc-text">{{ scatterText }}</p>
              </div>
            </div>
          </div>

          <!-- Additional charts -->
          <div class="chart-card">
            <div class="chart-title">Heat bins (°C)</div>
            <div class="chart-split">
              <div class="chart-pane">
                <div class="chart-rows">
                  <div class="chart-row" v-for="row in heatBinRows" :key="row.bucket">
                    <div class="chart-label">{{ row.bucket }}</div>
                    <div class="chart-bar">
                      <div class="chart-bar-fill" :style="{ width: row.percent + '%', background: row.color }"></div>
                    </div>
                    <div class="chart-value">{{ row.count }}</div>
                  </div>
                </div>
              </div>
              <div class="chart-desc">
                <div class="desc-title">Summary</div>
                <p class="desc-text">{{ heatBinsText }}</p>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-title">Top 5 hottest suburbs</div>
            <div class="chart-split">
              <div class="chart-pane">
                <div class="chart-rows">
                  <div class="chart-row" v-for="row in topHotRows" :key="row.name">
                    <div class="chart-label">{{ row.name }}</div>
                    <div class="chart-bar">
                      <div class="chart-bar-fill" :style="{ width: row.percent + '%', background: '#ef4444' }"></div>
                    </div>
                    <div class="chart-value">{{ row.heat.toFixed(1) }}°C</div>
                  </div>
                </div>
              </div>
              <div class="chart-desc">
                <div class="desc-title">Summary</div>
                <p class="desc-text">{{ topHotText }}</p>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-title">Top 5 greenest suburbs</div>
            <div class="chart-split">
              <div class="chart-pane">
                <div class="chart-rows">
                  <div class="chart-row" v-for="row in topGreenRows" :key="row.name">
                    <div class="chart-label">{{ row.name }}</div>
                    <div class="chart-bar">
                      <div class="chart-bar-fill" :style="{ width: row.percent + '%', background: '#10b981' }"></div>
                    </div>
                    <div class="chart-value">{{ row.veg.toFixed(1) }}%</div>
                  </div>
                </div>
              </div>
              <div class="chart-desc">
                <div class="desc-title">Summary</div>
                <p class="desc-text">{{ topGreenText }}</p>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-title">Heat vs Vegetation correlation</div>
            <div class="chart-split">
              <div class="chart-pane">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div class="chart-bar" style="flex:1; height: 8px;">
                    <div class="chart-bar-fill" :style="{ width: Math.round((correlationR + 1) * 50) + '%', background: correlationR > 0 ? '#ef4444' : '#10b981' }"></div>
                  </div>
                  <div class="chart-value" :title="'Pearson r'">r={{ correlationR.toFixed(2) }}</div>
                </div>
              </div>
              <div class="chart-desc">
                <div class="desc-title">Summary</div>
                <p class="desc-text">{{ corrText }}</p>
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
import { onMounted, ref, watch, nextTick, computed } from 'vue'
import Chart from 'chart.js/auto'
import { ensureGoogleMapsLoaded } from '@/services/gmapsLoader'
import { getUhiMetadata, getUhiData, getBoundaryGeo } from '@/services/uhiPreload'
import { MapPinIcon } from '@heroicons/vue/24/solid'

const loadGoogleMaps = ensureGoogleMapsLoaded

const gmapRef = ref<any>(null)
const vegMapRef = ref<any>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const legendHtml = ref('')
const vegLegendHtml = ref('')
const errorMsg = ref('')
let lastSimplified = true
let categoriesMap: Record<string, { color: string; label: string }> = {}
const activeLayer = ref<'heat' | 'veg'>('heat')
// Reusable marker to indicate the precise centered location
const centerMarkerRef = ref<any>(null)
const searchHistory = ref<Array<{ id: string; label: string; center: { lat: number; lng: number }; layer: 'heat' | 'veg'; key?: string; heat?: number; veg?: number; heatCategory?: string; rank?: number }>>([])
const HISTORY_STORAGE_KEY = 'uhi_recent_searches_v1'
// Standardized out-of-coverage message in English only
const OUT_OF_COVERAGE_MSG = 'Please enter a suburb within the Melbourne region.'
// Map suburb identifiers to vegetation total (%) sourced from /data endpoint
let vegTotalsMap: Record<string, number> = {}
let heatAvgMap: Record<string, number> = {}
let heatCategoryMap: Record<string, string> = {}
const heatRankMap: Record<string, number> = {}
const vegRankMap: Record<string, number> = {}
// Built from the currently loaded heat boundaries on the map
let heatAvgByName: Record<string, number> = {}
let heatCatByName: Record<string, string> = {}
let heatAvgByNameNorm: Record<string, number> = {}
let heatCatByNameNorm: Record<string, string> = {}
let uhiByName: Record<string, any> = {}
// Chart state
const heatChartRows = ref<Array<{ key: string; label: string; color: string; count: number; percent: number }>>([])
const vegChartRows = ref<Array<{ bucket: string; color: string; count: number; percent: number }>>([])
// Extra charts
const heatBinRows = ref<Array<{ bucket: string; color: string; count: number; percent: number }>>([])
const topHotRows = ref<Array<{ name: string; heat: number; percent: number }>>([])
const topGreenRows = ref<Array<{ name: string; veg: number; percent: number }>>([])
const correlationR = ref<number>(0)
const scatterPairs = ref<Array<{ x: number; y: number; color: string }>>([])

// Descriptive texts for charts (computed)
const heatDonutText = computed(() => {
  if (!heatChartRows.value.length) return 'No data available.'
  const top = [...heatChartRows.value].sort((a, b) => b.percent - a.percent)[0]
  return top ? `Most suburbs fall into ${top.label} category.` : 'No data available.'
})
const heatDonutTopList = computed(() => {
  const top3 = [...heatChartRows.value].sort((a, b) => b.percent - a.percent).slice(0, 3)
  return top3.map(r => ({ label: r.label, percent: r.percent }))
})

const vegDonutText = computed(() => {
  if (!vegChartRows.value.length) return 'No data available.'
  const top = [...vegChartRows.value].sort((a, b) => b.percent - a.percent)[0]
  return top ? `Vegetation coverage most commonly lies in ${top.bucket}.` : 'No data available.'
})
const vegDonutTopList = computed(() => {
  const top3 = [...vegChartRows.value].sort((a, b) => b.percent - a.percent).slice(0, 3)
  return top3.map(r => ({ bucket: r.bucket, percent: r.percent }))
})

const scatterText = computed(() => {
  const n = scatterPairs.value.length
  if (!n) return 'No data available.'
  return `Scatter shows ${n} suburbs. Trend aligns with correlation value below.`
})

const heatBinsText = computed(() => {
  if (!heatBinRows.value.length) return 'No data available.'
  const top = [...heatBinRows.value].sort((a, b) => b.percent - a.percent)[0]
  return top ? `Most suburbs are in ${top.bucket} bin by count.` : 'No data available.'
})

const topHotText = computed(() => {
  if (!topHotRows.value.length) return 'No data available.'
  const first = topHotRows.value[0]
  return `Hottest suburb: ${first.name} (${first.heat.toFixed(1)}°C).`
})

const topGreenText = computed(() => {
  if (!topGreenRows.value.length) return 'No data available.'
  const first = topGreenRows.value[0]
  return `Greenest suburb: ${first.name} (${first.veg.toFixed(1)}%).`
})

const corrText = computed(() => {
  const r = Number(correlationR.value)
  if (!Number.isFinite(r)) return 'No data available.'
  const dir = r > 0 ? 'positive' : r < 0 ? 'negative' : 'no'
  return `Pearson r indicates ${dir} correlation (${r.toFixed(2)}).`
})

// Persist/restore history so it survives page reloads
function loadHistoryFromStorage() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return
    // Basic schema validation and clamp size
    const cleaned = parsed
      .filter((it: any) => it && typeof it.label === 'string' && it.center && typeof it.center.lat === 'number' && typeof it.center.lng === 'number')
      .map((it: any) => ({
        id: String(it.id || cryptoRandom()),
        label: String(it.label),
        center: { lat: Number(it.center.lat), lng: Number(it.center.lng) },
        layer: (it.layer === 'veg' ? 'veg' : 'heat') as 'heat' | 'veg',
        key: String(it.key || (String(it.label).toLowerCase().replace(/\s+/g, '_'))),
        heat: typeof it.heat === 'number' ? (it.heat as number) : undefined,
        veg: typeof it.veg === 'number' ? (it.veg as number) : undefined,
        heatCategory: typeof it.heatCategory === 'string' ? (it.heatCategory as string) : undefined,
        rank: typeof it.rank === 'number' ? (it.rank as number) : undefined,
      }))
      .slice(0, 8)
    searchHistory.value = cleaned
  } catch {}
}

function saveHistoryToStorage() {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(searchHistory.value))
  } catch {}
}

function cryptoRandom(): string {
  try {
    const arr = new Uint32Array(4)
    crypto.getRandomValues(arr)
    return Array.from(arr).map(n => n.toString(16)).join('')
  } catch {
    return String(Date.now() + Math.random())
  }
}

function normKey(v: unknown): string {
  return String(v ?? '').toLowerCase().trim().replace(/\s+/g, '_')
}

function uhiUrl(path: string) {
  const base = (import.meta as any).env?.VITE_API_URL || 'https://budgets-accepting-porcelain-austin.trycloudflare.com'
  return `${base}${path}`
}


// Prefer geocoding results that are in Victoria (VIC)
function isVicGeocodeResult(r: any): boolean {
  try {
    const comps = r?.address_components || []
    return comps.some((c: any) => {
      const types: string[] = c?.types || []
      if (!Array.isArray(types)) return false
      const isLvl1 = types.includes('administrative_area_level_1')
      const shortName = String(c?.short_name || '').toUpperCase()
      const longName = String(c?.long_name || '').toLowerCase()
      return isLvl1 && (shortName === 'VIC' || longName.includes('victoria'))
    })
  } catch {
    return false
  }
}

function formatVeg(n: unknown): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return 'N/A'
  return Number.isInteger(v) ? `${v}%` : `${v.toFixed(1)}%`
}

function formatHeat(n: unknown): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return 'N/A'
  return `${v.toFixed(1)} C`
}

// Create or update the centered marker on the currently visible map
function getCenterMarkerIcon(google: any) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="30" height="44" viewBox="0 0 30 44">
  <defs>
    <linearGradient id="pinWhite" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e5e7eb"/>
    </linearGradient>
    <radialGradient id="gloss" cx="30%" cy="28%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65"/>
      <stop offset="80%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="ds" x="-50%" y="-50%" width="200%" height="200%">
      <feOffset in="SourceAlpha" dy="1" result="o"/>
      <feGaussianBlur in="o" stdDeviation="1.2" result="b"/>
      <feColorMatrix in="b" type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 0.35 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- ground shadow -->
  <ellipse cx="15" cy="42" rx="7" ry="2.2" fill="#000000" opacity="0.22"/>
  <g filter="url(#ds)">
    <!-- pin body -->
    <path d="M15 2c-7.18 0-13 5.82-13 13 0 10.5 13 27 13 27s13-16.5 13-27c0-7.18-5.82-13-13-13z" fill="url(#pinWhite)" stroke="#065f46" stroke-width="1.5"/>
    <!-- glossy highlight -->
    <ellipse cx="11" cy="10" rx="7.5" ry="5" fill="url(#gloss)"/>
    <!-- inner hole -->
    <circle cx="15" cy="15" r="4" fill="#065f46"/>
  </g>
</svg>`
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(28, 41),
    anchor: new google.maps.Point(14, 40),
  }
}

function placeCenterMarker(center: { lat: number; lng: number }, layer?: 'heat' | 'veg') {
  const g = (window as any).google
  if (!g?.maps) return
  const map = (layer || activeLayer.value) === 'veg' ? vegMapRef.value : gmapRef.value
  if (!map) return
  if (!centerMarkerRef.value) {
    centerMarkerRef.value = new g.maps.Marker({
      position: center,
      map,
      clickable: false,
      zIndex: 9999,
      icon: getCenterMarkerIcon(g),
    })
  } else {
    centerMarkerRef.value.setIcon(getCenterMarkerIcon(g))
    centerMarkerRef.value.setMap(map)
    centerMarkerRef.value.setPosition(center)
  }
}

// Load UHI data (/data) once for both heat and vegetation stats
let uhiDataLoaded = false
async function loadUhiDataOnce() {
  if (uhiDataLoaded) return
  try {
    const resp = await fetch(uhiUrl('/api/v1/uhi/data'))
    if (!resp.ok) return
    const payload = await resp.json()
    const suburbs: Array<any> = Array.isArray(payload?.suburbs) ? payload.suburbs : []
    const metaCats = payload?.heat_categories || {}
    vegTotalsMap = {}
    heatAvgMap = {}
    heatCategoryMap = {}
    uhiByName = {}
    suburbs.forEach((s) => {
      if (s?.name) uhiByName[String(s.name)] = s
      const total = Number(s?.vegetation?.total)
      if (Number.isFinite(total)) {
        if (s?.id) vegTotalsMap[normKey(s.id)] = total
        if (s?.name) vegTotalsMap[normKey(s.name)] = total
      }
      const avgHeat = Number(s?.heat?.avg)
      if (Number.isFinite(avgHeat)) {
        if (s?.id) heatAvgMap[normKey(s.id)] = avgHeat
        if (s?.name) heatAvgMap[normKey(s.name)] = avgHeat
      }
      const heatRank = Number(s?.heat?.rank)
      if (Number.isFinite(heatRank)) {
        if (s?.id) heatRankMap[normKey(s.id)] = heatRank
        if (s?.name) heatRankMap[normKey(s.name)] = heatRank
      }
      const vegRank = Number(s?.vegetation?.rank)
      if (Number.isFinite(vegRank)) {
        if (s?.id) vegRankMap[normKey(s.id)] = vegRank
        if (s?.name) vegRankMap[normKey(s.name)] = vegRank
      }
      const catKey = String(s?.heat?.category || '').toLowerCase().replace(/\s+/g, '_')
      const label = metaCats?.[catKey]?.label || (catKey ? catKey : '')
      if (s?.id) heatCategoryMap[normKey(s.id)] = label
      if (s?.name) heatCategoryMap[normKey(s.name)] = label
    })
    uhiDataLoaded = true
  } catch {}
}

function refreshHistoryStats() {
  searchHistory.value = searchHistory.value.map((it) => {
    const r = uhiByName[it.label]
    const live = getHeatFromMapByLabel(it.label)
    // Prefer the already stored precise value if present; otherwise recompute.
    const computedHeat = live.avg ?? r?.heat?.avg ?? findMapValue(it.label, heatAvgMap)
    const heatVal = Number.isFinite(Number(it.heat)) ? Number(it.heat) : (Number.isFinite(Number(computedHeat)) ? Number(computedHeat) : undefined)
    const computedVeg = r?.vegetation?.total ?? findMapValue(it.label, vegTotalsMap)
    const vegVal = Number.isFinite(Number(it.veg)) ? Number(it.veg) : (Number.isFinite(Number(computedVeg)) ? Number(computedVeg) : undefined)
    const heatCatRaw = live.category || r?.heat?.category
    const heatCat = heatCatRaw ? (heatCategoryMap[normKey(heatCatRaw)] || heatCatRaw) : (findMapValue(it.label, heatCategoryMap) as string | undefined)
    const rankHeat = findMapValue(it.label, heatRankMap) as number | undefined
    const rankVeg = findMapValue(it.label, vegRankMap) as number | undefined
    const rank = it.layer === 'heat' ? (Number(rankHeat)) : (Number(rankVeg))
    return { ...it, heat: heatVal, veg: vegVal, heatCategory: heatCat, rank: Number.isFinite(rank) ? rank : it.rank }
  })
}

// Build a short, human-readable trend sentence for a suburb
// getTrendText removed; replaced with static snapshot thumbnail in history cards

// Helper to retrieve full metrics for a suburb card
function getDetailForItem(item: { label: string }): { heatAvg?: number; heatCategory?: string; vegTotal?: number; trees?: number; shrubs?: number; grass?: number; heights?: Record<string, number> } | null {
  const r = uhiByName[item.label]
  if (!r) return null
  const out: any = {}
  const heatAvg = Number(r?.heat?.avg ?? r?.heat?.intensity)
  if (Number.isFinite(heatAvg)) out.heatAvg = heatAvg
  if (r?.heat?.category) out.heatCategory = r.heat.category
  const vegTotal = Number(r?.vegetation?.total)
  if (Number.isFinite(vegTotal)) out.vegTotal = vegTotal
  const trees = Number(r?.vegetation?.trees)
  if (Number.isFinite(trees)) out.trees = trees
  const shrubs = Number(r?.vegetation?.shrubs)
  if (Number.isFinite(shrubs)) out.shrubs = shrubs
  const grass = Number(r?.vegetation?.grass)
  if (Number.isFinite(grass)) out.grass = grass
  if (r?.trees_by_height) out.heights = r.trees_by_height
  return out
}

// Try to resolve a suburb label to our stats maps using multiple variants
function findMapValue<T = number | string>(label: string, map: Record<string, T>): T | undefined {
  const raw = String(label || '')
  const candidates: string[] = []
  const lower = raw.toLowerCase().trim()
  const cleaned = lower
    .replace(/,.*$/, '')               // drop after first comma
    .replace(/\b(\d{3,4})\b/g, '')   // drop postcode numbers
    .replace(/\b(australia|victoria|vic|state of victoria)\b/g, '')
    .replace(/\(|\)/g, '')
    .replace(/\s+/g, ' ')             // collapse spaces
    .trim()
  const firstWord = cleaned.split(' ')[0] || cleaned
  const lastWord = cleaned.split(' ').slice(-1)[0] || cleaned

  const push = (s?: string) => { if (s) candidates.push(normKey(s)) }
  push(raw)
  push(cleaned)
  push(firstWord)
  push(lastWord)

  // 1) exact key match
  for (const k of candidates) {
    if (map[k] != null) return map[k]
  }
  // 2) include/startsWith match over existing keys
  const keys = Object.keys(map)
  for (const cand of candidates) {
    const exact = keys.find(k => k === cand)
    if (exact) return map[exact]
    const starts = keys.find(k => k.startsWith(cand))
    if (starts) return map[starts]
    const contains = keys.find(k => k.includes(cand))
    if (contains) return map[contains]
  }
  return undefined
}

// Prefer reading heat directly from the current map data layer
function getHeatFromMapByLabel(label: string): { avg?: number; category?: string } {
  try {
    const base = String(label || '')
      .toLowerCase()
      .replace(/,.*$/, '')
      .replace(/\b(\d{3,4})\b/g, '')
      .replace(/\b(australia|victoria|vic|state of victoria)\b/g, '')
      .replace(/\(|\)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    const target = normKey(base)
    // Fast lookup using normalized keys built during boundaries load
    for (const [nk, val] of Object.entries(heatAvgByNameNorm)) {
      if (nk === target || nk.startsWith(target) || target.startsWith(nk) || nk.includes(target)) {
        const originalName = Object.keys(heatAvgByName).find(k => normKey(k) === nk) || ''
        return { avg: val, category: heatCatByNameNorm[nk] || heatCatByName[originalName] }
      }
    }
    return {}
  } catch {
    return {}
  }
}

// Read heat directly from the polygon that contains the given point
function getHeatAtLatLng(lat: number, lng: number): { avg?: number; category?: string; name?: string } {
  try {
    if (!gmapRef.value || !(window as any).google?.maps?.geometry?.poly) return {}
    const google = (window as any).google
    const point = new google.maps.LatLng(lat, lng)
    let found: { avg?: number; category?: string; name?: string } | undefined
    gmapRef.value.data.forEach((f: any) => {
      if (found) return
      const geom = f.getGeometry && f.getGeometry()
      if (!geom) return

      // Recursively test MultiPolygon/Polygon
      const contains = (g: any): boolean => {
        const t = g.getType && g.getType()
        if (t === 'Polygon') {
          const rings = g.getArray()
          if (!rings || !rings.length) return false
          const outer = rings[0]
          const path = outer.getArray()
          const poly = new google.maps.Polygon({ paths: path })
          return google.maps.geometry.poly.containsLocation(point, poly)
        } else if (t === 'MultiPolygon') {
          const polys = g.getArray()
          for (const pg of polys) { if (contains(pg)) return true }
          return false
        }
        return false
      }

      if (contains(geom)) {
        const avg = Number(f.getProperty('AVG_HEAT'))
        const cat = String(f.getProperty('HEAT_CATEGORY') || '')
        const name = String(f.getProperty('SUBURB_NAME') || '')
        found = { avg: Number.isFinite(avg) ? avg : undefined, category: cat || undefined, name }
      }
    })
    return found || {}
  } catch {
    return {}
  }
}

async function initUhiOnMap() {
  try {
    // Prefer preloaded metadata
    const cachedMeta = getUhiMetadata()
    if (cachedMeta && (cachedMeta as any).heat_categories) {
      categoriesMap = (cachedMeta as any).heat_categories || {}
      buildLegend(categoriesMap)
    } else {
      const metaResp = await fetch(uhiUrl('/api/v1/uhi/metadata'))
      if (metaResp.ok) {
        const meta = await metaResp.json()
        categoriesMap = meta?.heat_categories || {}
        buildLegend(categoriesMap)
      }
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
  if (!vegMapRef.value) {
    console.error('Vegetation map not initialized')
    return
  }

  try {
    // Build legend once
    vegLegendHtml.value = '<div class="legend-title">Vegetation (%)</div>' +
      ['0-10','10-20','20-30','30-40','40+'].map((b, i) => `
        <div class="legend-row" style="display:flex; align-items:center; gap:12px;">
          <span class="legend-label">${b}</span>
          <span style="background:${['#fef3c7','#fde68a','#86efac','#34d399','#059669'][i]}; width:18px; height:18px; display:inline-block; border-radius:3px; border:1px solid rgba(0,0,0,0.25); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.4); margin-left:auto;"></span>
        </div>
      `).join('')

    // Load vegetation totals (prefer preloaded)
    if (!Object.keys(vegTotalsMap).length || !Object.keys(heatAvgMap).length) {
      const pre = getUhiData()
      if (pre && Array.isArray((pre as any).suburbs)) {
        const suburbs: Array<any> = (pre as any).suburbs
        vegTotalsMap = {}
        heatAvgMap = {}
        suburbs.forEach((s) => {
          const total = Number(s?.vegetation?.total)
          if (Number.isFinite(total)) {
            if (s?.id) vegTotalsMap[normKey(s.id)] = total
            if (s?.name) vegTotalsMap[normKey(s.name)] = total
          }
          const avgHeat = Number(s?.heat?.avg)
          if (Number.isFinite(avgHeat)) {
            if (s?.id) heatAvgMap[normKey(s.id)] = avgHeat
            if (s?.name) heatAvgMap[normKey(s.name)] = avgHeat
          }
        })
      } else {
        const dataResp = await fetch(uhiUrl('/api/v1/uhi/data'))
        if (dataResp.ok) {
          const data = await dataResp.json()
          const suburbs: Array<any> = Array.isArray(data?.suburbs) ? data.suburbs : []
          vegTotalsMap = {}
          heatAvgMap = {}
          suburbs.forEach((s) => {
            const total = Number(s?.vegetation?.total)
            if (Number.isFinite(total)) {
              if (s?.id) vegTotalsMap[normKey(s.id)] = total
              if (s?.name) vegTotalsMap[normKey(s.name)] = total
            }
            const avgHeat = Number(s?.heat?.avg)
            if (Number.isFinite(avgHeat)) {
              if (s?.id) heatAvgMap[normKey(s.id)] = avgHeat
              if (s?.name) heatAvgMap[normKey(s.name)] = avgHeat
            }
          })
        }
      }

      // Load the vegetation layer and attach zoom listener
      await loadVegetationLayer(true)
      if (!vegMapRef.value._zoomListenerAdded) {
        vegMapRef.value.addListener('zoom_changed', async () => {
          const z = vegMapRef.value!.getZoom()
          const wantSimplified = !(z >= 12)
          await loadVegetationLayer(wantSimplified)
        })
        vegMapRef.value._zoomListenerAdded = true
      }
    }
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
  
  // Clear existing data (no duplicates)
  if (vegMapRef.value.data) {
    const toRemove: any[] = []
    vegMapRef.value.data.forEach((f: any) => toRemove.push(f))
    toRemove.forEach((f: any) => vegMapRef.value.data.remove(f))
  }
  
  try {
    const pre = getBoundaryGeo(simplified)
    const geo = pre || (await (async () => {
      const resp = await fetch(uhiUrl(`/api/v1/uhi/boundaries?simplified=${simplified ? 'true' : 'false'}`))
      if (!resp.ok) {
        console.error('Failed to fetch boundaries:', resp.status)
        return {} as any
      }
      const { url } = await resp.json()
      return await fetch(url).then(r => r.json())
    })())
    
    // Add data to map
    vegMapRef.value.data.addGeoJson(geo)
    
    // Set style after data is loaded
    vegMapRef.value.data.setStyle(vegStyleFeature)
    
    console.log('Vegetation layer loaded successfully')
  } catch (error) {
    console.error('Error loading vegetation layer:', error)
  }
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
  const toRemove: any[] = []
  gmapRef.value!.data.forEach((f: any) => toRemove.push(f))
  toRemove.forEach((f: any) => gmapRef.value!.data.remove(f))
  const resp = await fetch(uhiUrl(`/api/v1/uhi/boundaries?simplified=${simplified ? 'true' : 'false'}`))
  const { url } = await resp.json()
  const pre = getBoundaryGeo(simplified)
  const geo = pre || (await fetch(url).then(r => r.json()))
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

  // Also sync our quick lookup maps for history display
  heatAvgByName = {}
  heatCatByName = {}
  heatAvgByNameNorm = {}
  heatCatByNameNorm = {}
  gmapRef.value!.data.forEach((f: any) => {
    const n = String(f.getProperty('SUBURB_NAME') || '')
    const a = Number(f.getProperty('AVG_HEAT'))
    const c = String(f.getProperty('HEAT_CATEGORY') || '')
    if (n && Number.isFinite(a)) heatAvgByName[n] = a
    if (n && c) heatCatByName[n] = c
    const nk = normKey(n)
    if (nk && Number.isFinite(a)) heatAvgByNameNorm[nk] = a
    if (nk && c) heatCatByNameNorm[nk] = c
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
      if (lo != null && hi != null && hi < 900) range = ` (${fmt(lo)}-${fmt(hi)}°C)`
      else if (lo != null && (hi == null || hi >= 900)) range = ` (>=${fmt(lo)}°C)`
      else if (hi != null && (lo == null)) range = ` (<=${fmt(hi)}°C)`
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
    // Load saved history first so UI is populated quickly
    loadHistoryFromStorage()

    // Load heat/vegetation stats once so history card can show values
    await loadUhiDataOnce()
    refreshHistoryStats()
    await initUhiOnMap()
    if (vegMapRef.value) await initVegetationMap()

    // Setup Google Places Autocomplete on search input
    if (searchInputRef.value) {
    const autocomplete = new (window as any).google.maps.places.Autocomplete(searchInputRef.value as HTMLInputElement, {
      fields: ['geometry', 'name', 'formatted_address'],
      types: ['geocode'],
      componentRestrictions: { country: 'au' },
      bounds: gmapRef.value?.getBounds?.(),
      strictBounds: true,
    })
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        const loc = place?.geometry?.location
        if (loc) {
          const center = { lat: loc.lat(), lng: loc.lng() }
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
        // Only accept results that lie within our suburb polygons
        if (activeLayer.value === 'heat') {
          const liveHeat = getHeatAtLatLng(center.lat, center.lng)
          if (liveHeat.avg == null) {
            errorMsg.value = OUT_OF_COVERAGE_MSG
            return
          }
          // Clear any previous error on successful match within dataset
          errorMsg.value = ''
          // Use polygon suburb name as canonical label (case-insensitive, consistent)
          if (liveHeat.name) label = liveHeat.name
          // center only after validating within dataset
          if (gmapRef.value) { gmapRef.value.setCenter(center); gmapRef.value.setZoom(13) }
          placeCenterMarker(center, 'heat')
          const heatVal = liveHeat.avg
          const heatCat = liveHeat.category
          // Store precise map-derived value immediately
          const heatRank = findMapValue(label, heatRankMap) as number | undefined
          searchHistory.value.unshift({ id: cryptoRandom(), label, center, layer: activeLayer.value, key: normKey(label), heat: heatVal as number | undefined, veg: undefined, heatCategory: heatCat as string | undefined, rank: heatRank })
          if (searchHistory.value.length > 8) searchHistory.value.pop()
          refreshHistoryStats()
          saveHistoryToStorage()
        } else {
          // Vegetation: detect polygon name then map to veg percentage
          const liveHeat = getHeatAtLatLng(center.lat, center.lng)
          const suburbName = liveHeat.name
          const vegVal = suburbName ? vegTotalsMap[normKey(suburbName)] : undefined
          if (vegVal == null) {
            errorMsg.value = OUT_OF_COVERAGE_MSG
            return
          }
          // Clear any previous error on successful match within dataset
          errorMsg.value = ''
          if (suburbName) label = suburbName
          if (vegMapRef.value) { vegMapRef.value.setCenter(center); vegMapRef.value.setZoom(13) }
          placeCenterMarker(center, 'veg')
          const vegRank = suburbName ? (vegRankMap[normKey(suburbName)] as number | undefined) : undefined
          searchHistory.value.unshift({ id: cryptoRandom(), label, center, layer: activeLayer.value, key: normKey(label), heat: undefined, veg: vegVal as number | undefined, heatCategory: undefined, rank: vegRank })
          if (searchHistory.value.length > 8) searchHistory.value.pop()
          refreshHistoryStats()
          saveHistoryToStorage()
        }
        }
      })

    // Support pressing Enter to search by free text using Geocoder
    searchInputRef.value.addEventListener('keydown', (e: any) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const q = (searchInputRef.value as HTMLInputElement).value?.trim()
        if (!q) return
        const geocoder = new (window as any).google.maps.Geocoder()
        const req: any = {
          address: q,
          region: 'AU',
          componentRestrictions: { country: 'AU', administrativeArea: 'VIC' },
        }
        const b = gmapRef.value?.getBounds?.()
        if (b) req.bounds = b
        geocoder.geocode(req, (results: any, status: string) => {
          if (status === 'OK' && results && results[0]) {
            const vicPreferred = Array.isArray(results) ? (results.find((r: any) => isVicGeocodeResult(r)) || results[0]) : results[0]
            const r = vicPreferred
            const loc = r.geometry?.location
            if (!loc) return
            const center = { lat: loc.lat(), lng: loc.lng() }

            // Build a concise label: prefer the first segment before comma
            let label = String(r.formatted_address || q)
            if (label.includes(',')) label = label.split(',')[0].trim()
            // Only accept if inside our dataset polygon
            if (activeLayer.value === 'heat') {
              const liveHeat = getHeatAtLatLng(center.lat, center.lng)
              if (liveHeat.avg == null) {
                errorMsg.value = OUT_OF_COVERAGE_MSG
                return
              }
              // Clear any previous error on successful match within dataset
              errorMsg.value = ''
              if (liveHeat.name) label = liveHeat.name
              if (gmapRef.value) { gmapRef.value.setCenter(center); gmapRef.value.setZoom(13) }
              placeCenterMarker(center, 'heat')
              // Store precise map-derived value immediately
              const heatRank2 = findMapValue(label, heatRankMap) as number | undefined
              searchHistory.value.unshift({ id: cryptoRandom(), label, center, layer: activeLayer.value, key: normKey(label), heat: liveHeat.avg as number | undefined, veg: undefined, heatCategory: liveHeat.category as string | undefined, rank: heatRank2 })
              if (searchHistory.value.length > 8) searchHistory.value.pop()
              refreshHistoryStats()
              saveHistoryToStorage()
            } else {
              const liveHeat = getHeatAtLatLng(center.lat, center.lng)
              const suburbName = liveHeat.name
              const vegVal = suburbName ? vegTotalsMap[normKey(suburbName)] : undefined
              if (vegVal == null) {
                errorMsg.value = OUT_OF_COVERAGE_MSG
                return
              }
              errorMsg.value = ''
              if (suburbName) label = suburbName
              if (vegMapRef.value) { vegMapRef.value.setCenter(center); vegMapRef.value.setZoom(13) }
              placeCenterMarker(center, 'veg')
              const vegRank2 = suburbName ? (vegRankMap[normKey(suburbName)] as number | undefined) : undefined
              searchHistory.value.unshift({ id: cryptoRandom(), label, center, layer: activeLayer.value, key: normKey(label), heat: undefined, veg: vegVal as number | undefined, heatCategory: undefined, rank: vegRank2 })
              if (searchHistory.value.length > 8) searchHistory.value.pop()
              refreshHistoryStats()
              saveHistoryToStorage()
            }
          }
        })
      }
    })
    }

    // Load chart data once
    await buildCharts()
    // After charts data ready, render canvas charts
    await nextTick()
    try {
      const donut = document.getElementById('heat-donut') as HTMLCanvasElement | null
      if (donut && heatChartRows.value.length) {
        const labels = heatChartRows.value.map(r => r.label)
        const values = heatChartRows.value.map(r => r.count)
        const colors = heatChartRows.value.map(r => r.color)
        new Chart(donut.getContext('2d')!, {
          type: 'doughnut',
          data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
          options: {
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12 } },
              tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.raw}` } }
            },
            cutout: '60%',
            responsive: true,
            maintainAspectRatio: true,
          }
        })
      }

      // Vegetation donut using vegChartRows order/colors
      const vDonut = document.getElementById('veg-donut') as HTMLCanvasElement | null
      if (vDonut && vegChartRows.value.length) {
        const vLabels = vegChartRows.value.map(r => r.bucket)
        const vValues = vegChartRows.value.map(r => r.count)
        const vColors = vegChartRows.value.map(r => r.color)
        new Chart(vDonut.getContext('2d')!, {
          type: 'doughnut',
          data: { labels: vLabels, datasets: [{ data: vValues, backgroundColor: vColors }] },
          options: {
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12 } },
              tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.raw}` } }
            },
            cutout: '60%',
            responsive: true,
            maintainAspectRatio: true,
          }
        })
      }
      const scatter = document.getElementById('heat-veg-scatter') as HTMLCanvasElement | null
      if (scatter) {
        new Chart(scatter.getContext('2d')!, {
          type: 'scatter',
          data: { datasets: [{ label: 'Suburbs', data: (scatterPairs.value.length ? scatterPairs.value : [{ x: 0, y: 0, color: '#d1d5db' }]).map(p => ({ x: p.x, y: p.y })), pointRadius: 3, backgroundColor: (scatterPairs.value.length ? scatterPairs.value : [{ x: 0, y: 0, color: '#d1d5db' }]).map(p => p.color) }] },
          options: {
            scales: { x: { title: { display: true, text: 'Vegetation %' } }, y: { title: { display: true, text: 'Heat (°C)' } } },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => `(${ctx.parsed.x}, ${ctx.parsed.y})` } } },
            responsive: true,
            maintainAspectRatio: true,
          }
        })
      }
    } catch {}
  } catch {
    // fail silent to avoid breaking dashboard
  }
})

// Ensure vegetation map is created when user switches to it and keep instances in sync
watch(activeLayer, async (layer) => {
  if (layer === 'veg') {
    await nextTick()
    
    // Create veg map if it doesn't exist
    if (!vegMapRef.value) {
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
    }
    
    // Always reload vegetation data when switching to veg layer
    await initVegetationMap()
    // Move marker to vegetation map if present
    const vc2 = vegMapRef.value?.getCenter?.()
    if (vc2) placeCenterMarker({ lat: vc2.lat(), lng: vc2.lng() }, 'veg')
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
    const hc = gmapRef.value?.getCenter?.()
    if (hc) placeCenterMarker({ lat: hc.lat(), lng: hc.lng() }, 'heat')
  }
})

// legacy helper (kept for potential future use)
// function addHistory(...) deprecated; inlined into search handlers to ensure fresh data

function centerTo(item: { label: string; center: { lat: number; lng: number }; layer?: 'heat' | 'veg' }) {
  const { center } = item
  if (item.layer) activeLayer.value = item.layer
  if (gmapRef.value) { gmapRef.value.setCenter(center) }
  if (vegMapRef.value) { vegMapRef.value.setCenter(center) }
  placeCenterMarker(center, item.layer)
}

function removeHistory(item: { label: string; id?: string }) {
  // Remove by id when available; fallback to first label match
  if (item.id) {
    const posById = searchHistory.value.findIndex(h => h.id === item.id)
    if (posById >= 0) searchHistory.value.splice(posById, 1)
  } else {
    const pos = searchHistory.value.findIndex(h => h.label === item.label)
    if (pos >= 0) searchHistory.value.splice(pos, 1)
  }
  saveHistoryToStorage()
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

    // Heat bins (<=0,0-4,4-8,8-12,>12)
    const hBins = [
      { name: '<=0', min: -1000, max: 0, color: '#93c5fd' },
      { name: '0-4', min: 0, max: 4, color: '#60a5fa' },
      { name: '4-8', min: 4, max: 8, color: '#f59e0b' },
      { name: '8-12', min: 8, max: 12, color: '#ef4444' },
      { name: '>12', min: 12, max: 1000, color: '#7f1d1d' },
    ]
    const hCounts: Record<string, number> = {}
    hBins.forEach(b => { hCounts[b.name] = 0 })
    suburbs.forEach((s: any) => {
      const v = Number(s?.heat?.avg ?? s?.heat?.intensity)
      if (!Number.isFinite(v)) return
      const b = hBins.find(b => v >= b.min && v < b.max)
      if (b) hCounts[b.name] += 1
    })
    heatBinRows.value = hBins.map(b => ({
      bucket: b.name,
      color: b.color,
      count: hCounts[b.name] || 0,
      percent: Math.round(((hCounts[b.name] || 0) / total) * 100)
    }))

    // Top N lists
    const byHeat = suburbs
      .map((s: any) => ({ name: String(s?.name || s?.id || ''), heat: Number(s?.heat?.avg ?? s?.heat?.intensity) }))
      .filter(x => x.name && Number.isFinite(x.heat))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 5)
    const hMax = byHeat[0]?.heat || 1
    topHotRows.value = byHeat.map(x => ({ ...x, percent: Math.round((x.heat / hMax) * 100) }))

    const byVeg = suburbs
      .map((s: any) => ({ name: String(s?.name || s?.id || ''), veg: Number(s?.vegetation?.total) }))
      .filter(x => x.name && Number.isFinite(x.veg))
      .sort((a, b) => b.veg - a.veg)
      .slice(0, 5)
    const vMax = byVeg[0]?.veg || 1
    topGreenRows.value = byVeg.map(x => ({ ...x, percent: Math.round((x.veg / vMax) * 100) }))

    // Pearson correlation between vegetation total and heat avg
    const pairs = suburbs
      .map((s: any) => ({
        x: Number(s?.vegetation?.total),
        y: Number(s?.heat?.avg ?? s?.heat?.intensity),
        color: ((payload?.heat_categories || categoriesMap || {})[String(s?.heat?.category || '').toLowerCase().replace(/\s+/g, '_')]?.color) || '#9ca3af'
      }))
      .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y))
    scatterPairs.value = pairs
    const n = pairs.length
    if (n > 2) {
      const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
      const xs = pairs.map(p => p.x)
      const ys = pairs.map(p => p.y)
      const mx = mean(xs), my = mean(ys)
      const cov = pairs.reduce((acc, p) => acc + (p.x - mx) * (p.y - my), 0)
      const sx = Math.sqrt(pairs.reduce((acc, p) => acc + Math.pow(p.x - mx, 2), 0))
      const sy = Math.sqrt(pairs.reduce((acc, p) => acc + Math.pow(p.y - my, 2), 0))
      correlationR.value = sx && sy ? (cov / (sx * sy)) : 0
    } else {
      correlationR.value = 0
    }
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
.inline-error { color: #b91c1c; font-size: 12px; background: #fee2e2; border: 1px solid #fecaca; padding: 6px 8px; border-radius: 6px; }

.layout-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1rem; align-items: start; }
.layout-left { min-width: 0; }
.layout-right { position: relative; min-width: 0; align-self: start; }
.layer-fixed { position: sticky; top: 12px; z-index: 2; }
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
.layer-value { font-size: 12px; color: #065f46; font-weight: 700; margin-left: 8px; margin-right: auto; }
.value-badge { font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid #d1d5db; margin-left: 8px; margin-right: auto; font-weight: 700; }
.value-badge.heat { border-color: #fca5a5; color: #7f1d1d; background: #fff1f2; }
.value-badge.veg { border-color: #86efac; color: #065f46; background: #ecfdf5; }
.rank-badge { font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid #d1d5db; background: #ffffff; }
.rank-badge.heat { border-color: #fca5a5; color: #7f1d1d; background: #fff1f2; }
.rank-badge.veg { border-color: #86efac; color: #065f46; background: #ecfdf5; }
.value-group { display: flex; align-items: center; gap: 8px; margin-left: 8px; margin-right: auto; }
.layer-badge { font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid #d1d5db; color: #374151; background: #ffffff; }
.layer-badge.heat { border-color: #fca5a5; color: #7f1d1d; background: #fff1f2; }
.layer-badge.veg { border-color: #86efac; color: #065f46; background: #ecfdf5; }
.history-go { background: #065f46; color: white; border: none; border-radius: 999px; padding: 6px; font-size: 12px; cursor: pointer; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; }
.history-go:hover { background: #047857; }
.history-go svg { width: 16px; height: 16px; }
.history-remove { background: transparent; border: none; color: #9ca3af; cursor: pointer; font-size: 18px; line-height: 1; }
.history-remove:hover { color: #6b7280; }
.history-actions { margin-top: 8px; text-align: right; }
.history-clear { background: transparent; border: none; color: #065f46; cursor: pointer; font-size: 12px; }
.hint-text { color: #6b7280; font-size: 12px; margin-top: 8px; }
.map-panel { position: relative; }
.history-trend { margin-top: 6px; font-size: 12px; color: #374151; }
.history-report { display: grid; grid-template-columns: 120px 1fr; gap: 12px; margin-top: 8px; align-items: start; }
.report-media img { width: 100%; height: auto; border-radius: 8px; border: 1px solid #e5e7eb; }
.heat-media {
  width: 100%; height: 0; padding-bottom: 140px; border-radius: 8px; border: 1px solid #e5e7eb;
  background: radial-gradient(circle at 30% 30%, rgba(239,68,68,0.9), rgba(239,68,68,0.4) 40%, rgba(239,68,68,0.2) 60%, rgba(239,68,68,0.05) 75%, rgba(255,255,255,1) 76%),
              conic-gradient(from 0deg, rgba(239,68,68,0.85), rgba(245,158,11,0.85), rgba(59,130,246,0.4), rgba(34,197,94,0.65));
  background-blend-mode: multiply;
}
.report-content { display: grid; gap: 6px; }
.report-title { font-weight: 700; color: #065f46; font-size: 12px; }
.kpi-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.kpi { display: flex; justify-content: space-between; font-size: 12px; color: #374151; }
.kpi-label { color: #6b7280; }
.kpi-value { font-weight: 700; }

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
.chart-canvas { width: 100%; max-width: 520px; height: 260px; display: block; margin: 0 auto; }
.charts-row-2 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
@media (min-width: 900px) { .charts-row-2 { grid-template-columns: 1fr 1fr; } }

.placeholder-text {
  color: #6b7280;
  font-size: 1rem;
}

/* Hide Google Maps InfoWindow close (X) button inside this component */
:deep(.gm-ui-hover-effect) { display: none !important; }

/* Split layout for chart + description */
.chart-split { display: grid; grid-template-columns: 1fr; gap: 12px; align-items: start; }
@media (min-width: 900px) { .chart-split { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); } }
.chart-pane { min-width: 0; }
.chart-desc { min-width: 0; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
.desc-title { font-weight: 700; color: #065f46; margin-bottom: 6px; }
.desc-text { color: #374151; font-size: 13px; line-height: 1.45; margin: 0 0 6px 0; }
.desc-list { margin: 0; padding-left: 18px; color: #374151; font-size: 13px; }
</style>
