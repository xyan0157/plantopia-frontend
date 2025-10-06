<template>
  <div class="profile-container recommendations-bg">
    <div class="profile-card">
      <div class="profile-header">
        <h1 class="profile-title">Profile</h1>
        <p v-if="isLoggedIn" class="profile-subtitle">Manage your account</p>
      </div>

      <div class="profile-body">
        <div class="profile-row" v-if="isLoggedIn">
          <div class="avatar" v-if="avatarUrl">
            <img :src="avatarUrl" alt="avatar" />
          </div>
          <div class="avatar placeholder" v-else>
            {{ (username || 'U').substring(0,1).toUpperCase() }}
          </div>
          <div class="info">
            <div class="name">{{ username || 'User' }}</div>
            <div class="status">{{ isLoggedIn ? 'Signed in' : 'Signed out' }}</div>
          </div>
        </div>

        <template v-if="!isLoggedIn">
          <div class="signin-title">Sign in with:</div>
          <div class="idp-list">
            <div ref="googleBtnContainer" class="google-button-host"></div>
          </div>
        </template>

        <div class="actions" v-else>
          <button class="danger" @click="doLogout">Sign out</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ensureGoogleIdentityLoaded, parseJwtCredential } from '@/services/googleIdentity'

const auth = useAuthStore()
const router = useRouter()

const isLoggedIn = computed(() => auth.userIsLoggedIn)
const username = computed(() => auth.userUsername)
const avatarUrl = computed(() => auth.userAvatarUrl)
const googleBtnContainer = ref<HTMLDivElement | null>(null)

onMounted(async () => {
  if (isLoggedIn.value) return
  await ensureGoogleIdentityLoaded()
  const cid = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID
  const google = (window as any).google
  if (!google?.accounts?.id || !cid) return
  google.accounts.id.initialize({
    client_id: cid,
    callback: (resp: any) => {
      const info = parseJwtCredential(resp?.credential || '')
      const display = info.name || 'Google User'
      const pic = info.picture || ''
      auth.userLogin(display, pic)
    },
    auto_select: false,
    ux_mode: 'popup',
  })
  if (googleBtnContainer.value) {
    google.accounts.id.renderButton(googleBtnContainer.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: 280,
      logo_alignment: 'left',
    })
  }
})

// No fallback prompt button; we only use the official button above

const doLogout = () => {
  auth.userLogout()
}
</script>

<style scoped>
.profile-container { min-height: calc(100vh - 64px); display:grid; place-items:center; padding: 2rem; }
.recommendations-bg::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('@/assets/photo/plant-1.jpg') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  z-index: -2;
  pointer-events: none;
}
.profile-card { background:#ffffff; border-radius:16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); width:100%; max-width:560px; padding:24px; }
.profile-header { text-align:center; margin-bottom:16px; }
.profile-title { font-size:24px; font-weight:800; color:#065f46; }
.profile-subtitle { color:#6b7280; font-size:14px; }
.profile-body { padding-top:8px; }
.profile-row { display:flex; align-items:center; gap:16px; }
.avatar { width:64px; height:64px; border-radius:50%; overflow:hidden; box-shadow: 0 0 0 3px #e5e7eb; background:#fff; display:flex; align-items:center; justify-content:center; }
.avatar img { width:100%; height:100%; object-fit:cover; }
.avatar.placeholder { background:#065f46; color:#fff; font-weight:800; font-size:24px; }
.info .name { font-size:18px; font-weight:700; color:#111827; }
.info .status { font-size:13px; color:#6b7280; }
.signin-title { margin-top:20px; font-weight:700; color:#111827; text-align:center; }
.idp-list { margin-top:12px; display:flex; flex-direction:column; align-items:center; gap:12px; }
.google-button-host { display:flex; justify-content:center; }
.idp-icon { width:28px; height:28px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-weight:800; }
.actions { margin-top:20px; display:flex; gap:12px; }
.primary { background:#10b981; color:#fff; border:none; padding:10px 14px; border-radius:8px; cursor:pointer; font-weight:700; }
.primary:hover { background:#059669; }
.secondary { background:#ffffff; color:#374151; border:1px solid #d1d5db; padding:10px 14px; border-radius:8px; cursor:pointer; font-weight:700; }
.secondary:hover { background:#f9fafb; }
.danger { background:#ef4444; color:#fff; border:none; padding:10px 14px; border-radius:8px; cursor:pointer; font-weight:700; }
.danger:hover { background:#dc2626; }
.google-btn-slot { display:inline-block; }
</style>
