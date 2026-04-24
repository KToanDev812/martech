import api from './api'
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types/api.types'

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return api.post('/auth/login', credentials)
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return api.post('/auth/register', userData)
  },

  async logout(): Promise<void> {
    // Backend handles HTTP-only cookie clearing
    return api.post('/auth/logout')
  },
}
