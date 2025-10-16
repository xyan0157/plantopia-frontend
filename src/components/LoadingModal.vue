<template>
  <div class="loading-overlay" role="dialog" aria-modal="true" aria-live="assertive">
    <div class="loading-card" @click.stop>
      <div class="spinner" aria-hidden="true"></div>
      <div class="loading-content">
        <div class="loading-text">{{ displayMessage }}</div>
        <transition name="fade">
          <div v-if="showTip && currentTip" class="loading-tip">
            <svg class="tip-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
            </svg>
            {{ currentTip }}
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useLoadingMessages, type LoadingContext } from '@/composables/useLoadingMessages'

const props = defineProps<{
  message?: string
  context?: LoadingContext
}>()

const { currentMessage, currentTip, showTip, start, stop } = useLoadingMessages({
  context: props.context || 'general',
  interval: 4000,
  tipDelay: 3000
})

// Use the rotating message if context is provided, otherwise use the prop message
const displayMessage = computed(() => {
  return props.message || currentMessage.value
})

// Start the rotating messages when component mounts
onMounted(() => {
  if (!props.message) {
    start()
  }
})

// Watch for context changes
watch(() => props.context, () => {
  if (!props.message) {
    stop()
    start()
  }
})
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
  padding: 1.25rem 1.5rem;
  min-width: 320px;
  max-width: 480px;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.35);
}

.spinner {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  margin-top: 2px;
  border-radius: 9999px;
  border: 3px solid #e5e7eb;
  border-top-color: #10b981;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0); }
  to { transform: rotate(360deg); }
}

.loading-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.loading-text {
  color: #065f46;
  font-weight: 700;
  font-size: 15px;
  line-height: 1.4;
}

.loading-tip {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-left: 3px solid #10b981;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: #065f46;
}

.tip-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: #10b981;
  fill: #10b981;
}

/* Fade transition for tips */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Responsive design */
@media (max-width: 600px) {
  .loading-card {
    min-width: 280px;
    max-width: calc(100vw - 40px);
    padding: 1rem 1.25rem;
  }

  .loading-text {
    font-size: 14px;
  }

  .loading-tip {
    font-size: 12px;
    padding: 0.625rem;
  }

  .spinner {
    width: 28px;
    height: 28px;
  }
}
</style>

