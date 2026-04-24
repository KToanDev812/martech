import { useCallback } from 'react'
import { useAppDispatch } from './useAppDispatch'
import { useAppSelector } from './useAppSelector'
import { setAuth, clearAuth } from '@/store/slices/authSlice'
import { authService } from '@/services/auth.service'
import type { LoginRequest, RegisterRequest } from '@/types/api.types'

export function useAuth() {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        const response = await authService.login(credentials)
        dispatch(setAuth({ user: response.user, token: response.token }))
        return { success: true }
      } catch (error: any) {
        return {
          success: false,
          error: error.error?.message || 'Login failed',
        }
      }
    },
    [dispatch]
  )

  const register = useCallback(
    async (userData: RegisterRequest) => {
      try {
        const response = await authService.register(userData)
        dispatch(setAuth({ user: response.user, token: response.token }))
        return { success: true }
      } catch (error: any) {
        return {
          success: false,
          error: error.error?.message || 'Registration failed',
        }
      }
    },
    [dispatch]
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error)
    } finally {
      dispatch(clearAuth())
    }
  }, [dispatch])

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    login,
    register,
    logout,
  }
}
