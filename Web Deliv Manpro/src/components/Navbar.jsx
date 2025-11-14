import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar(){
  const { user, login, logout, theme, setTheme } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [cred, setCred] = useState({ username:'', password:'' })
  const navigate = useNavigate()

  const doLogin = async (e)=>{
    e.preventDefault()
    const r = await login(cred.username, cred.password)
    if(!r.ok) return alert(r.message)
    setShowLogin(false)
    navigate('/admin', { replace: true })
  }

  return (
    <>
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
            {user ? <button onClick={logout} className="btn btn-outline">Keluar</button> : <button onClick={()=>setShowLogin(true)} className="btn btn-primary">Masuk</button>}
          </div>
        </div>
      </header>

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="card max-w-md w-full">
            <div className="text-center wp-h2">Login Admin</div>
            <form onSubmit={doLogin} className="space-y-3 mt-2">
              <input value={cred.username} onChange={e=>setCred({...cred,username:e.target.value})} placeholder="Username" className="w-full border rounded-2xl px-4 py-3 dark:bg-slate-800"/>
              <input type="password" value={cred.password} onChange={e=>setCred({...cred,password:e.target.value})} placeholder="Password" className="w-full border rounded-2xl px-4 py-3 dark:bg-slate-800"/>
              <button className="btn btn-primary w-full">Masuk</button>
            </form>
            <div className="text-xs text-slate-500 mt-2 text-center">Demo: admin / admin</div>
            <button className="mt-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 w-full"
              onClick={()=>setShowLogin(false)}>Tutup</button>
          </div>
        </div>
      )}
    </>
  )
}