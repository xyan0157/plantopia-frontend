<template>
  <div class="signin-overlay" @click.self="$emit('close')">
    <div class="modal-card" role="dialog" aria-modal="true" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Sign in required</h2>
        <button class="modal-close" @click="$emit('close')" aria-label="Close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="message">{{ message }}</div>
        <div class="actions single">
          <button class="btn primary" @click="$emit('close')">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message: string }>()
defineEmits<{ close: [] }>()
</script>

<style scoped>
.signin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-card {
  width: min(520px, 96%);
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
.modal-title { font-weight: 700; color: #065f46; margin: 0; }
.modal-close { background: transparent; border: none; font-size: 1.5rem; line-height: 1; cursor: pointer; color: #374151; }
.modal-body { padding: 1rem 1.25rem; }
.message { color: #1f2937; margin-bottom: 1rem; }
.actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
.actions.single { justify-content: flex-end; }
.btn { border: 2px solid transparent; border-radius: 10px; padding: 0.5rem 0.9rem; font-weight: 700; cursor: pointer; }
.btn.primary { background: #10b981; color: #ffffff; border-color: #10b981; }
.btn.primary:hover { background: #059669; border-color: #059669; }
</style>

