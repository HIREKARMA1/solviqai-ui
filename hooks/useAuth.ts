"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { User } from '@/types/auth'
import toast from 'react-hot-toast'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = apiClient.getAccessToken()
      if (!token) {
        setLoading(false)
        return
      }

      // Check if this is a Disha SSO session
      const dishaStudentId = localStorage.getItem('disha_student_id')
      if (dishaStudentId) {
        // For Disha SSO students, decode the token to get user info
        // instead of calling /auth/me (which would fail since they don't exist in SOLVIQ DB)
        try {
          // Decode JWT to get user info (without verification since we already validated it)
          const tokenParts = token.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))

            // Reconstruct user object from token payload
            const dishaUser = {
              id: payload.sub || payload.disha_student_id,
              email: payload.email,
              name: payload.name,
              user_type: 'student',
              is_disha_student: true,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            setUser(dishaUser as User)
            setLoading(false)
            return
          }
        } catch (decodeError) {
          console.error('Failed to decode Disha token:', decodeError)
          // Fall through to normal auth check
        }
      }

      // Normal authentication flow for regular SOLVIQ users
      const response = await apiClient.getCurrentUser()
      setUser(response)
    } catch (error: any) {
      // Only clear tokens on authentication errors (401, 403), not network errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('Authentication failed, clearing tokens')
        apiClient.clearAuthTokens()
        setUser(null)
      } else {
        // For network errors or other issues, keep tokens but log the error
        console.error('Error checking auth (non-auth error):', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string, user_type: string) => {
    try {
      console.log('🔐 Attempting login:', {
        baseURL: (apiClient.client as any).defaults?.baseURL,
        email,
        user_type
      });

      const response = await apiClient.login({
        email,
        password,
        user_type,
      })

      console.log('✅ Login successful');

      // Clear any existing Disha SSO state to prevent user type conflicts
      localStorage.removeItem('disha_student_id');
      localStorage.removeItem('disha_package_id');
      localStorage.removeItem('disha_attempt_id');

      apiClient.setAuthTokens(response.access_token, response.refresh_token)
      // Store token expiry (30 minutes from now)
      localStorage.setItem('token_expiry', String(Date.now() + 30 * 60 * 1000))

      await checkAuth()

      // Redirect based on user type
      router.push(`/dashboard/${user_type}`)

      toast.success('Login successful!')
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      // Don't show toast for errors - they're displayed in the form
      throw error
    }
  }

  const register = async (data: any) => {
    try {
      // Register the student
      await apiClient.registerStudent(data)

      // Automatically log in the user after successful registration
      const loginResponse = await apiClient.login({
        email: data.email,
        password: data.password,
        user_type: 'student',
      })

      // Set auth tokens
      apiClient.setAuthTokens(loginResponse.access_token, loginResponse.refresh_token)
      // Store token expiry (30 minutes from now)
      localStorage.setItem('token_expiry', String(Date.now() + 30 * 60 * 1000))

      // Update user state
      await checkAuth()

      // Redirect to student dashboard
      router.push('/dashboard/student')

      toast.success('Registration successful! Welcome to Saksham AI!')
    } catch (error: any) {
      // Don't show toast for errors - they're displayed in the form
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      apiClient.clearAuthTokens()
      // Also clear Disha SSO related items
      localStorage.removeItem('disha_student_id')
      localStorage.removeItem('disha_package_id')
      localStorage.removeItem('disha_attempt_id')

      setUser(null)
      router.push('/auth/login')
      toast.success('Logged out successfully')
    }
  }

  return { user, loading, login, register, logout, checkAuth }
}
