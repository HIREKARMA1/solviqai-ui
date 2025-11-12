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

      const response = await apiClient.getCurrentUser()
      setUser(response)
    } catch (error) {
      apiClient.clearAuthTokens()
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
      
      apiClient.setAuthTokens(response.access_token, response.refresh_token)
      // Store token expiry (30 minutes from now)
      localStorage.setItem('token_expiry', String(Date.now() + 30 * 60 * 1000))
      
      await checkAuth()
      
      // Redirect based on user type
      router.push(`/dashboard/${user_type}`)
      
      toast.success('Login successful!')
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      const message = error.response?.data?.detail || error.message || 'Login failed'
      toast.error(message)
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
      const message = error.response?.data?.detail || 'Registration failed'
      toast.error(message)
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
      setUser(null)
      router.push('/auth/login')
      toast.success('Logged out successfully')
    }
  }

  return { user, loading, login, register, logout, checkAuth }
}
