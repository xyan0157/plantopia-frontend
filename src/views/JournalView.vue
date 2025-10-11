<template>
  <div class="journal-page">
    <div class="container">
      <h1 class="title">Journal</h1>
      <p class="subtitle">Upload plant photos or ask questions</p>

      <div class="card">
        <h2 class="section-title">AI Q&A</h2>
        <div class="chat">
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
          <div class="attach-preview" v-if="attachPreview">
            <img :src="attachPreview" alt="preview" />
            <button class="btn small" @click="clearAttach">Remove</button>
          </div>
          <div class="chat-input">
            <label class="attach">
              <input type="file" accept="image/*" @change="onAttach" />
              +
            </label>
            <textarea class="input" rows="2" v-model="inputText" placeholder="Ask about your plant or describe an issue"></textarea>
            <button class="btn primary" @click="sendMessage" :disabled="aiLoading || (!inputText.trim() && !attachPreview)">Send</button>
          </div>
        </div>
      </div>

      
    </div>
  </div>
  <div v-if="activeEntry" class="detail-overlay" @click.self="closeDetail">
    <div class="detail-card" role="dialog" aria-modal="true">
      <div class="detail-header">
        <div class="entry-title">{{ activeEntry.title || 'Untitled' }}</div>
        <button class="close-btn" @click="closeDetail" aria-label="Close">&times;</button>
      </div>
      <div class="detail-body">
        <img v-if="activeEntry.image" :src="activeEntry.image" alt="entry" class="detail-img" />
        <div class="entry-time">{{ new Date(activeEntry.createdAt).toLocaleString() }}</div>
        <div class="entry-text">{{ activeEntry.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { plantApiService } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

interface JournalEntry { id: string; image?: string; title?: string; content: string; createdAt: number }

const title = ref('')
const content = ref('')
const imagePreview = ref<string | null>(null)
const imageFile = ref<File | null>(null)
const isSubmitting = ref(false)
const entries = ref<JournalEntry[]>([])
const aiLoading = ref(false)
const aiResult = ref('')
// Chat state
type ChatMsg = { id: string; role: 'user' | 'assistant'; text: string; image?: string | null }
const chatMessages = ref<ChatMsg[]>([])
const inputText = ref('')
const attachPreview = ref<string | null>(null)
const chatWindowRef = ref<HTMLDivElement | null>(null)
const auth = useAuthStore()
const chatId = ref<number | null>(null)
const totalStages = 4

const computedStages = computed<JournalEntry[]>(() => entries.value.slice(0, totalStages))

const completedStages = computed(() => Math.min(entries.value.length, totalStages))
const progressPercent = computed(() => Math.round((completedStages.value / totalStages) * 100))
const stageEntries = computed(() => computedStages.value)
const activeEntry = ref<JournalEntry | null>(null)

const STORAGE_KEY = 'plantopia_journal_entries'

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    entries.value = raw ? JSON.parse(raw) : []
  } catch { entries.value = [] }
}

function saveEntries() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value)) } catch {}
}

function onFile(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) { imageFile.value = null; imagePreview.value = null; return }
  imageFile.value = files[0]
  const reader = new FileReader()
  reader.onload = () => { imagePreview.value = String(reader.result || '') }
  reader.readAsDataURL(files[0])
}

function resetForm() {
  title.value = ''
  content.value = ''
  imageFile.value = null
  imagePreview.value = null
}

