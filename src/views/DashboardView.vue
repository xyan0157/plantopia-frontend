<template>
  <div class="dashboard">
    <!-- Background Video -->
    <video class="page-bg" src="/Guide%20background.mp4" autoplay muted loop playsinline></video>

    <!-- Hero Section -->
    <section class="hero-section" ref="heroSection">
      <div class="hero-content">
        <h1 class="hero-title">Melbourne's Hidden Heat Crisis</h1>
        <p class="hero-subtitle">
          Across Melbourne's suburbs, temperatures vary by up to 12°C.<br>
          <strong>{{ veryHotCount }} suburbs</strong> experience High heat conditions.<br>
          But nature has a solution.
        </p>
        <div class="scroll-indicator">
          <span>Discover Your Suburb's Heat Profile</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" transform="rotate(90 12 12)"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- Data Snapshot Section -->
    <section class="data-snapshot" ref="snapshotSection">
      <div class="snapshot-container">
        <div class="stat-card" v-for="(stat, index) in keyStats" :key="index">
          <div class="stat-icon" v-html="stat.icon"></div>
          <div class="stat-number">{{ stat.number }}</div>
          <div class="stat-label">
            {{ stat.label }}
            <InfoTooltip
              v-if="stat.tooltip"
              :text="stat.tooltip.text"
              :title="stat.tooltip.title"
              position="bottom"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Map Section -->
    <section class="map-section" ref="mapSection">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">Explore Your Suburb</h2>
          <p class="section-subtitle">Search for your suburb to see its heat profile and compare it with Melbourne's average</p>
        </div>

        <div class="map-layout">
          <!-- Map Area -->
          <div class="map-area">
            <div class="map-toolbar">
              <div class="search-container">
                <input
                  ref="searchInputRef"
                  v-model="searchQuery"
                  @input="onSearchInput"
                  @focus="showDropdown = true"
                  @blur="onSearchBlur"
                  type="text"
                  class="map-search-input"
                  placeholder="Search your suburb (e.g., Carlton, Richmond)..."
                  aria-label="Search location"
                  autocomplete="off"
                />
                <div v-if="showDropdown && filteredSuburbs.length > 0" class="autocomplete-dropdown">
                  <div
                    v-for="suburb in filteredSuburbs"
                    :key="suburb.id"
                    @mousedown.prevent="selectSuburb(suburb)"
                    class="autocomplete-item"
                  >
                    <span class="suburb-name">{{ suburb.name }}</span>
                    <span class="suburb-postcode">{{ suburb.postcode }}</span>
                  </div>
                </div>
              </div>
              <div v-if="errorMsg" class="inline-error">{{ errorMsg }}</div>
            </div>

            <div class="map-controls">
              <label class="layer-toggle">
                <input type="radio" value="heat" v-model="activeLayer" name="layer" />
                <span>Heat Intensity</span>
              </label>
              <label class="layer-toggle">
                <input type="radio" value="veg" v-model="activeLayer" name="layer" />
                <span>Vegetation Coverage</span>
              </label>
            </div>

            <div class="map-wrapper">
              <div id="gmap" class="map" v-show="activeLayer === 'heat'"></div>
              <div id="vegmap" class="map" v-show="activeLayer === 'veg'"></div>
              <div id="uhi-legend" class="uhi-legend" v-show="activeLayer === 'heat' && legendHtml" v-html="legendHtml"></div>
              <div id="veg-legend" class="uhi-legend" v-show="activeLayer === 'veg' && vegLegendHtml" v-html="vegLegendHtml"></div>
            </div>
          </div>

          <!-- Sidebar Info Panel -->
          <aside class="info-panel">
            <div class="panel-content" v-if="selectedSuburb">
              <div class="suburb-header">
                <h3 class="suburb-name">{{ selectedSuburb.label }}</h3>
                <span class="heat-badge" :class="getHeatClass(selectedSuburb.heatCategory)">
                  {{ selectedSuburb.heatCategory || 'Unknown' }}
                </span>
              </div>

              <div class="suburb-stats">
                <div class="stat-row" v-if="selectedSuburb.heat != null">
                  <span class="stat-label">Temperature</span>
                  <span class="stat-value heat">{{ selectedSuburb.heat.toFixed(1) }}°C</span>
                </div>
                <div class="stat-row" v-if="selectedSuburb.rank != null">
                  <span class="stat-label">Heat Rank</span>
                  <span class="stat-value">#{{ selectedSuburb.rank }} of {{ totalSuburbs }}</span>
                </div>
                <div class="stat-row" v-if="selectedSuburb.veg != null">
                  <span class="stat-label">Vegetation Coverage</span>
                  <span class="stat-value veg">{{ selectedSuburb.veg.toFixed(1) }}%</span>
                </div>
                <div class="stat-row comparison" v-if="selectedSuburb.heat != null && melbourneAvgHeat">
                  <span class="stat-label">vs Melbourne Average</span>
                  <span class="stat-value" :class="{ 'heat': selectedSuburb.heat > melbourneAvgHeat, 'cool': selectedSuburb.heat < melbourneAvgHeat }">
                    {{ selectedSuburb.heat > melbourneAvgHeat ? '+' : '' }}{{ (selectedSuburb.heat - melbourneAvgHeat).toFixed(1) }}°C
                  </span>
                </div>
              </div>

              <button class="action-btn primary" @click="goToRecommendations(selectedSuburb.label)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
                See Cooling Plants
              </button>
            </div>

            <div class="panel-placeholder" v-else>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>Search for a suburb to see detailed heat information</p>
            </div>

            <!-- Quick Stats -->
            <div class="quick-stats">
              <div class="quick-stat-item hot">
                <span class="label">Hottest (Highest Urban Heat Intensity)</span>
                <div class="value-group">
                  <span class="value">{{ hottestSuburb }}</span>
                  <span class="metric">{{ hottestTemp }}</span>
                </div>
              </div>
              <div class="quick-stat-item cool">
                <span class="label">Coolest (Lowest Urban Heat Intensity)</span>
                <div class="value-group">
                  <span class="value">{{ coolestSuburb }}</span>
                  <span class="metric">{{ coolestTemp }}</span>
                </div>
              </div>
              <div class="quick-stat-item green">
                <span class="label">Most Vegetated</span>
                <div class="value-group">
                  <span class="value">{{ greenestSuburb }}</span>
                  <span class="metric">{{ greenestVeg }}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <!-- Scatter Plot Narrative Section -->
    <section class="pattern-section" ref="patternSection">
      <div class="section-container">
        <div class="section-header centered">
          <h2 class="section-title">The Pattern is Clear</h2>
          <p class="section-subtitle">
            Data from across Melbourne reveals a strong relationship between vegetation and temperature
          </p>
        </div>

        <div class="pattern-content">
          <div class="chart-area">
            <canvas id="heat-veg-scatter" class="scatter-chart"></canvas>
          </div>
          <div class="pattern-insights">
            <div class="insight-card">
              <div class="insight-icon">📊</div>
              <div class="insight-text">
                <strong>Strong Negative Correlation</strong>
                <p>Pearson r = {{ correlationR.toFixed(2) }}
                  <InfoTooltip
                    title="Correlation Coefficient"
                    text="A value of -1 indicates perfect negative correlation. Our data shows that as vegetation increases, temperature consistently decreases across Melbourne's suburbs."
                    position="right"
                  />
                </p>
              </div>
            </div>
            <div class="insight-card highlight">
              <div class="insight-icon">🌡️</div>
              <div class="insight-text">
                <strong>Every 10% More Vegetation</strong>
                <p>Results in approximately <strong>1.2°C cooler</strong> temperatures on average<sup class="footnote-ref">1</sup></p>
              </div>
            </div>
            <div class="insight-card">
              <div class="insight-icon">🌳</div>
              <div class="insight-text">
                <strong>Nature's Air Conditioning</strong>
                <p>Green suburbs stay cool, concrete suburbs heat up. The science is clear.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Impact Section -->
    <section class="impact-section" ref="impactSection">
      <div class="section-container">
        <div class="section-header centered">
          <h2 class="section-title">Why This Matters</h2>
          <p class="section-subtitle">Urban heat islands don't just affect comfort—they impact lives, wallets, and our planet</p>
        </div>

        <div class="impact-grid">
          <div class="impact-card health">
            <div class="impact-icon">🏥</div>
            <h3 class="impact-title">Health Impact</h3>
            <p class="impact-stat">500+ heat-related<br>hospital visits annually<sup class="footnote-ref">2</sup></p>
            <p class="impact-description">in Melbourne's hottest suburbs during summer months</p>
            <InfoTooltip
              title="Heat-Related Health Issues"
              text="Extreme heat can cause heat exhaustion, heat stroke, dehydration, and exacerbate existing cardiovascular and respiratory conditions, particularly affecting elderly and vulnerable populations."
              position="top"
            />
          </div>

          <div class="impact-card economy">
            <div class="impact-icon">💰</div>
            <h3 class="impact-title">Economic Cost</h3>
            <p class="impact-stat">15-25% higher<br>energy costs<sup class="footnote-ref">3</sup></p>
            <p class="impact-description">in high-heat areas during peak summer</p>
            <InfoTooltip
              title="Energy Burden"
              text="Residents in hotter suburbs spend significantly more on cooling their homes, with some households facing energy poverty due to extreme heat conditions."
              position="top"
            />
          </div>

          <div class="impact-card environment">
            <div class="impact-icon">🌍</div>
            <h3 class="impact-title">Environmental Cost</h3>
            <p class="impact-stat">30% more emissions<sup class="footnote-ref">4</sup></p>
            <p class="impact-description">from cooling systems in urban heat island areas</p>
            <InfoTooltip
              title="Climate Feedback Loop"
              text="Increased cooling demands lead to higher emissions, which contribute to climate change, creating a dangerous feedback loop that intensifies urban heat islands."
              position="top"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Charts Section -->
    <section class="charts-section" ref="chartsSection">
      <div class="section-container">
        <div class="section-header centered">
          <h2 class="section-title">Melbourne's Heat Landscape</h2>
          <p class="section-subtitle">Understanding the distribution of heat and vegetation across our suburbs</p>
        </div>

        <div class="charts-grid">
          <!-- Left Column -->
          <div class="chart-column">
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">Heat Distribution Across Melbourne</h3>
                <p class="chart-narrative">{{ heatDistributionNarrative }}</p>
              </div>
              <div class="chart-body">
                <canvas id="heat-donut" class="chart-canvas"></canvas>
              </div>
            </div>

            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">Top 5 Hottest Suburbs</h3>
                <p class="chart-narrative">{{ topHotNarrative }}</p>
              </div>
              <div class="chart-body">
                <div class="bar-chart-rows">
                  <div class="bar-row" v-for="(row, index) in topHotRows" :key="row.name">
                    <div class="bar-rank">{{ index + 1 }}</div>
                    <div class="bar-label">{{ row.name }}</div>
                    <div class="bar-container">
                      <div class="bar-fill heat" :style="{ width: row.percent + '%' }"></div>
                    </div>
                    <div class="bar-value">{{ row.heat.toFixed(1) }}°C</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="chart-column">
            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">Vegetation Coverage Distribution</h3>
                <p class="chart-narrative">{{ vegDistributionNarrative }}</p>
              </div>
              <div class="chart-body">
                <canvas id="veg-donut" class="chart-canvas"></canvas>
              </div>
            </div>

            <div class="chart-card">
              <div class="chart-header">
                <h3 class="chart-title">Top 5 Greenest Suburbs</h3>
                <p class="chart-narrative">{{ topGreenNarrative }}</p>
              </div>
              <div class="chart-body">
                <div class="bar-chart-rows">
                  <div class="bar-row" v-for="(row, index) in topGreenRows" :key="row.name">
                    <div class="bar-rank">{{ index + 1 }}</div>
                    <div class="bar-label">{{ row.name }}</div>
                    <div class="bar-container">
                      <div class="bar-fill veg" :style="{ width: row.percent + '%' }"></div>
                    </div>
                    <div class="bar-value">{{ row.veg.toFixed(1) }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Solution Section -->
    <section class="solution-section" ref="solutionSection">
      <div class="section-container">
        <div class="solution-content">
          <div class="solution-text">
            <h2 class="section-title">The Solution is Growing</h2>
            <p class="solution-description">
              Climate-sensitive plants aren't just beautiful—they're Melbourne's natural cooling system.
            </p>
            <div class="solution-points">
              <div class="solution-point">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span><strong>Trees provide shade</strong>, reducing ground temperature by up to 5°C<sup class="footnote-ref">5</sup></span>
              </div>
              <div class="solution-point">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span><strong>Shrubs and groundcover</strong> release moisture, cooling the surrounding air<sup class="footnote-ref">6</sup></span>
              </div>
              <div class="solution-point">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span><strong>Strategic planting</strong> can reduce your suburb's heat by 2-3°C<sup class="footnote-ref">7</sup></span>
              </div>
            </div>
          </div>
          <div class="solution-visual">
            <div class="thermometer-card">
              <div class="thermometer-content">
                <div class="temp-visual">
                  <div class="temp-before">
                    <div class="temp-icon hot">🌡️</div>
                    <div class="temp-value">35°C</div>
                    <div class="temp-label">Without vegetation</div>
                  </div>
                  <div class="temp-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.75 3v10.19l3.72-3.72 1.06 1.06-5.53 5.53-5.53-5.53 1.06-1.06 3.72 3.72V3h1.5z"/>
                    </svg>
                    <span>7°C drop</span>
                  </div>
                  <div class="temp-after">
                    <div class="temp-icon cool">🌳</div>
                    <div class="temp-value">28°C</div>
                    <div class="temp-label">With urban greening</div>
                  </div>
                </div>
                <p class="thermometer-caption">Strategic planting reduces ambient temperature significantly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section" ref="ctaSection">
      <div class="section-container">
        <div class="cta-content">
          <h2 class="cta-title">Your Impact Starts Here</h2>
          <p class="cta-subtitle">
            Get personalized plant recommendations for your suburb's heat profile.<br>
            Every plant makes a difference.
          </p>
          <div class="cta-buttons">
            <button class="cta-btn primary" @click="goToRecommendations()">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
              </svg>
              Get Plant Recommendations
            </button>
            <button class="cta-btn secondary" @click="goToPlants()">
              Browse All Climate Plants
            </button>
            <button class="cta-btn tertiary" @click="goToGuides()">
              Learn Growing Techniques
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- References Section -->
    <section class="references-section" ref="referencesSection">
      <div class="section-container">
        <h3 class="references-title">References</h3>
        <div class="references-list">
          <div class="reference-item">
            <span class="reference-number">1.</span>
            <span class="reference-text">
              Chen, S., et al. (2024). Urban vegetation cooling effect: A study of Shenzhen, China.
              <a href="https://www.sciencedirect.com/science/article/pii/S2095633924000029" target="_blank" rel="noopener">Urban Climate, 53, 101759</a>
            </span>
          </div>
          <div class="reference-item">
            <span class="reference-number">2.</span>
            <span class="reference-text">
              Victorian Department of Health (2009). January 2009 Heatwave in Victoria: An Assessment of Health Impacts.
              <a href="https://www.health.vic.gov.au/" target="_blank" rel="noopener">Victorian Government - 514 heat-related hospital presentations, 374 excess deaths</a>
            </span>
          </div>
          <div class="reference-item">
            <span class="reference-number">3.</span>
            <span class="reference-text">
              Victorian Council of Social Service (2022). Melbourne's Hot Divide: Cooling inequality in a warming city.
              <a href="https://vcoss.org.au/policy-advocacy/melbournes-hot-divide/" target="_blank" rel="noopener">VCOSS Research Report</a>
            </span>
          </div>
          <div class="reference-item">
            <span class="reference-number">4.</span>
            <span class="reference-text">
              U.S. Environmental Protection Agency (2024). Heat Islands and Climate Change.
              <a href="https://www.epa.gov/heatislands/climate-change-and-heat-islands" target="_blank" rel="noopener">EPA Climate Adaptation Resource Center</a>
            </span>
          </div>
          <div class="reference-item">
            <span class="reference-number">5.</span>
            <span class="reference-text">
              Sanusi, R., et al. (2017). Street orientation and side of the street greatly influence the microclimatic benefits street trees can provide in summer.
              <a href="https://doi.org/10.1016/j.jenvman.2016.11.055" target="_blank" rel="noopener">Journal of Environmental Management, 187, 140-151</a>
            </span>
          </div>
          <div class="reference-item">
            <span class="reference-number">6.</span>
            <span class="reference-text">
              Rahman, M.A., et al. (2020). Traits of trees for cooling urban heat islands: A meta-analysis.
              <a href="https://doi.org/10.1016/j.buildenv.2019.106606" target="_blank" rel="noopener">Building and Environment, 170, 106606</a>
            </span>
          </div>
          <div class="reference-item">
            <span class="reference-number">7.</span>
            <span class="reference-text">
              Norton, B.A., et al. (2015). Planning for cooler cities: A framework to prioritise green infrastructure to ameliorate urban heat island effects.
              <a href="https://doi.org/10.1016/j.landurbplan.2015.04.018" target="_blank" rel="noopener">Landscape and Urban Planning, 134, 127-138</a>
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { onMounted, ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { ensureGoogleMapsLoaded } from '@/services/gmapsLoader'
import { getUhiMetadata, getUhiData, getBoundaryGeo } from '@/services/uhiPreload'
import InfoTooltip from '@/components/InfoTooltip.vue'

const router = useRouter()
const loadGoogleMaps = ensureGoogleMapsLoaded

// Refs
const gmapRef = ref<any>(null)
const vegMapRef = ref<any>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const legendHtml = ref('')
const vegLegendHtml = ref('')
const errorMsg = ref('')
const activeLayer = ref<'heat' | 'veg'>('heat')
const selectedSuburb = ref<any>(null)
const searchMarker = ref<any>(null)
const vegSearchMarker = ref<any>(null)
const allMarkers = ref<any[]>([])

// Custom autocomplete for suburbs
const suburbsList = ref<Array<{ id: number; name: string; postcode: string; latitude: number; longitude: number; state: string }>>([])
const searchQuery = ref('')
const showDropdown = ref(false)

// Loading state
const isLoading = ref(true)

// Section refs for animations
const heroSection = ref<HTMLElement | null>(null)
const snapshotSection = ref<HTMLElement | null>(null)
const mapSection = ref<HTMLElement | null>(null)
const patternSection = ref<HTMLElement | null>(null)
const impactSection = ref<HTMLElement | null>(null)
const chartsSection = ref<HTMLElement | null>(null)
const solutionSection = ref<HTMLElement | null>(null)
const ctaSection = ref<HTMLElement | null>(null)
const referencesSection = ref<HTMLElement | null>(null)

// Data
let categoriesMap: Record<string, { color: string; label: string }> = {}
let vegTotalsMap: Record<string, number> = {}
let heatAvgMap: Record<string, number> = {}
let heatCategoryMap: Record<string, string> = {}
const heatRankMap: Record<string, number> = {}
const vegRankMap: Record<string, number> = {}
let heatAvgByName: Record<string, number> = {}
let heatCatByName: Record<string, string> = {}
let heatAvgByNameNorm: Record<string, number> = {}
let heatCatByNameNorm: Record<string, string> = {}
let uhiByName: Record<string, any> = {}
let lastSimplified = true

// Chart data
const heatChartRows = ref<Array<{ key: string; label: string; color: string; count: number; percent: number }>>([])
const vegChartRows = ref<Array<{ bucket: string; color: string; count: number; percent: number }>>([])
const topHotRows = ref<Array<{ name: string; heat: number; percent: number }>>([])
const topCoolRows = ref<Array<{ name: string; heat: number; percent: number }>>([])
const topGreenRows = ref<Array<{ name: string; veg: number; percent: number }>>([])
const correlationR = ref<number>(0)
const scatterPairs = ref<Array<{ x: number; y: number; color: string }>>([])
const totalSuburbs = ref<number>(0)
const veryHotCount = ref<number>(0)
const melbourneAvgHeat = ref<number>(0)

// Computed narratives
const heatDistributionNarrative = computed(() => {
  if (!heatChartRows.value.length) return 'Loading data...'
  const veryHot = heatChartRows.value.find(r => r.label.toLowerCase().includes('very hot'))
  if (veryHot) {
    return `${veryHot.count} suburbs (${veryHot.percent}%) experience very hot conditions, putting residents at higher health risk.`
  }
  return 'Heat data shows significant variation across Melbourne suburbs.'
})

const vegDistributionNarrative = computed(() => {
  if (!vegChartRows.value.length) return 'Loading data...'
  const high = vegChartRows.value.filter(r => r.bucket.includes('40+') || r.bucket.includes('30-40'))
  const total = high.reduce((sum, r) => sum + r.count, 0)
  return `Only ${total} suburbs have 30%+ vegetation coverage, highlighting the urgent need for urban greening.`
})

const topHotNarrative = computed(() => {
  if (!topHotRows.value.length) return 'Loading data...'
  const hottest = topHotRows.value[0]
  return `${hottest.name} experiences the highest average temperatures at ${hottest.heat.toFixed(1)}°C.`
})

const topGreenNarrative = computed(() => {
  if (!topGreenRows.value.length) return 'Loading data...'
  const greenest = topGreenRows.value[0]
  return `${greenest.name} leads with ${greenest.veg.toFixed(1)}% vegetation coverage, demonstrating the cooling potential.`
})

const hottestSuburb = computed(() => {
  return topHotRows.value.length > 0 ? topHotRows.value[0].name : 'Loading...'
})

const coolestSuburb = computed(() => {
  return topCoolRows.value.length > 0 ? topCoolRows.value[0].name : 'Loading...'
})

const greenestSuburb = computed(() => {
  return topGreenRows.value.length > 0 ? topGreenRows.value[0].name : 'Loading...'
})

const hottestTemp = computed(() => {
  return topHotRows.value.length > 0 ? `${topHotRows.value[0].heat.toFixed(1)}°C` : '...'
})

const coolestTemp = computed(() => {
  return topCoolRows.value.length > 0 ? `${topCoolRows.value[0].heat.toFixed(1)}°C` : '...'
})

const greenestVeg = computed(() => {
  return topGreenRows.value.length > 0 ? `${topGreenRows.value[0].veg.toFixed(1)}%` : '...'
})

// Key stats for snapshot
const keyStats = computed(() => [
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/></svg>',
    number: veryHotCount.value.toString(),
    label: 'suburbs experience High heat',
    tooltip: {
      title: 'Heat Categories',
      text: 'Suburbs are classified as Very Hot, Hot, Moderate, or Cool based on average surface temperature measurements. Very Hot suburbs consistently exceed safe temperature thresholds.'
    }
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clip-rule="evenodd"/></svg>',
    number: '12°C',
    label: 'temperature difference across suburbs',
    tooltip: {
      title: 'Urban Heat Island Effect',
      text: 'The Urban Heat Island Effect occurs when cities replace natural land with heat-absorbing surfaces. This creates temperature differences of up to 12°C between suburbs with different levels of urbanization and vegetation.'
    }
  },
  {
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z"/></svg>',
    number: topGreenRows.value.length > 0 ? `${topGreenRows.value[0].veg.toFixed(0)}%` : '...',
    label: 'vegetation in coolest suburbs',
    tooltip: {
      title: 'Vegetation Coverage',
      text: 'Vegetation coverage is the percentage of land area covered by trees, shrubs, and other plants. Higher vegetation coverage directly correlates with lower temperatures through shade and evapotranspiration.'
    }
  }
])

// Watch for layer changes (for future enhancements if needed)
watch(activeLayer, () => {
  // Markers are already on both maps, no action needed
})

// Navigation
const goToRecommendations = (suburb?: string) => {
  if (suburb) {
    router.push({ path: '/recommendations', query: { suburb } })
  } else {
    router.push('/recommendations')
  }
}

// Filtered suburbs for autocomplete
const filteredSuburbs = computed(() => {
  if (!searchQuery.value || searchQuery.value.trim() === '') return []

  const query = searchQuery.value.toLowerCase().trim()
  const filtered = suburbsList.value
    .filter(suburb =>
      suburb.name.toLowerCase().includes(query) ||
      suburb.postcode.includes(query)
    )
    .slice(0, 10) // Limit to 10 results

  console.log('[Dashboard] Filtered suburbs:', filtered.length, 'for query:', query)
  return filtered
})

const goToPlants = () => {
  router.push('/plants')
}

const goToGuides = () => {
  router.push('/guides')
}

// Utility functions
function normKey(v: unknown): string {
  return String(v ?? '').toLowerCase().trim().replace(/\s+/g, '_')
}

function uhiUrl(path: string) {
  const base = (import.meta as any).env?.VITE_API_URL || 'https://budgets-accepting-porcelain-austin.trycloudflare.com'
  return `${base}${path}`
}

function getHeatClass(category: string | undefined): string {
  if (!category) return 'unknown'
  const cat = category.toLowerCase()
  if (cat.includes('very hot')) return 'very-hot'
  if (cat.includes('hot')) return 'hot'
  if (cat.includes('moderate')) return 'moderate'
  return 'cool'
}

// Custom autocomplete functions
async function loadSuburbs() {
  try {
    // Load suburbs from UHI data endpoint to get all suburbs shown on the map
    const url = uhiUrl('/api/v1/uhi/data')
    console.log('[Dashboard] Loading suburbs from:', url)
    const resp = await fetch(url)
    if (!resp.ok) {
      console.error('[Dashboard] Failed to load suburbs from UHI data, status:', resp.status)
      return
    }
    const data = await resp.json()
    console.log('[Dashboard] Raw API response:', data)
    const suburbs: Array<any> = Array.isArray(data?.suburbs) ? data.suburbs : []
    console.log('[Dashboard] Suburbs array from API:', suburbs.length)

    // Log first suburb to see structure
    if (suburbs.length > 0) {
      console.log('[Dashboard] First suburb structure:', suburbs[0])
    }

    // Transform UHI suburb data to match the expected format
    // The API returns coordinates as {lat, lng} not {latitude, longitude}
    const transformedSuburbs = suburbs
      .filter((s: any) => {
        const hasName = Boolean(s?.name)
        const hasCoordinates = s?.coordinates?.lat && s?.coordinates?.lng
        return hasName && hasCoordinates
      })
      .map((s: any) => ({
        id: s.id || 0,
        name: s.name || '',
        postcode: s.postcode || '',
        latitude: s.coordinates?.lat || 0,
        longitude: s.coordinates?.lng || 0,
        state: s.state || 'VIC'
      }))

    // Remove duplicates based on suburb name (case-insensitive)
    const uniqueSuburbs = transformedSuburbs.reduce((acc: any[], suburb: any) => {
      const exists = acc.find(s => s.name.toLowerCase() === suburb.name.toLowerCase())
      if (!exists) {
        acc.push(suburb)
      }
      return acc
    }, [])

    // Sort alphabetically
    suburbsList.value = uniqueSuburbs.sort((a, b) => a.name.localeCompare(b.name))

    console.log('[Dashboard] Loaded suburbs for autocomplete:', suburbsList.value.length)
    if (suburbsList.value.length > 0) {
      console.log('[Dashboard] Sample suburb:', suburbsList.value[0])
    }
  } catch (e) {
    console.error('[Dashboard] Error loading suburbs:', e)
  }
}

function onSearchInput() {
  showDropdown.value = true
}

function onSearchBlur() {
  // Delay hiding to allow click on dropdown items
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

function selectSuburb(suburb: any) {
  searchQuery.value = suburb.name
  showDropdown.value = false
  errorMsg.value = ''

  const center = { lat: suburb.latitude, lng: suburb.longitude }
  const label = suburb.name

  const liveHeat = getHeatAtLatLng(center.lat, center.lng)
  if (liveHeat.avg == null) {
    errorMsg.value = 'Please enter a suburb within the Melbourne region.'
    selectedSuburb.value = null
    return
  }

  // Clear ALL existing markers - comprehensive approach
  const markersToRemove = [...allMarkers.value]
  markersToRemove.forEach((marker) => {
    try {
      if (marker && typeof marker.setMap === 'function') {
        marker.setVisible(false)
        marker.setMap(null)
      }
    } catch (e) {
      console.error('Error removing marker from array:', e)
    }
  })

  // Clear specific marker refs
  if (searchMarker.value) {
    try {
      searchMarker.value.setVisible(false)
      searchMarker.value.setMap(null)
    } catch (e) {
      console.error('Error removing searchMarker:', e)
    }
  }

  if (vegSearchMarker.value) {
    try {
      vegSearchMarker.value.setVisible(false)
      vegSearchMarker.value.setMap(null)
    } catch (e) {
      console.error('Error removing vegSearchMarker:', e)
    }
  }

  // Reset all marker references
  searchMarker.value = null
  vegSearchMarker.value = null
  allMarkers.value = []

  // Handle heat map
  if (gmapRef.value) {
    gmapRef.value.setCenter(center)
    gmapRef.value.setZoom(13)

    // Create new marker at search location with white pin
    const heatMarker = new (window as any).google.maps.Marker({
      position: center,
      map: gmapRef.value,
      title: label,
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        strokeColor: '#065F46',
        strokeWeight: 3
      }
    })
    searchMarker.value = heatMarker
    allMarkers.value.push(heatMarker)

    // Create and show info window for the searched location
    const heatInfoWindow = new (window as any).google.maps.InfoWindow({
      content: `
        <div style="
          padding: 12px 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-width: 180px;
        ">
          <div style="
            font-weight: 700;
            font-size: 15px;
            margin-bottom: 10px;
            color: #111827;
            letter-spacing: -0.01em;
          ">${label}</div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
          ">
            <span style="color: #6B7280; font-size: 13px; font-weight: 500;">Heat Intensity</span>
            <span style="color: #DC2626; font-size: 14px; font-weight: 700;">${liveHeat.avg.toFixed(1)}°C</span>
          </div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 6px;
            border-top: 1px solid #E5E7EB;
          ">
            <span style="color: #6B7280; font-size: 12px; font-weight: 500;">Category</span>
            <span style="
              color: #065F46;
              font-size: 12px;
              font-weight: 600;
              background: #D1FAE5;
              padding: 2px 8px;
              border-radius: 4px;
            ">${liveHeat.category}</span>
          </div>
        </div>
      `
    })
    heatInfoWindow.open(gmapRef.value, heatMarker)
  }

  // Handle vegetation map
  if (vegMapRef.value) {
    vegMapRef.value.setCenter(center)
    vegMapRef.value.setZoom(13)

    // Get vegetation percentage for this location
    const vegVal = findMapValue(label, vegTotalsMap) as number | undefined
    const vegPct = vegVal || 0

    // Determine vegetation status
    let vegStatus = 'Low'
    let vegColor = '#DC2626'
    let vegBg = '#FEE2E2'
    if (vegPct >= 40) {
      vegStatus = 'Excellent'
      vegColor = '#065F46'
      vegBg = '#D1FAE5'
    } else if (vegPct >= 30) {
      vegStatus = 'Good'
      vegColor = '#047857'
      vegBg = '#D1FAE5'
    } else if (vegPct >= 20) {
      vegStatus = 'Moderate'
      vegColor = '#D97706'
      vegBg = '#FEF3C7'
    } else if (vegPct >= 10) {
      vegStatus = 'Fair'
      vegColor = '#EA580C'
      vegBg = '#FFEDD5'
    }

    // Create new marker at search location with white pin
    const vegMarker = new (window as any).google.maps.Marker({
      position: center,
      map: vegMapRef.value,
      title: label,
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        strokeColor: '#065F46',
        strokeWeight: 3
      }
    })
    vegSearchMarker.value = vegMarker
    allMarkers.value.push(vegMarker)

    // Create and show info window for the searched location
    const vegInfoWindow = new (window as any).google.maps.InfoWindow({
      content: `
        <div style="
          padding: 12px 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-width: 180px;
        ">
          <div style="
            font-weight: 700;
            font-size: 15px;
            margin-bottom: 10px;
            color: #111827;
            letter-spacing: -0.01em;
          ">${label}</div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
          ">
            <span style="color: #6B7280; font-size: 13px; font-weight: 500;">Vegetation Coverage</span>
            <span style="color: #059669; font-size: 14px; font-weight: 700;">${vegPct.toFixed(1)}%</span>
          </div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 6px;
            border-top: 1px solid #E5E7EB;
          ">
            <span style="color: #6B7280; font-size: 12px; font-weight: 500;">Status</span>
            <span style="
              color: ${vegColor};
              font-size: 12px;
              font-weight: 600;
              background: ${vegBg};
              padding: 2px 8px;
              border-radius: 4px;
            ">${vegStatus}</span>
          </div>
        </div>
      `
    })
    vegInfoWindow.open(vegMapRef.value, vegMarker)
  }

  const heatRank = findMapValue(label, heatRankMap) as number | undefined
  const vegVal = findMapValue(label, vegTotalsMap) as number | undefined

  selectedSuburb.value = {
    label,
    center,
    layer: activeLayer.value,
    heat: liveHeat.avg,
    veg: vegVal,
    heatCategory: liveHeat.category,
    rank: heatRank
  }
}

