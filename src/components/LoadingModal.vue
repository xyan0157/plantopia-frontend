<template>
  <div class="loading-overlay" role="dialog" aria-modal="true" aria-live="assertive">
    <div class="loading-card" @click.stop>
      <div class="spinner" aria-hidden="true"></div>
      <div class="loading-text">{{ message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(2px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  min-width: 260px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.35);
}
.spinner {
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  border: 3px solid #e5e7eb;
  border-top-color: #10b981;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
.loading-text { color: #065f46; font-weight: 700; }
</style>

