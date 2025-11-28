import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout, theme, setTheme } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-200/60 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/">
          <img 
            src="/images/logo.png" 
            alt="SeCon-D Logo" 
            width="48"
            height="48"
            loading="eager"
            decoding="async"
            className="h-12 w-12 rounded-full object-cover" 
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLink to="/" className="hover:text-brand">Home</NavLink>
          <NavLink to="/directory" className="hover:text-brand2">Directory</NavLink>
          <NavLink to="/about" className="hover:text-brand3">About Us</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <label htmlFor="theme-toggle" className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="theme-toggle"
              className="sr-only peer"
              checked={theme === 'dark'}
              onChange={setTheme}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </label>
          {user && <button onClick={logout} className="btn btn-outline">Keluar</button>}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="btn btn-outline">
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="flex flex-col items-center gap-4 py-4 text-sm font-medium">
            <NavLink to="/" className="hover:text-brand" onClick={() => setIsMenuOpen(false)}>Home</NavLink>
            <NavLink to="/directory" className="hover:text-brand2" onClick={() => setIsMenuOpen(false)}>Directory</NavLink>
            <NavLink to="/about" className="hover:text-brand3" onClick={() => setIsMenuOpen(false)}>About Us</NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}

