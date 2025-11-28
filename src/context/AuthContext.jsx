import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { getJSON, setJSON } from '../utils/storage'

const AuthContext = createContext(null)

const ADMIN_ACCOUNTS = [
  { username: 'manpro_gacor', password: 'CEO_dito' },
  { username: 'manpro_gacor', password: 'NOE_luqman' },
  { username: 'manpro_gacor', password: 'UIM_hazqir' },
  { username: 'manpro_gacor', password: 'GOH_melly' },
  { username: 'manpro_gacor', password: 'AKK_kanaya' },
  { username: 'manpro_gacor', password: 'EKA_adel' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getJSON('user', null))
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const login = useCallback(async (u, p) => {
    const matched = ADMIN_ACCOUNTS.find(
      (account) => account.username === u && account.password === p
    )
    if (matched) {
      const usr = { username: matched.username }
      setUser(usr)
      setJSON('user', usr)
      return { ok: true }
    }
    return { ok: false, message: 'Username/password salah' }
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