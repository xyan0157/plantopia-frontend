import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { usePlantsStore } from '@/stores/plants'

// Import Bootstrap CSS and JS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Import markdown styles
import './assets/markdown-styles.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Kick off preload but don't block mounting
const store = usePlantsStore(pinia)
store.ensureLoaded()

app.mount('#app')
