import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <div style={{color:'#fff',textAlign:'center',marginTop:'2rem'}}>Cargando...</div>
  if (!usuario) return <Navigate to="/login" />
  return children
}

export function AdminRoute({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <div style={{color:'#fff',textAlign:'center',marginTop:'2rem'}}>Cargando...</div>
  if (!usuario) return <Navigate to="/admin/login" />
  if (usuario.rol !== 'admin') return <Navigate to="/" />
  return children
}
