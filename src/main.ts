import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { usePlantsStore } from '@/stores/plants'
import { useGuidesStore } from '@/stores/guides'

// Import Bootstrap CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Import markdown styles
import './assets/markdown-styles.css'

import App from './App.vue'
import router from './router'
import { ensureGoogleMapsLoaded } from '@/services/gmapsLoader'
import { preloadUhiAll } from '@/services/uhiPreload'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Load developer utilities in dev only (side-effect import to expose window helpers)
if (import.meta.env.DEV) {
  import('@/utils/missingImages')
}

// Kick off preload but do not block mounting (store itself avoids duplicate work)
const plantsStore = usePlantsStore(pinia)
plantsStore.ensureLoaded()

// Preload Dashboard assets in background
preloadUhiAll().catch(() => {})

const guidesStore = useGuidesStore(pinia)
guidesStore.ensureLoaded()

app.mount('#app')

// Preload Google Maps script in background (non-blocking)
ensureGoogleMapsLoaded().catch(() => {
  // Fail silently; page features that need Maps will attempt again
})
