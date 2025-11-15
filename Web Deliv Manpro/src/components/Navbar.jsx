import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar(){
  const { user, logout, theme, setTheme } = useAuth()

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-200/60 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-black text-xl tracking-tight">
          <span className="text-brand2">Se</span>Con<span className="text-brand3">-D</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLink to="/" className="hover:text-brand">Home</NavLink>
          <NavLink to="/directory" className="hover:text-brand2">Directory</NavLink>
          <NavLink to="/about" className="hover:text-brand3">About Us</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="btn btn-outline">{theme==='dark'?'☀️':'🌙'}</button>
          {user && <button onClick={logout} className="btn btn-outline">Keluar</button>}
        </div>
      </div>
    </header>
  )
}
