<template>
  <div class="guides-page">
    <div class="guides-bg"></div>

    <!-- Top Section: Centered Big Title -->
    <div class="top-section">
      <div class="container-xl">
        <div class="page-header">
          <h1 class="page-title">Climate Gardening Guides</h1>
          <p class="page-subtitle">Learn how to grow smarter for your climate</p>
        </div>
      </div>
    </div>

    <!-- Content Section with Search -->
    <div class="content-section">
      <div class="container-xl">
        <div class="content-panel">
          <!-- Search Bar -->
          <div class="search-bar">
            <div class="search-input-group">
              <input
                type="text"
                class="form-control search-input"
                placeholder="Search guides..."
                v-model="searchQuery"
                @input="handleSearch"
              >
            </div>
          </div>

          <div class="content-card">
            <p class="placeholder-text">Guides page content will be implemented here...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')
const handleSearch = () => {
  // TODO: hook into guides filtering when data is available
}
</script>

<style scoped>
.guides-page {
  min-height: 100vh;
  position: relative;
  background: transparent !important;
}

.guides-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('@/assets/photo/plant-1.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  z-index: -1;
  pointer-events: none;
  filter: brightness(0.9);
}

.top-section {
  background: transparent;
  border-bottom: 0;
  padding: 2rem 0;
  margin-top: 20px;
  position: relative;
  z-index: 1;
  width: 100%;
}

.page-header {
  text-align: center;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 2rem;
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 0;
}

.content-section { padding-top: 1rem; }

.content-panel {
  padding: 1.5rem 0;
  background: transparent;
  min-height: calc(100vh - 200px);
}

.search-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.search-input-group { flex: 1; max-width: 600px; }
.search-input {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.2s ease;
}
.search-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  outline: none;
}

.content-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.placeholder-text {
  color: #1c3d21;
  font-size: 1rem;
}
</style>