function generateId(): string {
  try {
    const c = (globalThis as any).crypto
    if (c?.randomUUID) return c.randomUUID()
  } catch {}
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

async function handleSubmit() {
  isSubmitting.value = true
  const id = generateId()
  const newEntry: JournalEntry = {
    id,
    image: imagePreview.value || undefined,
    title: title.value.trim(),
    content: content.value.trim(),
    createdAt: Date.now(),
  }
  entries.value.unshift(newEntry)
  saveEntries()
  resetForm()
  isSubmitting.value = false
}

function removeEntry(id: string) {
  entries.value = entries.value.filter(e => e.id !== id)
  saveEntries()
}

onMounted(loadEntries)

function formatDate(ts: number) {
  try { return new Date(ts).toLocaleDateString() } catch { return '' }
}

function openDetail(e: JournalEntry) { activeEntry.value = e }
function closeDetail() { activeEntry.value = null }

async function runAi() {
  aiLoading.value = true
  aiResult.value = ''
  try {
    // Placeholder: integrate your AI API call here
    // Example payload you can use later
    const payload = {
      title: title.value.trim(),
      question: content.value.trim(),
      imageBase64: imagePreview.value || null,
    }
    console.debug('[AI] payload', payload)
    // Simulated latency and mock result
    await new Promise(r => setTimeout(r, 800))
    aiResult.value = 'This is a demo AI response. Replace runAi() with a real API call.'
  } catch (e) {
    aiResult.value = 'AI analysis failed. Please try again.'
  } finally {
    aiLoading.value = false
  }
}

function onAttach(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) { attachPreview.value = null; return }
  const reader = new FileReader()
  reader.onload = () => { attachPreview.value = String(reader.result || '') }
  reader.readAsDataURL(files[0])
}

function clearAttach() { attachPreview.value = null }

async function sendMessage() {
  if (!inputText.value.trim() && !attachPreview.value) return
  const userMsg: ChatMsg = { id: generateId(), role: 'user', text: inputText.value.trim(), image: attachPreview.value }
  chatMessages.value.push(userMsg)
  inputText.value = ''
  attachPreview.value = null
  await nextTick(); scrollToBottom()

  aiLoading.value = true
  try {
    // Ensure a chat session exists
    if (!chatId.value) {
      // Use email as user_id if available; fallback to 1
      const email = localStorage.getItem('plantopia_user_email') || ''
      const res = await plantApiService.startGeneralChat(email || 1)
      chatId.value = res.chat_id
    }

    const { reply } = await plantApiService.sendGeneralChatMessage({
      chat_id: chatId.value!,
      message: userMsg.text,
      image: userMsg.image || undefined,
    })
    const replyMsg: ChatMsg = { id: generateId(), role: 'assistant', text: reply || 'No reply' }
    chatMessages.value.push(replyMsg)
  } catch (e) {
    const errMsg: ChatMsg = { id: generateId(), role: 'assistant', text: 'Failed to contact AI service. Please try again later.' }
    chatMessages.value.push(errMsg)
  } finally {
    aiLoading.value = false
    await nextTick(); scrollToBottom()
  }
}

function scrollToBottom() {
  const el = chatWindowRef.value
  if (el) el.scrollTop = el.scrollHeight
}
</script>