// Map functions
function isVicGeocodeResult(r: any): boolean {
  try {
    const comps = r?.address_components || []
    return comps.some((c: any) => {
      const types: string[] = c?.types || []
      const isLvl1 = types.includes('administrative_area_level_1')
      const shortName = String(c?.short_name || '').toUpperCase()
      const longName = String(c?.long_name || '').toLowerCase()
      return isLvl1 && (shortName === 'VIC' || longName.includes('victoria'))
    })
  } catch {
    return false
  }
}

function getCenterMarkerIcon(google: any) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="30" height="44" viewBox="0 0 30 44">
  <defs>
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
  <ellipse cx="15" cy="42" rx="7" ry="2.2" fill="#000000" opacity="0.22"/>
  <g filter="url(#ds)">
    <path d="M15 2c-7.18 0-13 5.82-13 13 0 10.5 13 27 13 27s13-16.5 13-27c0-7.18-5.82-13-13-13z" fill="#065f46" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="15" cy="15" r="4" fill="#ffffff"/>
  </g>
</svg>`
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(28, 41),
    anchor: new google.maps.Point(14, 40),
  }
}

async function loadUhiDataOnce() {
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

    let totalHeat = 0
    let heatCount = 0
    let veryHotCounter = 0

    suburbs.forEach((s) => {
      if (s?.name) uhiByName[String(s.name)] = s

      const total = Number(s?.vegetation?.total)
      if (Number.isFinite(total)) {
        if (s?.id) vegTotalsMap[normKey(s.id)] = total
        if (s?.name) vegTotalsMap[normKey(s.name)] = total
      }

      const avgHeat = Number(s?.heat?.avg)
      if (Number.isFinite(avgHeat)) {
        totalHeat += avgHeat
        heatCount++
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

      // Count suburbs with "High Heat" category
      if (catKey.includes('high_heat')) veryHotCounter++
    })

    totalSuburbs.value = suburbs.length
    veryHotCount.value = veryHotCounter
    melbourneAvgHeat.value = heatCount > 0 ? totalHeat / heatCount : 0
  } catch (e) {
    console.error('Failed to load UHI data', e)
  }
}

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

function findMapValue<T = number | string>(label: string, map: Record<string, T>): T | undefined {
  const raw = String(label || '')
  const candidates: string[] = []
  const lower = raw.toLowerCase().trim()
  const cleaned = lower
    .replace(/,.*$/, '')
    .replace(/\b(\d{3,4})\b/g, '')
    .replace(/\b(australia|victoria|vic|state of victoria)\b/g, '')
    .replace(/\(|\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const firstWord = cleaned.split(' ')[0] || cleaned
  const lastWord = cleaned.split(' ').slice(-1)[0] || cleaned

  const push = (s?: string) => { if (s) candidates.push(normKey(s)) }
  push(raw)
  push(cleaned)
  push(firstWord)
  push(lastWord)

  for (const k of candidates) {
    if (map[k] != null) return map[k]
  }

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

async function initUhiOnMap() {
  try {
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
  if (!vegMapRef.value) return

  try {
    vegLegendHtml.value = '<div class="legend-title">Vegetation Coverage</div>' +
      ['0-10%','10-20%','20-30%','30-40%','40%+'].map((b, i) => `
        <div class="legend-row">
          <span class="legend-label">${b}</span>
          <span class="legend-swatch" style="background:${['#FFB84D','#FFE066','#90EE90','#4CBB17','#228B22'][i]}; width:18px; height:18px; display:inline-block; border-radius:3px; border:1px solid rgba(0,0,0,0.25); margin-left:auto;"></span>
        </div>
      `).join('')

    if (!Object.keys(vegTotalsMap).length) {
      const pre = getUhiData()
      if (pre && Array.isArray((pre as any).suburbs)) {
        const suburbs: Array<any> = (pre as any).suburbs
        suburbs.forEach((s) => {
          const total = Number(s?.vegetation?.total)
          if (Number.isFinite(total)) {
            if (s?.id) vegTotalsMap[normKey(s.id)] = total
            if (s?.name) vegTotalsMap[normKey(s.name)] = total
          }
        })
      }
    }

    await loadVegetationLayer(true)
    if (!vegMapRef.value._zoomListenerAdded) {
      vegMapRef.value.addListener('zoom_changed', async () => {
        const z = vegMapRef.value!.getZoom()
        const wantSimplified = !(z >= 12)
        await loadVegetationLayer(wantSimplified)
      })
      vegMapRef.value._zoomListenerAdded = true
    }
  } catch (err) {
    console.error('Vegetation init failed', err)
  }
}

function vegStyleFeature(feature: any) {
  const sid = feature.getProperty('SUBURB_ID') || feature.getProperty('id')
  const sname = feature.getProperty('SUBURB_NAME') || feature.getProperty('name')
  const keyId = normKey(sid)
  const keyName = normKey(sname)
  const pct = (vegTotalsMap[keyId] ?? vegTotalsMap[keyName] ?? 0) as number
  // Better color differentiation: Orange -> Yellow -> Light Green -> Medium Green -> Dark Green
  const color = pct >= 40 ? '#228B22' : pct >= 30 ? '#4CBB17' : pct >= 20 ? '#90EE90' : pct >= 10 ? '#FFE066' : '#FFB84D'
  return {
    fillColor: color,
    fillOpacity: 0.5,
    strokeWeight: 0.8,
    strokeOpacity: 0.8,
    strokeColor: '#ffffff',
  }
}

async function loadVegetationLayer(simplified: boolean) {
  if (!vegMapRef.value) return

  if (vegMapRef.value.data) {
    const toRemove: any[] = []
    vegMapRef.value.data.forEach((f: any) => toRemove.push(f))
    toRemove.forEach((f: any) => vegMapRef.value.data.remove(f))
  }

  try {
    const pre = getBoundaryGeo(simplified)
    const geo = pre || (await (async () => {
      const resp = await fetch(uhiUrl(`/api/v1/uhi/boundaries?simplified=${simplified ? 'true' : 'false'}`))
      if (!resp.ok) return {} as any
      const { url } = await resp.json()
      return await fetch(url).then(r => r.json())
    })())

    vegMapRef.value.data.addGeoJson(geo)
    vegMapRef.value.data.setStyle(vegStyleFeature)

    // Add hover mechanics for vegetation layer
    const vegInfowindow = new (window as any).google.maps.InfoWindow()
    vegMapRef.value.data.addListener('mouseover', (e: any) => {
      const name = e.feature.getProperty('SUBURB_NAME') || ''
      const sid = e.feature.getProperty('SUBURB_ID') || e.feature.getProperty('id')
      const sname = e.feature.getProperty('SUBURB_NAME') || e.feature.getProperty('name')
      const keyId = normKey(sid)
      const keyName = normKey(sname)
      const vegPct = (vegTotalsMap[keyId] ?? vegTotalsMap[keyName] ?? 0) as number

      // Determine vegetation status based on percentage
      let vegStatus = 'Low'
      let vegColor = '#DC2626'
      let vegBg = '#FEE2E2'
      if (vegPct >= 40) {
        vegStatus = 'Excellent'
        vegColor = '#065F46'
        vegBg = '#D1FAE5'
      } else if (vegPct >= 30) {
        vegStatus = 'Good'
        vegColor = '#047857'
        vegBg = '#D1FAE5'
      } else if (vegPct >= 20) {
        vegStatus = 'Moderate'
        vegColor = '#D97706'
        vegBg = '#FEF3C7'
      } else if (vegPct >= 10) {
        vegStatus = 'Fair'
        vegColor = '#EA580C'
        vegBg = '#FFEDD5'
      }

      vegInfowindow.setContent(`
        <div style="
          padding: 12px 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-width: 180px;
        ">
          <div style="
            font-weight: 700;
            font-size: 15px;
            margin-bottom: 10px;
            color: #111827;
            letter-spacing: -0.01em;
          ">${name}</div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
          ">
            <span style="color: #6B7280; font-size: 13px; font-weight: 500;">Vegetation Coverage</span>
            <span style="color: #059669; font-size: 14px; font-weight: 700;">${vegPct.toFixed(1)}%</span>
          </div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 6px;
            border-top: 1px solid #E5E7EB;
          ">
            <span style="color: #6B7280; font-size: 12px; font-weight: 500;">Status</span>
            <span style="
              color: ${vegColor};
              font-size: 12px;
              font-weight: 600;
              background: ${vegBg};
              padding: 2px 8px;
              border-radius: 4px;
            ">${vegStatus}</span>
          </div>
        </div>
      `)
      vegInfowindow.setPosition(e.latLng)
      vegInfowindow.open(vegMapRef.value)
    })
    vegMapRef.value.data.addListener('mouseout', () => {
      vegInfowindow.close()
    })

    // Add click listener to update marker and show info
    vegMapRef.value.data.addListener('click', (e: any) => {
      const name = e.feature.getProperty('SUBURB_NAME') || ''
      const sid = e.feature.getProperty('SUBURB_ID') || e.feature.getProperty('id')
      const sname = e.feature.getProperty('SUBURB_NAME') || e.feature.getProperty('name')
      const keyId = normKey(sid)
      const keyName = normKey(sname)
      const vegPct = (vegTotalsMap[keyId] ?? vegTotalsMap[keyName] ?? 0) as number
      const clickedLatLng = e.latLng

      // Determine vegetation status
      let vegStatus = 'Low'
      let vegColor = '#DC2626'
      let vegBg = '#FEE2E2'
      if (vegPct >= 40) {
        vegStatus = 'Excellent'
        vegColor = '#065F46'
        vegBg = '#D1FAE5'
      } else if (vegPct >= 30) {
        vegStatus = 'Good'
        vegColor = '#047857'
        vegBg = '#D1FAE5'
      } else if (vegPct >= 20) {
        vegStatus = 'Moderate'
        vegColor = '#D97706'
        vegBg = '#FEF3C7'
      } else if (vegPct >= 10) {
        vegStatus = 'Fair'
        vegColor = '#EA580C'
        vegBg = '#FFEDD5'
      }

      // Clear existing markers
      const markersToRemove = [...allMarkers.value]
      markersToRemove.forEach((marker) => {
        try {
          if (marker && typeof marker.setMap === 'function') {
            marker.setVisible(false)
            marker.setMap(null)
          }
        } catch (err) {
          console.error('Error removing marker:', err)
        }
      })
      if (vegSearchMarker.value) {
        try {
          vegSearchMarker.value.setVisible(false)
          vegSearchMarker.value.setMap(null)
        } catch (err) {}
      }
      vegSearchMarker.value = null
      allMarkers.value = []

      // Create new marker at clicked location
      const newMarker = new (window as any).google.maps.Marker({
        position: clickedLatLng,
        map: vegMapRef.value,
        title: name,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#FFFFFF',
          fillOpacity: 1,
          strokeColor: '#065F46',
          strokeWeight: 3
        }
      })
      vegSearchMarker.value = newMarker
      allMarkers.value.push(newMarker)

      // Show info window at marker
      const clickInfoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="
            padding: 12px 14px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-width: 180px;
          ">
            <div style="
              font-weight: 700;
              font-size: 15px;
              margin-bottom: 10px;
              color: #111827;
              letter-spacing: -0.01em;
            ">${name}</div>
            <div style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 6px;
            ">
              <span style="color: #6B7280; font-size: 13px; font-weight: 500;">Vegetation Coverage</span>
              <span style="color: #059669; font-size: 14px; font-weight: 700;">${vegPct.toFixed(1)}%</span>
            </div>
            <div style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-top: 6px;
              border-top: 1px solid #E5E7EB;
            ">
              <span style="color: #6B7280; font-size: 12px; font-weight: 500;">Status</span>
              <span style="
                color: ${vegColor};
                font-size: 12px;
                font-weight: 600;
                background: ${vegBg};
                padding: 2px 8px;
                border-radius: 4px;
              ">${vegStatus}</span>
            </div>
          </div>
        `
      })
      clickInfoWindow.open(vegMapRef.value, newMarker)

      // Center map on clicked location
      vegMapRef.value.panTo(clickedLatLng)

      // Get heat data for this location
      const liveHeat = getHeatAtLatLng(clickedLatLng.lat(), clickedLatLng.lng())
      const heatRank = findMapValue(name, heatRankMap) as number | undefined

      // Update selected suburb data
      selectedSuburb.value = {
        label: name,
        center: { lat: clickedLatLng.lat(), lng: clickedLatLng.lng() },
        layer: 'veg',
        heat: liveHeat.avg,
        veg: vegPct,
        heatCategory: liveHeat.category,
        rank: heatRank
      }
    })
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

  const pre = getBoundaryGeo(simplified)
  const geo = pre || (await (async () => {
    const resp = await fetch(uhiUrl(`/api/v1/uhi/boundaries?simplified=${simplified ? 'true' : 'false'}`))
    const { url } = await resp.json()
    return await fetch(url).then(r => r.json())
  })())

  gmapRef.value!.data.addGeoJson(geo)
  gmapRef.value!.data.setStyle(styleFeature)

  const infowindow = new (window as any).google.maps.InfoWindow()
  gmapRef.value!.data.addListener('mouseover', (e: any) => {
    const name = e.feature.getProperty('SUBURB_NAME') || ''
    const avg = e.feature.getProperty('AVG_HEAT')
    const cat = e.feature.getProperty('HEAT_CATEGORY')
    infowindow.setContent(`
      <div style="
        padding: 12px 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        min-width: 180px;
      ">
        <div style="
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 10px;
          color: #111827;
          letter-spacing: -0.01em;
        ">${name}</div>
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        ">
          <span style="color: #6B7280; font-size: 13px; font-weight: 500;">Heat Intensity</span>
          <span style="color: #DC2626; font-size: 14px; font-weight: 700;">${avg?.toFixed ? avg.toFixed(1) : avg}°C</span>
        </div>
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 6px;
          border-top: 1px solid #E5E7EB;
        ">
          <span style="color: #6B7280; font-size: 12px; font-weight: 500;">Category</span>
          <span style="
            color: #065F46;
            font-size: 12px;
            font-weight: 600;
            background: #D1FAE5;
            padding: 2px 8px;
            border-radius: 4px;
          ">${cat}</span>
        </div>
      </div>
    `)
    infowindow.setPosition(e.latLng)
    infowindow.open(gmapRef.value)
  })
  gmapRef.value!.data.addListener('mouseout', () => {
    infowindow.close()
  })

  // Add click listener to update marker and show info
  gmapRef.value!.data.addListener('click', (e: any) => {
    const name = e.feature.getProperty('SUBURB_NAME') || ''
    const avg = e.feature.getProperty('AVG_HEAT')
    const cat = e.feature.getProperty('HEAT_CATEGORY')
    const clickedLatLng = e.latLng

    // Clear existing markers
    const markersToRemove = [...allMarkers.value]
    markersToRemove.forEach((marker) => {
      try {
        if (marker && typeof marker.setMap === 'function') {
          marker.setVisible(false)
          marker.setMap(null)
        }
      } catch (err) {
        console.error('Error removing marker:', err)
      }
    })
    if (searchMarker.value) {
      try {
        searchMarker.value.setVisible(false)
        searchMarker.value.setMap(null)
      } catch (err) {}
    }
    searchMarker.value = null
    allMarkers.value = []

    // Create new marker at clicked location
    const newMarker = new (window as any).google.maps.Marker({
      position: clickedLatLng,
      map: gmapRef.value,
      title: name,
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        strokeColor: '#065F46',
        strokeWeight: 3
      }
    })
    searchMarker.value = newMarker
    allMarkers.value.push(newMarker)

    // Show info window at marker
    const clickInfoWindow = new (window as any).google.maps.InfoWindow({
      content: `
        <div style="
          padding: 12px 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          min-width: 180px;
        ">
          <div style="
            font-weight: 700;
            font-size: 15px;
            margin-bottom: 10px;
            color: #111827;
            letter-spacing: -0.01em;
          ">${name}</div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
          ">
            <span style="color: #6B7280; font-size: 13px; font-weight: 500;">Heat Intensity</span>
            <span style="color: #DC2626; font-size: 14px; font-weight: 700;">${avg?.toFixed ? avg.toFixed(1) : avg}°C</span>
          </div>
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 6px;
            border-top: 1px solid #E5E7EB;
          ">
            <span style="color: #6B7280; font-size: 12px; font-weight: 500;">Category</span>
            <span style="
              color: #065F46;
              font-size: 12px;
              font-weight: 600;
              background: #D1FAE5;
              padding: 2px 8px;
              border-radius: 4px;
            ">${cat}</span>
          </div>
        </div>
      `
    })
    clickInfoWindow.open(gmapRef.value, newMarker)

    // Center map on clicked location
    gmapRef.value.panTo(clickedLatLng)

    // Update selected suburb data
    const heatRank = findMapValue(name, heatRankMap) as number | undefined
    const vegVal = findMapValue(name, vegTotalsMap) as number | undefined
    selectedSuburb.value = {
      label: name,
      center: { lat: clickedLatLng.lat(), lng: clickedLatLng.lng() },
      layer: 'heat',
      heat: avg,
      veg: vegVal,
      heatCategory: cat,
      rank: heatRank
    }
  })

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
      <div class="legend-row">
        <span class="legend-label">${v.label}${range}</span>
        <span style="background:${v.color}; width:18px; height:18px; display:inline-block; border-radius:3px; border:1px solid rgba(0,0,0,0.25); margin-left:auto;"></span>
      </div>
    `
    }),
  ].join('')
  legendHtml.value = html
}

async function buildCharts() {
  try {
    // Use cached data if available, otherwise fetch
    let payload = getUhiData()
    if (!payload) {
      const resp = await fetch(uhiUrl('/api/v1/uhi/data'))
      if (!resp.ok) return
      payload = await resp.json()
    }
    const suburbs: Array<any> = Array.isArray(payload?.suburbs) ? payload.suburbs : []
    const metaCats = payload?.heat_categories || categoriesMap || {}

    // Heat categories
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

    // Vegetation buckets
    const buckets = [
      { name: '0-10', min: 0, max: 10, color: '#FFB84D' },
      { name: '10-20', min: 10, max: 20, color: '#FFE066' },
      { name: '20-30', min: 20, max: 30, color: '#90EE90' },
      { name: '30-40', min: 30, max: 40, color: '#4CBB17' },
      { name: '40+', min: 40, max: 1000, color: '#228B22' },
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

    // Top lists
    const byHeat = suburbs
      .map((s: any) => ({ name: String(s?.name || s?.id || ''), heat: Number(s?.heat?.avg ?? s?.heat?.intensity) }))
      .filter(x => x.name && Number.isFinite(x.heat))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 5)
    const hMax = byHeat[0]?.heat || 1
    topHotRows.value = byHeat.map(x => ({ ...x, percent: Math.round((x.heat / hMax) * 100) }))

    // Coolest suburbs (sorted by lowest heat)
    const byCool = suburbs
      .map((s: any) => ({ name: String(s?.name || s?.id || ''), heat: Number(s?.heat?.avg ?? s?.heat?.intensity) }))
      .filter(x => x.name && Number.isFinite(x.heat))
      .sort((a, b) => a.heat - b.heat)
      .slice(0, 5)
    const cMax = byCool[0]?.heat || 1
    topCoolRows.value = byCool.map(x => ({ ...x, percent: Math.round((x.heat / cMax) * 100) }))

    const byVeg = suburbs
      .map((s: any) => ({ name: String(s?.name || s?.id || ''), veg: Number(s?.vegetation?.total) }))
      .filter(x => x.name && Number.isFinite(x.veg))
      .sort((a, b) => b.veg - a.veg)
      .slice(0, 5)
    const vMax = byVeg[0]?.veg || 1
    topGreenRows.value = byVeg.map(x => ({ ...x, percent: Math.round((x.veg / vMax) * 100) }))

    // Correlation
    const pairs = suburbs
      .map((s: any) => ({
        x: Number(s?.vegetation?.total),
        y: Number(s?.heat?.avg ?? s?.heat?.intensity),
        color: ((metaCats || {})[String(s?.heat?.category || '').toLowerCase().replace(/\s+/g, '_')]?.color) || '#9ca3af'
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
    }
  } catch {
    console.error('Chart building failed')
  }
}

onMounted(async () => {
  try {
    // Start loading Google Maps and data in parallel
    const [googleMaps] = await Promise.all([
      loadGoogleMaps(),
      loadUhiDataOnce(), // Pre-load data while maps are loading
      loadSuburbs() // Load suburbs in parallel
    ])

    const center = { lat: -37.8136, lng: 144.9631 }

    // Initialize both maps immediately
    gmapRef.value = new (window as any).google.maps.Map(document.getElementById('gmap') as HTMLElement, {
      center,
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    const vegEl = document.getElementById('vegmap')
    if (vegEl && !vegMapRef.value) {
      vegMapRef.value = new (window as any).google.maps.Map(vegEl as HTMLElement, {
        center,
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
    }

    // Show UI immediately, then load map layers in parallel
    isLoading.value = false
    await nextTick()

    // Initialize map layers and build charts in parallel (non-blocking)
    Promise.all([
      initUhiOnMap(),
      vegMapRef.value ? initVegetationMap() : Promise.resolve(),
      buildCharts() // Build charts in parallel with map initialization
    ]).then(() => {
      // Render charts after data is ready
      nextTick(() => {
        renderCharts()
      })
    })

    // Setup scroll animations immediately
    setupScrollAnimations()
  } catch (e) {
    console.error('Dashboard initialization failed', e)
    isLoading.value = false
  }
})

function renderCharts() {
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
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
              tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.raw} suburbs` } }
            },
            cutout: '65%',
            responsive: true,
            maintainAspectRatio: true,
          }
        })
      }

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
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
              tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.raw} suburbs` } }
            },
            cutout: '65%',
            responsive: true,
            maintainAspectRatio: true,
          }
        })
      }

      const scatter = document.getElementById('heat-veg-scatter') as HTMLCanvasElement | null
      if (scatter && scatterPairs.value.length) {
        new Chart(scatter.getContext('2d')!, {
          type: 'scatter',
          data: {
            datasets: [{
              label: 'Melbourne Suburbs',
              data: scatterPairs.value.map(p => ({ x: p.x, y: p.y })),
              pointRadius: 4,
              pointBackgroundColor: scatterPairs.value.map(p => p.color),
              pointBorderColor: '#ffffff',
              pointBorderWidth: 1
            }]
          },
          options: {
            scales: {
              x: {
                title: { display: true, text: 'Vegetation Coverage (%)', font: { size: 13, weight: 'bold' } },
                grid: { color: 'rgba(0,0,0,0.05)' }
              },
              y: {
                title: { display: true, text: 'Temperature (°C)', font: { size: 13, weight: 'bold' } },
                grid: { color: 'rgba(0,0,0,0.05)' }
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx: any) => `${ctx.parsed.x.toFixed(1)}% vegetation, ${ctx.parsed.y.toFixed(1)}°C`
                }
              }
            },
            responsive: true,
            maintainAspectRatio: true,
          }
        })
      }
  } catch (e) {
    console.error('Chart rendering failed', e)
  }
}

function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
      }
    })
  }, observerOptions)

  const sections = [
    heroSection.value,
    snapshotSection.value,
    mapSection.value,
    patternSection.value,
    impactSection.value,
    chartsSection.value,
    solutionSection.value,
    ctaSection.value,
    referencesSection.value
  ].filter(Boolean)

  sections.forEach(section => {
    if (section) observer.observe(section)
  })
}
</script>

<style scoped>
/* Base Styles */
.dashboard {
  min-height: 100vh;
  background: #000;
  position: relative;
  overflow-x: hidden;
}

.page-bg {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  filter: brightness(0.7);
}

/* Hero Section */
.hero-section {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 1s ease, transform 1s ease;
}

.hero-section.visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-content {
  max-width: 900px;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  color: white;
  margin-bottom: 1.5rem;
  text-shadow: 0 4px 12px rgba(0,0,0,0.5);
  line-height: 1.1;
}

.hero-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  color: rgba(255,255,255,0.95);
  margin-bottom: 3rem;
  line-height: 1.8;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.hero-subtitle strong {
  color: #FCA5A5;
  font-weight: 700;
}

.scroll-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255,255,255,0.7);
  font-size: 0.9rem;
  animation: bounce 2s infinite;
}

.scroll-indicator svg {
  width: 24px;
  height: 24px;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

/* Data Snapshot Section */
.data-snapshot {
  position: relative;
  z-index: 1;
  padding: 4rem 2rem;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.data-snapshot.visible {
  opacity: 1;
  transform: translateY(0);
}

.snapshot-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.stat-card {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(0,0,0,0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: #EF4444;
}

.stat-icon svg {
  width: 100%;
  height: 100%;
}

.stat-number {
  font-size: 3rem;
  font-weight: 800;
  color: #1F2937;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.stat-label {
  font-size: 1rem;
  color: #6B7280;
  line-height: 1.5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

/* Section Styles */
section {
  position: relative;
  z-index: 1;
  padding: 6rem 2rem;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

section.visible {
  opacity: 1;
  transform: translateY(0);
}

.section-container {
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  margin-bottom: 3rem;
}

.section-header.centered {
  text-align: center;
}

.section-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.section-subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: rgba(255,255,255,0.85);
  line-height: 1.7;
  max-width: 800px;
  margin: 0 auto;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

/* Map Section */
.map-section {
  background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%);
}

.map-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  align-items: start;
}

.map-area {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.map-toolbar {
  margin-bottom: 1rem;
}

.map-search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 10px;
  font-size: 15px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.map-search-input:focus {
  outline: none;
  border-color: #065F46;
  box-shadow: 0 0 0 3px rgba(6,95,70,0.1);
}

.search-container {
  position: relative;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #E5E7EB;
  border-top: none;
  border-radius: 0 0 10px 10px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.autocomplete-item {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #F3F4F6;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover {
  background-color: #F3F4F6;
}

.suburb-name {
  font-weight: 500;
  color: #1F2937;
}

.suburb-postcode {
  font-size: 14px;
  color: #6B7280;
  margin-left: 8px;
}

.inline-error {
  margin-top: 0.5rem;
  padding: 8px 12px;
  background: #FEE2E2;
  border: 1px solid #FECACA;
  border-radius: 6px;
  color: #B91C1C;
  font-size: 13px;
}

.map-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.layer-toggle {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 10px;
  background: #F9FAFB;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #6B7280;
}

.layer-toggle:has(input:checked) {
  background: #ECFDF5;
  border-color: #065F46;
  color: #065F46;
}

.layer-toggle input {
  margin: 0;
}

.map-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}

.map {
  width: 100%;
  height: 600px;
  border-radius: 12px;
}

.uhi-legend {
  position: absolute;
  left: 16px;
  bottom: 16px;
  background: white;
  padding: 12px 16px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-size: 12px;
  min-width: 180px;
}

.legend-title {
  font-weight: 800;
  color: #065F46;
  margin-bottom: 12px;
  font-size: 14px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.legend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0;
  padding: 2px 0;
}

.legend-label {
  color: #374151;
  font-size: 12px;
  font-weight: 500;
  flex: 1;
}

.legend-swatch {
  flex-shrink: 0;
  margin-left: auto;
}

/* Info Panel */
.info-panel {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  position: sticky;
  top: 2rem;
}

.panel-content {
  margin-bottom: 2rem;
}

.suburb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #F3F4F6;
}

.suburb-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}

.heat-badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.heat-badge.very-hot {
  background: #FEE2E2;
  color: #991B1B;
}

.heat-badge.hot {
  background: #FED7AA;
  color: #9A3412;
}

.heat-badge.moderate {
  background: #FEF3C7;
  color: #92400E;
}

.heat-badge.cool {
  background: #D1FAE5;
  color: #065F46;
}

.suburb-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.stat-row.comparison {
  border-top: 2px solid #F3F4F6;
  margin-top: 0.5rem;
  padding-top: 1rem;
}

.stat-label {
  font-size: 14px;
  color: #6B7280;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #1F2937;
}

.stat-value.heat {
  color: #DC2626;
}

.stat-value.veg {
  color: #059669;
}

.stat-value.cool {
  color: #059669;
}

.action-btn {
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn.primary {
  background: #065F46;
  color: white;
}

.action-btn.primary:hover {
  background: #047857;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6,95,70,0.3);
}

.panel-placeholder {
  text-align: center;
  padding: 3rem 1rem;
  color: #9CA3AF;
}

.panel-placeholder svg {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  opacity: 0.5;
}

.panel-placeholder p {
  font-size: 14px;
  line-height: 1.6;
}

.quick-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 2px solid #F3F4F6;
}

.quick-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.quick-stat-item.hot {
  background: linear-gradient(90deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%);
  border-left: 3px solid #EF4444;
}

.quick-stat-item.cool {
  background: linear-gradient(90deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%);
  border-left: 3px solid #3B82F6;
}

.quick-stat-item.green {
  background: linear-gradient(90deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%);
  border-left: 3px solid #22C55E;
}

.quick-stat-item .label {
  color: #6B7280;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quick-stat-item .value-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.quick-stat-item .value {
  color: #1F2937;
  font-weight: 700;
  font-size: 13px;
}

.quick-stat-item .metric {
  font-size: 12px;
  font-weight: 600;
}

.quick-stat-item.hot .metric {
  color: #EF4444;
}

.quick-stat-item.cool .metric {
  color: #3B82F6;
}

.quick-stat-item.green .metric {
  color: #22C55E;
}

/* Pattern Section */
.pattern-section {
  background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(16,185,129,0.1) 100%);
}

.pattern-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 3rem;
  align-items: center;
}

.chart-area {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.scatter-chart {
  max-height: 500px;
}

.pattern-insights {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.insight-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  display: flex;
  gap: 1rem;
  transition: transform 0.3s ease;
}

.insight-card:hover {
  transform: translateX(4px);
}

.insight-card.highlight {
  background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
  border: 2px solid #059669;
}

.insight-icon {
  font-size: 2rem;
  line-height: 1;
}

.insight-text strong {
  display: block;
  color: #1F2937;
  font-size: 16px;
  margin-bottom: 0.5rem;
}

.insight-text p {
  color: #6B7280;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Impact Section */
.impact-section {
  background: rgba(0,0,0,0.6);
}

.impact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.impact-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
}

.impact-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.15);
}

.impact-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.impact-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 1rem;
}

.impact-stat {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.3;
  margin-bottom: 0.75rem;
}

.impact-card.health .impact-stat {
  color: #DC2626;
}

.impact-card.economy .impact-stat {
  color: #D97706;
}

.impact-card.environment .impact-stat {
  color: #059669;
}

.impact-description {
  color: #6B7280;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* Charts Section */
.charts-section {
  background: rgba(255,255,255,0.05);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.chart-column {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.chart-header {
  margin-bottom: 1.5rem;
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 0.75rem;
}

.chart-narrative {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.6;
}

.chart-body {
  position: relative;
}

.chart-canvas {
  max-height: 280px;
}

.bar-chart-rows {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bar-row {
  display: grid;
  grid-template-columns: 32px 140px 1fr 80px;
  align-items: center;
  gap: 12px;
}

.bar-rank {
  font-size: 18px;
  font-weight: 700;
  color: #9CA3AF;
  text-align: center;
}

.bar-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.bar-container {
  height: 24px;
  background: #F3F4F6;
  border-radius: 6px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.6s ease;
}

.bar-fill.heat {
  background: linear-gradient(90deg, #EF4444 0%, #DC2626 100%);
}

.bar-fill.veg {
  background: linear-gradient(90deg, #10B981 0%, #059669 100%);
}

.bar-value {
  font-size: 14px;
  font-weight: 700;
  color: #1F2937;
  text-align: right;
}

/* Solution Section */
.solution-section {
  background: linear-gradient(180deg, rgba(6,95,70,0.1) 0%, rgba(16,185,129,0.05) 100%);
}

.solution-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 4rem;
  align-items: center;
}

.solution-text .section-title {
  text-align: left;
  margin-bottom: 1.5rem;
}

.solution-description {
  font-size: 1.25rem;
  color: rgba(255,255,255,0.9);
  line-height: 1.8;
  margin-bottom: 2rem;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.solution-points {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.solution-point {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  color: rgba(255,255,255,0.9);
  font-size: 16px;
  line-height: 1.6;
}

.solution-point svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: #10B981;
  margin-top: 2px;
}

.solution-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.thermometer-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.2);
}

.thermometer-content {
  text-align: center;
}

.temp-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.temp-before,
.temp-after {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  min-width: 180px;
}

.temp-before {
  background: linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.1) 100%);
  border: 2px solid rgba(239,68,68,0.3);
}

.temp-after {
  background: linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.1) 100%);
  border: 2px solid rgba(34,197,94,0.3);
}

.temp-icon {
  font-size: 3rem;
  line-height: 1;
}

.temp-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.temp-label {
  font-size: 14px;
  color: rgba(255,255,255,0.9);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.temp-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255,255,255,0.9);
}

.temp-arrow svg {
  width: 32px;
  height: 32px;
  opacity: 0.8;
  animation: bounce-arrow 2s infinite;
}

.temp-arrow span {
  font-size: 16px;
  font-weight: 700;
  padding: 6px 16px;
  background: rgba(255,255,255,0.2);
  border-radius: 20px;
  backdrop-filter: blur(5px);
}

@keyframes bounce-arrow {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(8px); }
  60% { transform: translateY(4px); }
}

.thermometer-caption {
  color: rgba(255,255,255,0.9);
  font-size: 14px;
  font-style: italic;
  line-height: 1.6;
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, rgba(6,95,70,0.9) 0%, rgba(16,185,129,0.8) 100%);
  padding: 8rem 2rem 0 2rem;
  position: relative;
  z-index: 1;
}

.cta-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 8rem;
}

.cta-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
}

.cta-subtitle {
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: rgba(255,255,255,0.95);
  line-height: 1.8;
  margin-bottom: 3rem;
}

.cta-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
  margin: 0 auto;
}

.cta-btn {
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.cta-btn svg {
  width: 20px;
  height: 20px;
}

.cta-btn.primary {
  background: white;
  color: #065F46;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.cta-btn.primary:hover {
  background: #F9FAFB;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

.cta-btn.secondary {
  background: rgba(255,255,255,0.15);
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
}

.cta-btn.secondary:hover {
  background: rgba(255,255,255,0.25);
  border-color: rgba(255,255,255,0.5);
  transform: translateY(-2px);
}

.cta-btn.tertiary {
  background: transparent;
  color: rgba(255,255,255,0.9);
  border: 2px solid rgba(255,255,255,0.2);
}

.cta-btn.tertiary:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.4);
}

/* Footnotes */
.footnote-ref {
  font-size: 0.7em;
  vertical-align: super;
  color: #059669;
  font-weight: 600;
  margin-left: 2px;
  cursor: help;
}

/* References Section */
.references-section {
  background: linear-gradient(180deg, rgba(6,95,70,0.9) 0%, rgba(6,95,70,0.95) 100%);
  padding: 4rem 2rem 6rem 2rem;
  position: relative;
  z-index: 100;
  margin-top: 0;
}

.references-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(255,255,255,0.2);
}

.references-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1000px;
}

.reference-item {
  display: flex;
  gap: 1rem;
  color: rgba(255,255,255,0.9);
  font-size: 14px;
  line-height: 1.7;
}

.reference-number {
  flex-shrink: 0;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
}

.reference-text {
  flex: 1;
}

.reference-text a {
  color: #A7F3D0;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.reference-text a:hover {
  color: #D1FAE5;
  border-bottom-color: #D1FAE5;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .map-layout {
    grid-template-columns: 1fr;
  }

  .info-panel {
    position: static;
  }

  .pattern-content,
  .solution-content {
    grid-template-columns: 1fr;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  section {
    padding: 4rem 1.5rem;
  }

  .snapshot-container {
    grid-template-columns: 1fr;
  }

  .bar-row {
    grid-template-columns: 28px 110px 1fr 70px;
    gap: 8px;
  }

  .bar-label {
    font-size: 13px;
  }

  .impact-grid {
    grid-template-columns: 1fr;
  }
}

/* Hide Google Maps default UI elements */
:deep(.gm-ui-hover-effect) {
  display: none !important;
}

:deep(.gm-style-iw-c) {
  border-radius: 8px !important;
}

:deep(.gm-style-iw-d) {
  overflow: hidden !important;
}
</style>
