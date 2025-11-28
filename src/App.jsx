import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Navbar from './components/Navbar.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import { useAuth } from './context/AuthContext.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Directory = lazy(() => import('./pages/Directory.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const AdminPanel = lazy(() => import('./pages/AdminPanel.jsx'))
const MerchantPage = lazy(() => import('./pages/MerchantPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))

export default function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        {user ? (
          <Routes>
            <Route path="/cuegua" element={<AdminPanel />} />
            <Route path="/" element={<Navigate to="/cuegua" replace />} />
            <Route path="*" element={<Navigate to="/cuegua" replace />} />
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
                <Route path="/cuegua" element={<LoginPage />} />
              </Routes>
            </main>
          </>
        )}
      </Suspense>
    </BrowserRouter>
  )
}
