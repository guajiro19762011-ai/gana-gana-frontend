import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('gg_token')
    const u = localStorage.getItem('gg_usuario')
    if (t && u) { setToken(t); setUsuario(JSON.parse(u)) }
    setCargando(false)
  }, [])

  const login = (token, usuario) => {
    localStorage.setItem('gg_token', token)
    localStorage.setItem('gg_usuario', JSON.stringify(usuario))
    setToken(token); setUsuario(usuario)
  }

  const logout = () => {
    localStorage.removeItem('gg_token')
    localStorage.removeItem('gg_usuario')
    setToken(null); setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
