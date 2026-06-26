'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import api, { resolveBaseUrl } from '@/lib/axios'

type User = {
  id: number
  username: string
  nombre: string
  rol: string
}

type AuthContextType = {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_BASE = resolveBaseUrl()
const rawOpts  = { withCredentials: true }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  // Restore session on load using raw axios — intentionally bypasses the api
  // interceptor so a failed session-restore never fires redirectToLogin(), which
  // would race with an in-progress login and bounce the user back to /login.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await axios.get(`${API_BASE}/auth/me`, rawOpts)
        setUser(res.data.user)
        if (window.location.pathname === '/login') {
          startTransition(() => { router.push('/') })
        }
      } catch (err: any) {
        if (err.response?.data?.code === 'TOKEN_EXPIRED') {
          // Access cookie expired but refresh may still be valid — try once.
          try {
            await axios.post(`${API_BASE}/auth/refresh`, {}, rawOpts)
            const res = await axios.get(`${API_BASE}/auth/me`, rawOpts)
            setUser(res.data.user)
            if (window.location.pathname === '/login') {
              startTransition(() => { router.push('/') })
            }
          } catch {
            // No refresh token (e.g. just logged out) or it's invalid — this is
            // an expected "not authenticated" state, not an error.
            console.log('[AuthContext] restoreSession: no valid session, staying logged out')
          }
        }
        // UNAUTHORIZED, network error, etc. — stay logged out, no redirect.
      }
    }
    restoreSession()
  }, [router])

  const login = useCallback((user: User) => {
    setUser(user)
    startTransition(() => { router.push('/') })
  }, [router])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Cookie clear failed server-side; proceed with client cleanup regardless.
    }
    setUser(null)
    startTransition(() => { router.push('/login') })
  }, [router])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
