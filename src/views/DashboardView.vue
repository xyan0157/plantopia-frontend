<template>
  <div class="dashboard">
    <div class="page-container">
      <h1 class="page-title">Your Climate Impact Dashboard</h1>
      <div class="content-card">
        <div class="map-card-header">Your Location Map</div>
        <div id="gmap" class="map"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

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

onMounted(async () => {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAsxXNmYoU4g2C8QmY5BkDIHCNK-ihR5js'
  try {
    await loadGoogleMaps(apiKey)
    const center = { lat: -37.8136, lng: 144.9631 }
    const map = new (window as any).google.maps.Map(document.getElementById('gmap'), {
      center,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    new (window as any).google.maps.Marker({ position: center, map })
  } catch (e) {
    // fail silent to avoid breaking dashboard
  }
})
</script>

<style scoped>
.dashboard {
  min-height: calc(100vh - 64px);
  background: #f9fafb;
  padding: 2rem 0;
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

.map-card-header {
  font-weight: 700;
  color: #065f46;
  margin-bottom: 0.75rem;
}

.map {
  width: 100%;
  height: 420px;
  border-radius: 12px;
  overflow: hidden;
}

.placeholder-text {
  color: #6b7280;
  font-size: 1rem;
}
</style>
