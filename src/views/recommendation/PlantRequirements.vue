<template>
  <div class="plant-card-requirements">
    <div class="requirement-item">
      <span class="requirement-label">SUN:</span>
      <div class="requirement-icons" :title="formatSunlight(sunlight)">
        <SunIcon v-if="sunType === 'full'" class="icon sun" />
        <div v-else-if="sunType === 'partial'" class="icon sun-partial"><SunIcon class="icon sun" /></div>
        <MoonIcon v-else class="icon shade" />
      </div>
    </div>
    <div class="requirement-item">
      <span class="requirement-label">WATER:</span>
      <div class="requirement-icons" :title="formatWater(water)">
        <BeakerIcon v-for="i in 3" :key="`w-${i}`" class="icon water" :class="{ inactive: i > waterLevel }" />
      </div>
    </div>
    <div class="requirement-item">
      <span class="requirement-label">CARE:</span>
      <div class="requirement-icons" :title="formatEffort(effort)">
        <WrenchScrewdriverIcon v-for="i in 3" :key="`c-${i}`" class="icon care" :class="{ inactive: i > effortLevel }" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SunIcon, MoonIcon, BeakerIcon, WrenchScrewdriverIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  sunlight: string
  water: string
  effort: string
}>()

function formatSunlight(s: string): string {
  switch ((s || '').toLowerCase()) {
    case 'full': return 'Full Sun'
    case 'partial': return 'Partial Sun'
    case 'shade': return 'Shade'
    default: return s || 'Full Sun'
  }
}

function formatWater(w: string): string {
  switch ((w || '').toLowerCase()) {
    case 'low': return 'Low'
    case 'medium': return 'Medium'
    case 'high': return 'High'
    default: return w || 'Low'
  }
}

function formatEffort(e: string): string {
  switch ((e || '').toLowerCase()) {
    case 'low': return 'Low'
    case 'medium': return 'Medium'
    case 'high': return 'High'
    default: return e || 'Low'
  }
}

const sunType = computed<'full' | 'partial' | 'shade'>(() => {
  const s = (props.sunlight || '').toLowerCase()
  if (s.includes('partial') || s.includes('part')) return 'partial'
  if (s.includes('shade')) return 'shade'
  return 'full'
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
  gap: 1rem;
  margin-bottom: 0; /* stick to the block below (Why) */
  justify-content: space-between;
}

.requirement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
}

.requirement-label {
  font-weight: 600;
  color: #047857;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.requirement-icons { display: flex; align-items: center; gap: 4px; min-height: 20px; }
.icon { width: 18px; height: 18px; }
.sun { color: #f59e0b; }    /* amber */
.shade { color: #6b7280; }
.sun-partial { width: 18px; height: 18px; clip-path: inset(0 50% 0 0); }
.water { color: #0ea5e9; }
.care { color: #f59e0b; }
.inactive { opacity: 0.25; }
</style>


