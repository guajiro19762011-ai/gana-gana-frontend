import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Register from './pages/Register'
import Login from './pages/Login'
import Sorteo from './pages/Sorteo'
import Resultados from './pages/Resultados'
import QuienesSomos from './pages/QuienesSomos'
import Buzon from './pages/Buzon'
import AdminLogin from './pages/admin/AdminLogin'
import AdminPanel from './pages/admin/AdminPanel'
// Mantener el backend despierto
const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '')
if (BACKEND) {
  setInterval(() => {
    fetch(`${BACKEND}/health`).catch(() => {})
  }, 14 * 60 * 1000) // cada 14 minutos
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<QuienesSomos />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/resultados" element={<Resultados />} />
          <Route path="/sorteo" element={<ProtectedRoute><Sorteo /></ProtectedRoute>} />
          <Route path="/buzon" element={<ProtectedRoute><Buzon /></ProtectedRoute>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
