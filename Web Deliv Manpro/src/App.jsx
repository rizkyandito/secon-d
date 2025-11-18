import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Directory from './pages/Directory.jsx'
import About from './pages/About.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import MerchantPage from './pages/MerchantPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { useAuth } from './context/AuthContext.jsx'

export default function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      {user ? (
        <Routes>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      ) : (
        <>
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
        </>
      )}
    </BrowserRouter>
  )
}
