import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types/api.types'
import { store } from '@/store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
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
    // Handle 401 errors - clear auth and redirect to login
    if (error.response?.status === 401) {
      // Clear auth state
      store.dispatch({ type: 'auth/clearAuth' })
      // Redirect to login (will be handled by router)
      window.location.href = '/login'
    }

    // Handle backend error format
    if (error.response?.data) {
      return Promise.reject(error.response.data)
    }
    return Promise.reject(error)
  }
)

export default api
