"use client"

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { User } from '@/types/auth'
import toast from 'react-hot-toast'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string, user_type: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

let inflightSession: Promise<User | null> | null = null

function userFromDishaToken(token: string): User | null {
  try {
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) return null
    const payload = JSON.parse(atob(tokenParts[1]))
    return {
      id: payload.sub || payload.disha_student_id,
      email: payload.email,
      name: payload.name,
      user_type: 'student',
      is_disha_student: true,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as User
  } catch (decodeError) {
    console.error('Failed to decode Disha token:', decodeError)
    return null
  }
}

async function fetchSessionUser(): Promise<User | null> {
  if (inflightSession) return inflightSession

  inflightSession = (async () => {
    const token = apiClient.getAccessToken()
    if (!token) return null

    const dishaStudentId = localStorage.getItem('disha_student_id')
    if (dishaStudentId) {
      const dishaUser = userFromDishaToken(token)
      if (dishaUser) return dishaUser
    }

    return (await apiClient.getCurrentUser()) as User
  })()

  try {
    return await inflightSession
  } finally {
    inflightSession = null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const token = apiClient.getAccessToken()
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      const sessionUser = await fetchSessionUser()
      setUser(sessionUser)
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('Authentication failed, clearing tokens')
        apiClient.clearAuthTokens()
        setUser(null)
      } else {
        console.error('Error checking auth (non-auth error):', error)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void checkAuth()
  }, [checkAuth])

  const login = useCallback(async (email: string, password: string, user_type: string) => {
    try {
      console.log('🔐 Attempting login:', {
        baseURL: (apiClient.client as any).defaults?.baseURL,
        user_type
      });

      const response = await apiClient.login({
        email,
        password,
        user_type,
      })

      console.log('✅ Login successful');

      localStorage.removeItem('disha_student_id');
      localStorage.removeItem('disha_package_id');
      localStorage.removeItem('disha_attempt_id');

      apiClient.setAuthTokens(response.access_token, response.refresh_token)
      localStorage.setItem('token_expiry', String(Date.now() + 30 * 60 * 1000))

      await checkAuth()

      router.push(`/dashboard/${user_type}`)

      toast.success('Login successful!')
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      throw error
    }
  }, [checkAuth, router])

  const register = useCallback(async (data: any) => {
    try {
      await apiClient.registerStudent(data)

      const loginResponse = await apiClient.login({
        email: data.email,
        password: data.password,
        user_type: 'student',
      })

      apiClient.setAuthTokens(loginResponse.access_token, loginResponse.refresh_token)
      localStorage.setItem('token_expiry', String(Date.now() + 30 * 60 * 1000))

      await checkAuth()

      router.push('/dashboard/student')

      toast.success('Registration successful! Welcome to Saksham AI!')
    } catch (error: any) {
      throw error
    }
  }, [checkAuth, router])

  const logout = useCallback(async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      apiClient.clearAuthTokens()
      localStorage.removeItem('disha_student_id')
      localStorage.removeItem('disha_package_id')
      localStorage.removeItem('disha_attempt_id')

      setUser(null)
      router.push('/auth/login')
      toast.success('Logged out successfully')
    }
  }, [router])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, checkAuth }),
    [user, loading, login, register, logout, checkAuth],
  )

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
