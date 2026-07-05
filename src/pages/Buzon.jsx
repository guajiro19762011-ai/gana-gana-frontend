import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

export default function Buzon() {
  const { usuario, token, logout } = useAuth()
  const navigate = useNavigate()
  const [mensajes, setMensajes] = useState([])
  const [nuevo, setNuevo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef(null)

  const headers = { Authorization: `Bearer ${token}` }

  const cargar = async () => {
    try {
      const { data } = await axios.get(`${API}/mensajes/mis-mensajes`, { headers })
      setMensajes(data)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 10000)
    return () => clearInterval(interval)
  }, [])

  const enviar = async () => {
    if (!nuevo.trim()) return
    setEnviando(true)
    try {
      await axios.post(`${API}/mensajes`, { contenido: nuevo }, { headers })
      setNuevo('')
      cargar()
    } catch (err) { alert('Error al enviar mensaje') }
    finally { setEnviando(false) }
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <div style={s.logo}>💬 <span style={s.gold}>Buzón</span></div>
          <div style={s.sub}>Comunícate con el administrador</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link to="/sorteo" style={s.linkBtn}>← Volver</Link>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/login') }}>Salir</button>
        </div>
      </div>

      <div style={s.chatBox}>
        {mensajes.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <div>No hay mensajes aún. ¡Escribe al administrador!</div>
          </div>
        ) : mensajes.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.remitente === 'cliente' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
            <div style={{ ...s.burbuja, background: m.remitente === 'cliente' ? '#2a1f00' : '#1a1a1a', border: `1px solid ${m.remitente === 'cliente' ? '#D4AF3740' : '#2a2a2a'}` }}>
              {m.remitente === 'admin' && <div style={{ fontSize: '11px', color: '#D4AF37', fontWeight: '600', marginBottom: '4px' }}>👑 Administrador</div>}
              <div style={{ fontSize: '14px', color: '#fff' }}>{m.contenido}</div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '6px', textAlign: 'right' }}>{new Date(m.created_at).toLocaleString('es-CO')}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputArea}>
        <input
          style={s.input}
          placeholder="Escribe tu mensaje..."
          value={nuevo}
          onChange={e => setNuevo(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && enviar()}
        />
        <button style={{ ...s.btn, opacity: enviando ? 0.7 : 1 }} onClick={enviar} disabled={enviando}>
          {enviando ? '...' : '📤 Enviar'}
        </button>
      </div>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', background: '#0f0f0f', padding: '1rem', color: '#fff', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #2a2a2a' },
  logo: { fontSize: '20px', fontWeight: '600' },
  gold: { color: '#D4AF37' },
  sub: { fontSize: '12px', color: '#888', marginTop: '3px' },
  linkBtn: { fontSize: '12px', color: '#D4AF37', textDecoration: 'none', background: '#2a1f00', padding: '6px 12px', borderRadius: '20px' },
  logoutBtn: { fontSize: '12px', color: '#888', background: 'none', border: '1px solid #333', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' },
  chatBox: { flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', padding: '10px 0' },
  burbuja: { borderRadius: '12px', padding: '10px 14px', maxWidth: '75%' },
  inputArea: { display: 'flex', gap: '8px', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a2a2a' },
  input: { flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#fff', outline: 'none' },
  btn: { background: '#D4AF37', color: '#1a1200', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  empty: { textAlign: 'center', color: '#666', padding: '4rem', fontSize: '13px' },
}
