import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, form)
      login(data.token, data.usuario)
      if (data.usuario.rol === 'admin') navigate('/admin')
      else navigate('/sorteo')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally { setCargando(false) }
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.logo}>🎟️ <span style={s.gold}>GANA GANA</span> O <span style={s.gold}>GANA</span></div>
        <p style={s.sub}>Inicia sesión para continuar</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Correo electrónico</label>
            <input style={s.input} type="email" name="email" placeholder="correo@ejemplo.com" value={form.email} onChange={handleChange} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Contraseña</label>
            <input style={s.input} type="password" name="password" placeholder="Tu contraseña" value={form.password} onChange={handleChange} required />
          </div>
          <button style={{ ...s.btn, opacity: cargando ? 0.7 : 1 }} type="submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p style={s.footer}>¿No tienes cuenta? <Link to="/register" style={s.link}>Regístrate gratis</Link></p>
        <p style={{ ...s.footer, marginTop: '8px' }}>
          <Link to="/admin/login" style={{ color: '#444', textDecoration: 'none', fontSize: '12px' }}>Acceso administrador</Link>
        </p>
      </div>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', padding: '1rem' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '380px' },
  logo: { fontSize: '22px', fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: '6px' },
  gold: { color: '#D4AF37' },
  sub: { fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '1.5rem' },
  error: { background: '#2a0000', border: '1px solid #5a0000', color: '#ff6b6b', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '1rem' },
  field: { marginBottom: '14px' },
  label: { fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '5px' },
  input: { width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#fff', outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', background: '#D4AF37', color: '#1a1200', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '6px' },
  footer: { textAlign: 'center', fontSize: '13px', color: '#666', marginTop: '1.2rem' },
  link: { color: '#D4AF37', textDecoration: 'none' }
}
