import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Directory from './pages/Directory.jsx'
import About from './pages/About.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import MerchantPage from './pages/MerchantPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { useData } from './context/DataContext.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'

export default function App() {
  const { user } = useAuth()
  const { isLoading } = useData()

  if (isLoading) {
    return <LoadingScreen />
  }

  // Jika admin login, langsung render AdminPanel saja
  if (user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          {/* kalau admin buka / atau halaman lain → redirect ke /admin */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  // Jika belum login → tampilan normal
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/about" element={<About />} />
          <Route path="/merchant/:id" element={<MerchantPage />} />
          <Route path="/admin" element={<LoginPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
