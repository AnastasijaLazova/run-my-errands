import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi, meApi } from '../api/endpoints'
import { tokenStore } from '../api/client'
import type { Me, SignupInput } from '../api/types'

interface AuthState {
  me: Me | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (b: SignupInput) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    if (!tokenStore.get()) { setMe(null); return }
    try { setMe(await meApi.get()) } catch { tokenStore.clear(); setMe(null) }
  }, [])

  useEffect(() => { refreshMe().finally(() => setLoading(false)) }, [refreshMe])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    tokenStore.set(res)
    await refreshMe()
  }
  const register = async (b: SignupInput) => {
    const res = await authApi.signup(b)
    tokenStore.set(res)
    await refreshMe()
  }
  const logout = () => {
    // Revoke server-side too; local sign-out shouldn't wait on (or fail with) the network.
    authApi.logout().catch(() => {}).finally(() => tokenStore.clear())
    setMe(null)
  }

  return <Ctx.Provider value={{ me, loading, login, register, logout, refreshMe }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>')
  return v
}
