import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ nombre: '', celular: '', email: '', password: '', confirmar: '', referido_por: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useState(() => {
    const ref = params.get('ref')
    if (ref) setForm(f => ({ ...f, referido_por: ref }))
  }, [])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden')
    if (form.password.length < 6) return setError('La contraseña debe tener mínimo 6 caracteres')
    setCargando(true)
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        nombre: form.nombre, celular: form.celular, email: form.email,
        password: form.password, referido_por: form.referido_por || undefined
      })
      login(data.token, data.usuario)
      navigate('/sorteo')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally { setCargando(false) }
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.logo}>🎟️ <span style={s.gold}>GANA GANA</span> O <span style={s.gold}>GANA</span></div>
        <p style={s.sub}>Crea tu cuenta y empieza a ganar</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {[
            { name: 'nombre', label: 'Nombre completo', placeholder: 'Tu nombre completo', type: 'text' },
            { name: 'celular', label: 'Número de celular', placeholder: '3001234567', type: 'text' },
            { name: 'email', label: 'Correo electrónico', placeholder: 'correo@ejemplo.com', type: 'email' },
            { name: 'password', label: 'Contraseña', placeholder: 'Mínimo 6 caracteres', type: 'password' },
            { name: 'confirmar', label: 'Confirmar contraseña', placeholder: 'Repite tu contraseña', type: 'password' },
          ].map(f => (
            <div key={f.name} style={s.field}>
              <label style={s.label}>{f.label}</label>
              <input style={s.input} name={f.name} type={f.type} placeholder={f.placeholder} value={form[f.name]} onChange={handleChange} required />
            </div>
          ))}
          <div style={s.field}>
            <label style={s.label}>Código de referido <span style={s.opc}>(opcional)</span></label>
            <input style={s.input} name="referido_por" placeholder="GG-XXXX" value={form.referido_por} onChange={handleChange} />
          </div>
          <button style={{ ...s.btn, opacity: cargando ? 0.7 : 1 }} type="submit" disabled={cargando}>
            {cargando ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
        <p style={s.footer}>¿Ya tienes cuenta? <Link to="/login" style={s.link}>Inicia sesión</Link></p>
      </div>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', padding: '1rem' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px' },
  logo: { fontSize: '22px', fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: '6px' },
  gold: { color: '#D4AF37' },
  sub: { fontSize: '13px', color: '#888', textAlign: 'center', marginBottom: '1.5rem' },
  error: { background: '#2a0000', border: '1px solid #5a0000', color: '#ff6b6b', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '1rem' },
  field: { marginBottom: '14px' },
  label: { fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '5px' },
  opc: { color: '#666', fontSize: '11px' },
  input: { width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#fff', outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', background: '#D4AF37', color: '#1a1200', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '6px' },
  footer: { textAlign: 'center', fontSize: '13px', color: '#666', marginTop: '1.2rem' },
  link: { color: '#D4AF37', textDecoration: 'none' }
}
