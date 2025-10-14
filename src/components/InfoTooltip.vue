<template>
  <div class="info-tooltip-wrapper">
    <button
      class="info-icon"
      @click="toggleTooltip"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
      :aria-label="ariaLabel"
      type="button"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
    </button>

    <Transition name="tooltip-fade">
      <div
        v-if="isVisible"
        class="tooltip-content"
        :class="[position]"
        role="tooltip"
      >
        <div class="tooltip-title" v-if="title">{{ title }}</div>
        <div class="tooltip-text">{{ text }}</div>
        <div class="tooltip-arrow"></div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title?: string
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  ariaLabel: 'More information'
})

const isVisible = ref(false)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

const showTooltip = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  isVisible.value = true
}

const hideTooltip = () => {
  hideTimeout = setTimeout(() => {
    isVisible.value = false
  }, 200)
}

const toggleTooltip = () => {
  isVisible.value = !isVisible.value
}
</script>

<style scoped>
.info-tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6B7280;
  transition: color 0.2s ease;
  padding: 0;
  vertical-align: middle;
}

.info-icon:hover,
.info-icon:focus {
  color: #065F46;
  outline: none;
}

.info-icon svg {
  width: 100%;
  height: 100%;
}

.tooltip-content {
  position: absolute;
  z-index: 1000;
  min-width: 200px;
  max-width: 320px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  pointer-events: none;
}

.tooltip-content.top {
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
}

.tooltip-content.bottom {
  top: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
}

.tooltip-content.left {
  right: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
}

.tooltip-content.right {
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
}

.tooltip-title {
  font-weight: 600;
  color: #065F46;
  margin-bottom: 4px;
  font-size: 14px;
}

.tooltip-text {
  color: #4B5563;
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.tooltip-content.top .tooltip-arrow {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px 6px 0 6px;
  border-color: white transparent transparent transparent;
}

.tooltip-content.bottom .tooltip-arrow {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-width: 0 6px 6px 6px;
  border-color: transparent transparent white transparent;
}

.tooltip-content.left .tooltip-arrow {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 0 6px 6px;
  border-color: transparent transparent transparent white;
}

.tooltip-content.right .tooltip-arrow {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 6px 6px 6px 0;
  border-color: transparent white transparent transparent;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

.tooltip-content.bottom.tooltip-fade-enter-from,
.tooltip-content.bottom.tooltip-fade-leave-to {
  transform: translateX(-50%) translateY(4px);
}

.tooltip-content.left.tooltip-fade-enter-from,
.tooltip-content.left.tooltip-fade-leave-to {
  transform: translateY(-50%) translateX(4px);
}

.tooltip-content.right.tooltip-fade-enter-from,
.tooltip-content.right.tooltip-fade-leave-to {
  transform: translateY(-50%) translateX(-4px);
}

@media (max-width: 768px) {
  .tooltip-content {
    max-width: 280px;
    font-size: 12px;
  }

  .info-icon {
    width: 16px;
    height: 16px;
  }
}
</style>
