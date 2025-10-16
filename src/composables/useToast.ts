import { reactive } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

const state = reactive<ToastState>({
  toasts: []
})

let toastId = 0

export function useToast() {
  const show = (
    message: string,
    type: Toast['type'] = 'info',
    duration: number = 4000
  ) => {
    const id = ++toastId
    const toast: Toast = {
      id,
      message,
      type,
      duration
    }

    state.toasts.push(toast)

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  const remove = (id: number) => {
    const index = state.toasts.findIndex((t) => t.id === id)
    if (index > -1) {
      state.toasts.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => {
    return show(message, 'success', duration)
  }

  const error = (message: string, duration?: number) => {
    return show(message, 'error', duration)
  }

  const info = (message: string, duration?: number) => {
    return show(message, 'info', duration)
  }

  const warning = (message: string, duration?: number) => {
    return show(message, 'warning', duration)
  }

  const clear = () => {
    state.toasts = []
  }

  return {
    toasts: state.toasts,
    show,
    remove,
    success,
    error,
    info,
    warning,
    clear
  }
}
