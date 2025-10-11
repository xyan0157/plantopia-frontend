import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const username = ref('')
  const avatarUrl = ref('')

  // Separate end-user identity (Google) from gate login
  const userLoggedIn = ref(false)
  const userName = ref('')
  const userAvatar = ref('')

  // Check if user is logged in from localStorage on store initialization
  const checkAuthStatus = () => {
    const savedLoginStatus = localStorage.getItem('plantopia_logged_in')
    const savedUsername = localStorage.getItem('plantopia_username')
    const savedAvatar = localStorage.getItem('plantopia_avatar')
    
    if (savedLoginStatus === 'true' && savedUsername) {
      isLoggedIn.value = true
      username.value = savedUsername
      avatarUrl.value = savedAvatar || ''
    }

    // End-user identity
    const uLogged = localStorage.getItem('plantopia_user_logged_in') === 'true'
    const uName = localStorage.getItem('plantopia_user_name') || ''
    const uAvatar = localStorage.getItem('plantopia_user_avatar') || ''
    if (uLogged && uName) {
      userLoggedIn.value = true
      userName.value = uName
      userAvatar.value = uAvatar
    }
  }

  // Login function
  const login = (user: string, avatar?: string) => {
    isLoggedIn.value = true
    username.value = user
    avatarUrl.value = avatar || ''
    localStorage.setItem('plantopia_logged_in', 'true')
    localStorage.setItem('plantopia_username', user)
    if (avatar) localStorage.setItem('plantopia_avatar', avatar)
  }

  // End-user identity login (Google)
  const userLogin = (name: string, avatar?: string, userId?: number) => {
    userLoggedIn.value = true
    userName.value = name
    userAvatar.value = avatar || ''
    localStorage.setItem('plantopia_user_logged_in', 'true')
    localStorage.setItem('plantopia_user_name', name)
    if (avatar) localStorage.setItem('plantopia_user_avatar', avatar)
    if (typeof userId === 'number' && Number.isFinite(userId) && userId > 0) {
      localStorage.setItem('plantopia_user_id', String(userId))
    }
  }

  // Logout function
  const logout = () => {
    isLoggedIn.value = false
    username.value = ''
    avatarUrl.value = ''
    localStorage.removeItem('plantopia_logged_in')
    localStorage.removeItem('plantopia_username')
    localStorage.removeItem('plantopia_avatar')
  }

  const userLogout = () => {
    userLoggedIn.value = false
    userName.value = ''
    userAvatar.value = ''
    localStorage.removeItem('plantopia_user_logged_in')
    localStorage.removeItem('plantopia_user_name')
    localStorage.removeItem('plantopia_user_avatar')
    localStorage.removeItem('plantopia_user_id')
  }

  // Allow setting user_id after backend returns it
  const setUserId = (id: number) => {
    if (typeof id === 'number' && Number.isFinite(id) && id > 0) {
      localStorage.setItem('plantopia_user_id', String(id))
    }
  }

  // Initialize auth status
  checkAuthStatus()

  return {
    isLoggedIn: computed(() => isLoggedIn.value),
    username: computed(() => username.value),
    avatarUrl: computed(() => avatarUrl.value),
    userIsLoggedIn: computed(() => userLoggedIn.value),
    userUsername: computed(() => userName.value),
    userAvatarUrl: computed(() => userAvatar.value),
    login,
    logout,
    userLogin,
    userLogout,
    setUserId,
    checkAuthStatus
  }
})