<style scoped>
.journal-page { min-height: calc(100vh - 64px); position: relative; }
.journal-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: url('@/assets/photo/plant-1.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  z-index: -2;
  pointer-events: none;
  filter: brightness(0.9);
}
.container { max-width: 840px; margin: 0 auto; padding: 1rem; }
.title { margin: 0; font-size: 28px; font-weight: 800; color: #065f46; text-align:center; }
.subtitle { text-align:center; color:#6b7280; margin-bottom: 12px; }
.card { background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 6px 16px rgba(0,0,0,0.08); padding:16px; margin-top: 12px; }
.form { display:grid; gap: 10px; }
.form-row { display:grid; gap:6px; }
.label { font-weight: 700; color:#065f46; }
.input, .textarea { width:100%; border:1px solid #d1d5db; border-radius:8px; padding:8px 10px; font-size:14px; }
.input:focus, .textarea:focus { outline:none; border-color:#10b981; box-shadow:0 0 0 3px rgba(16,185,129,0.15); }
.file { border:1px solid #d1d5db; border-radius:8px; padding:6px; }
.preview { margin-top: 6px; }
.preview img { width: 100%; max-height: 280px; object-fit: contain; border-radius: 8px; border:1px solid #e5e7eb; background:#f9fafb; }
.chat { display:grid; gap:10px; }
.chat-window { height: 280px; overflow:auto; border:1px solid #e5e7eb; border-radius:12px; padding:10px; background:#ffffff; }
.msg { display:flex; margin-bottom: 8px; }
.msg.user { justify-content: flex-end; }
.msg.assistant { justify-content: flex-start; }
.bubble { max-width: 80%; padding:10px 12px; border-radius: 14px; border:1px solid #e5e7eb; background:#f9fafb; color:#111827; }
.msg.user .bubble { background:#10b981; color:#ffffff; border-color:#10b981; }
.msg-img { width: 140px; height: 100px; object-fit: cover; border-radius:8px; margin-bottom:6px; background:#eef2f7; display:block; }
.typing { display:inline-flex; gap:4px; padding:10px 12px; }
.dot { width:8px; height:8px; background:#9ca3af; border-radius:50%; animation: blink 1.2s infinite ease-in-out; }
.dot:nth-child(2) { animation-delay: .2s; }
.dot:nth-child(3) { animation-delay: .4s; }
@keyframes blink { 0%, 80%, 100% { opacity:.2 } 40% { opacity: 1 } }
.attach-preview { display:flex; gap:10px; align-items:center; }
.attach-preview img { width:120px; height:90px; object-fit:cover; border-radius:8px; border:1px solid #e5e7eb; }
.btn.small { padding:6px 10px; }
.chat-input { display:flex; gap:8px; align-items:flex-end; }
.chat-input .attach { display:inline-flex; width:36px; height:36px; border-radius:8px; border:1px dashed #9ca3af; color:#374151; align-items:center; justify-content:center; cursor:pointer; }
.chat-input .attach input { display:none; }
.actions { display:flex; gap:8px; }
.btn { background:#e5e7eb; color:#111827; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; }
.btn.primary { background:#10b981; color:#fff; }
.btn.danger { background:#ef4444; color:#fff; }
.section-title { margin:0 0 8px 0; color:#065f46; font-size:18px; }
.empty { color:#6b7280; font-style: italic; }
.entry-list { list-style:none; margin:0; padding:0; display:grid; gap:10px; }
.entry { display:grid; grid-template-columns: 120px 1fr auto; gap:10px; align-items:center; border:1px solid #e5e7eb; border-radius:10px; padding:10px; }
.thumb { width:120px; height:90px; border-radius:8px; overflow:hidden; background:#f3f4f6; display:flex; align-items:center; justify-content:center; }
.thumb img { width:100%; height:100%; object-fit:cover; }
.entry-title { font-weight:800; color:#111827; }
.entry-time { color:#6b7280; font-size:12px; }
.entry-text { color:#374151; }
.entry-actions { display:flex; gap:8px; }
@media (max-width: 600px) {
  .entry { grid-template-columns: 1fr; }
  .thumb { width:100%; height:180px; }
}

/* Journey */
.journey { display:grid; gap:12px; }
.stages { display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; }
.stage { border:1px solid #e5e7eb; border-radius:12px; padding:10px; text-align:center; background:#f9fafb; }
.stage-thumb { height:150px; border-radius:8px; overflow:hidden; background:#eef2f7; display:flex; align-items:center; justify-content:center; }
.stage-thumb img { width:100%; height:100%; object-fit:cover; }
.stage-date { margin:6px 0; color:#374151; font-weight:600; }
.progress-row { display:flex; align-items:center; gap:12px; }
.progress-bar { flex:1; height:16px; background:#eef2f7; border-radius:9999px; overflow:hidden; border:1px solid #e5e7eb; }
.progress-fill { height:100%; background:#10b981; width:0; transition: width .25s ease; }
.progress-text { color:#374151; }

/* Impact */
.impact-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; }
.impact-grid.compact { margin-top: 12px; }
.impact-card { border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#ffffff; }
.impact-title { font-weight:800; color:#065f46; margin-bottom:4px; }
.impact-text { color:#374151; }

/* Detail modal */
.detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index: 100; padding: 1rem; }
.detail-card { width: min(720px, 100%); background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.35); }
.detail-header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid #e5e7eb; background:#f9fafb; }
.detail-body { padding:12px; display:grid; gap:10px; }
.detail-img { width:100%; max-height:360px; object-fit:contain; border-radius:8px; background:#f3f4f6; }
.close-btn { background:transparent; border:none; font-size:20px; cursor:pointer; }
</style>

