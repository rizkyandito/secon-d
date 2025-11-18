import { createContext,useContext,useEffect,useState } from 'react'
import { getJSON,setJSON } from '../utils/storage'
const AuthContext=createContext(null)
export function AuthProvider({children}){
  const [user,setUser]=useState(()=>getJSON('user',null))
  const [theme,setTheme]=useState(()=>localStorage.getItem('theme')||'light')
  useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark');localStorage.setItem('theme',theme)},[theme])
  const login=async(u,p)=>{if(u==='manpro_gacor'&&p==='CEO_dito'){const usr={username:'manpro_gacor'};setUser(usr);setJSON('user',usr);return{ok:true}}return{ok:false,message:'Username/password salah'}}
  const logout=()=>{setUser(null);setJSON('user',null)}
  return <AuthContext.Provider value={{user,login,logout,theme,setTheme}}>{children}</AuthContext.Provider>
}
export const useAuth=()=>useContext(AuthContext)