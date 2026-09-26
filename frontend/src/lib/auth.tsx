import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, setUnauthorizedHandler, tokenStore } from './api'
import type { AuthResponse, Teacher } from './types'

interface AuthState {
  teacher: Teacher | null
  loading: boolean
  signIn: (res: AuthResponse) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState<boolean>(() => !!tokenStore.get())
  const queryClient = useQueryClient()

  const signOut = useCallback(() => {
    tokenStore.clear()
    setTeacher(null)
    queryClient.clear()
  }, [queryClient])

  const signIn = useCallback((res: AuthResponse) => {
    tokenStore.set(res.token)
    setTeacher(res.teacher)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(signOut)
    if (!tokenStore.get()) return
    api.me()
      .then(setTeacher)
      .catch(() => signOut())
      .finally(() => setLoading(false))
  }, [signOut])

  return (
    <AuthContext.Provider value={{ teacher, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
