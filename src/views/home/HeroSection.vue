<template>
  <div class="hero-section">
    <div class="hero-container">
      <h1 class="main-title">
        <span class="highlight heal-text" @click="$emit('heat-toggle', false)">Heal</span> or <span class="heat-text" @click="$emit('heat-toggle', true)">Heat</span>
      </h1>
      <p class="subtitle">
        Get personalized, climate-smart plant recommendations to reduce your carbon footprint
        while creating beautiful, sustainable spaces.
      </p>



      <div class="button-group">
        <button class="btn-primary" @click="$emit('navigate-to-my-impact')">
          <img src="@/assets/icons/leaf-2.png" alt="impact" class="btn-icon" />
          My Impact
          <ArrowRightIcon class="btn-arrow" />
        </button>
        <button class="btn-secondary" @click="$emit('navigate-to-dashboard')">
          <BookOpenIcon class="btn-icon" />
          Dashboard
        </button>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="scroll-indicator" @click="$emit('scroll-to-content')">
      <span class="scroll-text">Explore More</span>
      <ChevronDownIcon class="scroll-arrow" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { BookOpenIcon, ArrowRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

defineEmits<{
  'navigate-to-my-impact': []
  'navigate-to-dashboard': []
  'scroll-to-content': []
  'heat-toggle': [boolean]
}>()
</script>

<style scoped>
.hero-section {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: flex-start; /* Change to top alignment */
  justify-content: center;
  padding-top: 0; /* move further up */
  z-index: 10; /* Increase z-index to ensure display above video */
}

.hero-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  position: relative;
  z-index: 2;
  transform: scale(0.9);
}

.main-title {
  font-size: 3.75rem;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  margin-bottom: 1.5rem;
}

.highlight {
  color: #34d399;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.heat-text {
  color: #9ca3af; /* Gray color */
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  cursor: pointer;
}

.heal-text { cursor: pointer; }

.subtitle {
  font-size: 1.2rem;
  color: white;
  line-height: 1.6;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  margin-bottom: 2rem;
  margin-top: -1rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}



.button-group {
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 6rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(5, 150, 105, 0.8), rgba(52, 211, 153, 0.8));
  color: white;
  border: 2px solid #34d399;
  padding: 1.2rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 320px;
  height: 60px;
  flex: 0 0 320px;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(52, 211, 153, 0.3);
  border-color: #10b981;
}

.btn-secondary {
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 1.2rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 320px;
  height: 60px;
  flex: 0 0 320px;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.5);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.btn-arrow {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.scroll-indicator {
  position: absolute;
  bottom: 4rem; /* Closer to bottom */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  opacity: 0.9;
  transition: all 0.3s ease;
  animation: bounce 2s infinite;
  z-index: 3;
}

.scroll-indicator:hover {
  opacity: 1;
  transform: translateX(-50%) translateY(-8px);
}

.scroll-text {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.5px;
}

.scroll-arrow {
  width: 32px;
  height: 32px;
  color: #34d399;
  stroke-width: 2.5;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  40% {
    transform: translateX(-50%) translateY(-10px);
  }
  60% {
    transform: translateX(-50%) translateY(-5px);
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding-top: 10px;
  }
  
  .main-title {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }

  .button-group {
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    max-width: 320px;
    justify-content: center;
    flex: none;
  }

  .button-group {
    gap: 1rem;
  }

  .scroll-indicator {
    bottom: 4vh; /* Also closer to bottom on mobile */
    gap: 0.5rem;
  }

  .scroll-text {
    font-size: 0.9rem;
  }

  .scroll-arrow {
    width: 24px;
    height: 24px;
  }


}
</style>