import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout, theme, setTheme } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-200/60 dark:border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/images/logo.png"
            alt="SeCon-D Logo"
            width="56"
            height="56"
            loading="eager"
            decoding="async"
            className="h-14 w-14 rounded-2xl object-cover shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
          <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-brand to-brand2 bg-clip-text text-transparent">
            SeCon-D
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-brand to-brand2 text-white shadow-md'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            🏠 Home
          </NavLink>
          <NavLink
            to="/directory"
            className={({ isActive }) =>
              `px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-brand to-brand2 text-white shadow-md'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            📋 Directory
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-brand to-brand2 text-white shadow-md'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            ℹ️ About
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={setTheme}
            className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-110 transition-all duration-300 shadow-md"
            aria-label="Toggle theme"
          >
            <span className="text-xl">
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </button>

          {user && (
            <button onClick={logout} className="btn btn-outline btn-sm">
              Keluar
            </button>
          )}

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:scale-110 transition-all duration-300"
            >
              <span className="text-xl">{isMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-200/60 dark:border-white/10 animate-slide-in">
          <nav className="flex flex-col gap-2 p-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand to-brand2 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              🏠 Home
            </NavLink>
            <NavLink
              to="/directory"
              className={({ isActive }) =>
                `px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand to-brand2 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              📋 Directory
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand to-brand2 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              ℹ️ About Us
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}

