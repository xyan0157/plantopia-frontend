<template>
  <div class="plant-card-requirements">
    <div class="requirement-item">
      <span class="requirement-label">SUN:</span>
      <div class="requirement-icons tooltip-container" :title="getSunlightTooltip()" @mouseenter="updateTooltipPosition" @mousemove="updateTooltipPosition">
        <SunIcon v-for="i in 3" :key="`s-${i}`" class="icon sun" :class="{ inactive: i > sunLevel }" />
        <span class="tooltip-text" ref="sunTooltip">{{ getSunlightTooltip() }}</span>
      </div>
    </div>
    <div class="requirement-item">
      <span class="requirement-label">WATER:</span>
      <div class="requirement-icons tooltip-container" :title="getWaterTooltip()" @mouseenter="updateTooltipPosition" @mousemove="updateTooltipPosition">
        <BeakerIcon v-for="i in 3" :key="`w-${i}`" class="icon water" :class="{ inactive: i > waterLevel }" />
        <span class="tooltip-text" ref="waterTooltip">{{ getWaterTooltip() }}</span>
      </div>
    </div>
    <div class="requirement-item">
      <span class="requirement-label">CARE:</span>
      <div class="requirement-icons tooltip-container" :title="getCareTooltip()" @mouseenter="updateTooltipPosition" @mousemove="updateTooltipPosition">
        <WrenchScrewdriverIcon v-for="i in 3" :key="`c-${i}`" class="icon care" :class="{ inactive: i > effortLevel }" />
        <span class="tooltip-text" ref="careTooltip">{{ getCareTooltip() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SunIcon, BeakerIcon, WrenchScrewdriverIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  sunlight: string
  water: string
  effort: string
}>()

function updateTooltipPosition(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const tooltip = target.querySelector('.tooltip-text') as HTMLElement
  if (!tooltip) return

  const rect = target.getBoundingClientRect()
  const tooltipRect = tooltip.getBoundingClientRect()

  // Position tooltip centered above the icon container
  tooltip.style.left = `${rect.left + rect.width / 2}px`
  tooltip.style.top = `${rect.top - 12}px`
}

function getSunlightTooltip(): string {
  const level = sunLevel.value
  if (level === 3) return '☀️☀️☀️ Full Sun: 6+ hours of direct sunlight daily. Best for sun-loving plants.'
  if (level === 2) return '☀️☀️ Partial Sun: 3-6 hours of sunlight. Ideal for moderately light-tolerant plants.'
  return '☀️ Low Sun/Shade: Less than 3 hours of direct sun. Perfect for shade-tolerant plants.'
}

function getWaterTooltip(): string {
  const level = waterLevel.value
  if (level === 3) return '💧💧💧 High Water: Frequent watering needed. Keep soil consistently moist.'
  if (level === 2) return '💧💧 Medium Water: Moderate watering. Water when top soil feels dry.'
  return '💧 Low Water: Minimal watering. Allow soil to dry between waterings.'
}

function getCareTooltip(): string {
  const level = effortLevel.value
  if (level === 3) return '🔧🔧🔧 High Care: Requires regular attention, pruning, and specific conditions.'
  if (level === 2) return '🔧🔧 Medium Care: Some maintenance needed. Occasional pruning and monitoring.'
  return '🔧 Low Care: Easy to maintain. Minimal intervention required.'
}

const sunLevel = computed<number>(() => {
  const s = (props.sunlight || '').toLowerCase()
  if (s.includes('full')) return 3
  if (s.includes('partial') || s.includes('part')) return 2
  return 1
})

const waterLevel = computed<number>(() => {
  const w = (props.water || '').toLowerCase()
  if (w.includes('high')) return 3
  if (w.includes('med')) return 2
  return 1
})

const effortLevel = computed<number>(() => {
  const e = (props.effort || '').toLowerCase()
  if (e.includes('high')) return 3
  if (e.includes('med')) return 2
  return 1
})
</script>

<style scoped>
.plant-card-requirements {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0; /* stick to the block below (Why) */
  justify-content: space-between;
  background: rgba(255, 255, 255, 1);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
}

.requirement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  flex: 1;
  min-width: 0;
}

.requirement-label {
  font-weight: 600;
  color: #000000;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.requirement-icons {
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 16px;
  position: relative;
  justify-content: center;
}
.icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.sun { color: #f59e0b; }    /* amber */
.water { color: #0ea5e9; }
.care { color: #6b7280; }    /* grey */
.inactive { opacity: 0.25; }

/* Tooltip styles */
.tooltip-container {
  position: static;
  cursor: help;
}

.tooltip-text {
  visibility: hidden;
  opacity: 0;
  position: fixed;
  background: rgba(31, 41, 55, 0.95);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  z-index: 10000;
  pointer-events: none;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  transform: translateX(-50%) translateY(-100%);
  margin-top: -12px;
}

.tooltip-container:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

/* Arrow for tooltip */
.tooltip-text::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(31, 41, 55, 0.95);
}
</style>


