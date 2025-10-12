<template>
  <div class="chat-wrap">
    <div class="chat-header">
      <div class="title">AI Q&A</div>
      <div class="subtitle">Agriculture and plant-related questions only</div>
    </div>
    <div class="chat-body">
      <div class="chat-window" ref="chatWindowRef">
        <div v-for="m in chatMessages" :key="m.id" class="msg" :class="m.role">
          <div class="bubble">
            <img v-if="m.image" :src="m.image" class="msg-img" alt="attachment" />
            <div class="text">{{ m.text }}</div>
          </div>
        </div>
        <div v-if="aiLoading" class="msg assistant">
          <div class="bubble typing"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
        </div>
      </div>
      <div v-if="tokenWarning" class="token-warning">Warning: high token usage ({{ totalTokens }}).</div>
    </div>
    <div class="chat-input">
      <label class="attach">
        <input type="file" accept="image/*" @change="onAttach" />
        +
      </label>
      <textarea class="input" rows="2" v-model="inputText" placeholder="Ask about your plant or describe an issue"></textarea>
      <button class="btn primary" @click="sendMessage" :disabled="aiLoading || (!inputText.trim() && !attachPreview) || !hasEmail">Send</button>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { plantApiService } from '@/services/api'

type ChatMsg = { id: string; role: 'user' | 'assistant'; text: string; image?: string | null }

const chatMessages = ref<ChatMsg[]>([])
const inputText = ref('')
const attachPreview = ref<string | null>(null)
const chatWindowRef = ref<HTMLDivElement | null>(null)
const aiLoading = ref(false)
const chatId = ref<number | null>(null)
const tokenWarning = ref(false)
const totalTokens = ref<number | undefined>(undefined)
const userEmail = computed(() => {
  try { return localStorage.getItem('plantopia_user_email') || '' } catch { return '' }
})
const hasEmail = computed(() => Boolean(userEmail.value && userEmail.value.length))

function generateId(): string {
  try {
    const c = (globalThis as unknown as { crypto?: { randomUUID?: () => string } }).crypto
    if (c?.randomUUID) return c.randomUUID()
  } catch {}
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function onAttach(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) { attachPreview.value = null; return }
  const reader = new FileReader()
  reader.onload = () => { attachPreview.value = String(reader.result || '') }
  reader.readAsDataURL(files[0])
}

function clearAttach() { attachPreview.value = null }

function scrollToBottom() {
  const el = chatWindowRef.value
  if (el) el.scrollTop = el.scrollHeight
}

async function sendMessage() {
  if (!inputText.value.trim() && !attachPreview.value) return
  const userMsg: ChatMsg = { id: generateId(), role: 'user', text: inputText.value.trim(), image: attachPreview.value }
  chatMessages.value.push(userMsg)
  inputText.value = ''
  attachPreview.value = null
  await nextTick(); scrollToBottom()

  aiLoading.value = true
  try {
    if (!chatId.value) {
      const email = userEmail.value
      if (!email) throw new Error('Missing email')
      const res = await plantApiService.startGeneralChatByEmail(email)
      chatId.value = res.chat_id
    }

    const { reply, token_warning, total_tokens } = await plantApiService.sendGeneralChatMessage({
      chat_id: chatId.value!,
      message: userMsg.text,
      image: userMsg.image || undefined,
    })
    tokenWarning.value = Boolean(token_warning)
    totalTokens.value = total_tokens
    const replyMsg: ChatMsg = { id: generateId(), role: 'assistant', text: reply || 'No reply' }
    chatMessages.value.push(replyMsg)
  } catch {
    const errMsg: ChatMsg = { id: generateId(), role: 'assistant', text: 'Failed to contact AI service. Please try again later.' }
    chatMessages.value.push(errMsg)
  } finally {
    aiLoading.value = false
    await nextTick(); scrollToBottom()
  }
}
</script>

<style scoped>
.chat-wrap { display:flex; flex-direction:column; height:100%; }
.chat-header { padding: 10px 12px; border-bottom:1px solid #e5e7eb; background:#fff; }
.title { font-weight:800; color:#065f46; }
.subtitle { font-size:12px; color:#6b7280; }
.chat-body { flex:1; overflow:hidden; display:flex; flex-direction:column; }
.chat-window { flex:1; overflow:auto; padding: 10px 12px; display:grid; gap:8px; background:#f9fafb; }
.msg { display:flex; }
.msg.user { justify-content:flex-end; }
.msg.assistant { justify-content:flex-start; }
.bubble { max-width:80%; padding:8px 10px; border-radius:10px; background:#ffffff; border:1px solid #e5e7eb; color:#111827; }
.msg.user .bubble { background:#10b981; color:#ffffff; border-color:#10b981; }
.typing { display:flex; gap:4px; }
.dot{ width:6px; height:6px; border-radius:50%; background:#9ca3af; animation: blink 1s infinite ease-in-out; }
.dot:nth-child(2){ animation-delay: .2s }
.dot:nth-child(3){ animation-delay: .4s }
@keyframes blink { 0%, 80%, 100% {opacity: .2} 40% {opacity: 1} }
.token-warning { background:#fff7ed; color:#9a3412; border:1px solid #fed7aa; margin: 6px 12px; padding:6px 8px; border-radius:8px; font-size:12px; }
.chat-input { display:flex; align-items:center; gap:8px; padding:10px 12px; border-top:1px solid #e5e7eb; background:#ffffff; }
.attach input{ display:none; }
.attach { width:28px; height:28px; border-radius:6px; background:#f3f4f6; color:#374151; display:grid; place-items:center; cursor:pointer; }
.input { flex:1; border:1px solid #d1d5db; border-radius:8px; padding:8px 10px; font-size:14px; }
.btn.primary { background:#10b981; color:#fff; border:none; border-radius:8px; padding:8px 12px; cursor:pointer; }
.btn.primary:disabled { background:#a7f3d0; cursor:not-allowed; }
</style>

