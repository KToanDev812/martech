import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'
import { store } from '@/store'
import { isAuthError, isNetworkError } from '@/utils/errors'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

// Request interceptor - attach JWT token from Redux
api.interceptors.request.use(
  (config) => {
    // Get token from Redux store
    const state = store.getState()
    const token = state.auth.token

    // Attach token to Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - unwrap backend response envelope
api.interceptors.response.use(
  (response) => {
    // Unwrap { success: true, data: ... } envelope
    return response.data.data
  },
  (error: AxiosError<ApiError>) => {
    // Handle 401/403 errors - clear auth and redirect to login
    if (isAuthError(error)) {
      // Clear auth state
      store.dispatch({ type: 'auth/clearAuth' })

      // Clear localStorage
      try {
        localStorage.removeItem('auth')
      } catch (e) {
        console.error('Failed to clear localStorage:', e)
      }

      // Redirect to login (will be handled by router)
      // Use window.location.href to force full page refresh and clear state
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Handle network errors
    if (isNetworkError(error)) {
      console.error('Network error:', error.message)
      return Promise.reject({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection.',
        },
      })
    }

    // Handle backend error format
    if (error.response?.data) {
      return Promise.reject(error.response.data)
    }

    // Handle other errors
    return Promise.reject({
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
      },
    })
  }
)

export default api
