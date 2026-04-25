import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
}

// Load initial state from localStorage
const loadInitialState = (): AuthState => {
  try {
    const savedAuth = localStorage.getItem('auth')
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth)
      return {
        user: parsed.user,
        token: parsed.token,
        isAuthenticated: !!(parsed.user && parsed.token),
      }
    }
  } catch (error) {
    console.error('Failed to load auth from localStorage:', error)
  }
  return {
    user: null,
    isAuthenticated: false,
    token: null,
  }
}

const initialState: AuthState = loadInitialState()

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true

      // Save to localStorage
      try {
        localStorage.setItem('auth', JSON.stringify({
          user: action.payload.user,
          token: action.payload.token,
        }))
      } catch (error) {
        console.error('Failed to save auth to localStorage:', error)
      }
    },
    clearAuth: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false

      // Clear from localStorage
      try {
        localStorage.removeItem('auth')
      } catch (error) {
        console.error('Failed to clear auth from localStorage:', error)
      }
    },
  },
})

export const { setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
