import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { getJSON, setJSON } from '../utils/storage'
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getJSON('user', null))
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const login = useCallback(async (u, p) => {
    // Validasi login via Supabase (server-side)
    if (!isSupabaseConfigured() || !supabase) {
      return { ok: false, message: 'Database tidak terkonfigurasi' }
    }

    try {
      const { data, error } = await supabase.rpc('admin_login', {
        input_username: u,
        input_password: p
      })

      if (error) {
        console.error('Login error:', error)
        return { ok: false, message: 'Terjadi kesalahan saat login' }
      }

      if (data && data.ok) {
        setUser(data.user)
        setJSON('user', data.user)
        return { ok: true }
      }

      return { ok: false, message: data?.message || 'Username/password salah' }
    } catch (err) {
      console.error('Login exception:', err)
      return { ok: false, message: 'Terjadi kesalahan saat login' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setJSON('user', null)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      theme,
      setTheme: toggleTheme,
    }),
    [user, login, logout, theme, toggleTheme]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)