<template>
  <div class="plant-card-requirements">
    <div class="requirement-item">
      <span class="requirement-label">SUN:</span>
      <span class="requirement-value">{{ formatSunlight(sunlight) }}</span>
    </div>
    <div class="requirement-item">
      <span class="requirement-label">WATER:</span>
      <span class="requirement-value">{{ formatWater(water) }}</span>
    </div>
    <div class="requirement-item">
      <span class="requirement-label">CARE:</span>
      <span class="requirement-value">{{ formatEffort(effort) }}</span>
    </div>
  </div>
  
</template>

<script setup lang="ts">
const props = defineProps<{
  sunlight: string
  water: string
  effort: string
}>()

function formatSunlight(s: string): string {
  switch ((s || '').toLowerCase()) {
    case 'full': return 'Full Sun'
    case 'partial': return 'Partial'
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
</script>

<style scoped>
.plant-card-requirements {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
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

.requirement-value {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}
</style>


