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

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  token: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
    },
    clearAuth: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
    },
  },
})

export const { setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
