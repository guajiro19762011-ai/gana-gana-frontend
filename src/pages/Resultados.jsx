import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function Resultados() {
  const [ganadores, setGanadores] = useState([])
  const [sorteo, setSorteo] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarResultados()
  }, [])

  const cargarResultados = async () => {
    try {
      const { data } = await axios.get(`${API}/sorteos/resultados`)
      setSorteo(data.sorteo)
      setGanadores(data.ganadores || [])
    } catch (err) {
      console.error(err)
    } finally { setCargando(false) }
  }

  const categoriaColor = (cat) => {
    const m = { 'Premio Mayor': '#D4AF37', '3 Primeras': '#9333ea', '3 Últimas': '#3b82f6', '2 Últimas': '#22c55e' }
    return m[cat] || '#888'
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.logo}>🎟️ <span style={s.gold}>GANA GANA</span> O <span style={s.gold}>GANA</span></div>
        <Link to="/sorteo" style={s.link}>← Volver al menú</Link>
      </div>

      <div style={s.hero}>
        <div style={s.heroTitle}>🏆 Resultados del Sorteo</div>
        {sorteo && (
          <>
            <div style={s.sorteoNombre}>{sorteo.nombre}</div>
            <div style={s.numeroGanador}>
              <div style={s.numeroLabel}>Número Ganador</div>
              <div style={s.numero}>{sorteo.numero_ganador || '----'}</div>
              {sorteo.jugado_at && (
                <div style={s.fecha}>{new Date(sorteo.jugado_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              )}
            </div>
          </>
        )}
      </div>

      {cargando ? (
        <div style={s.empty}>Cargando resultados...</div>
      ) : ganadores.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎲</div>
          <div>El sorteo aún no ha sido jugado</div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>Vuelve pronto para ver los ganadores</div>
        </div>
      ) : (
        <div style={s.ganadoresList}>
          <div style={s.sectionTitle}>🎉 Ganadores</div>
          {ganadores.map((g, i) => (
            <div key={i} style={{ ...s.ganadorCard, borderLeft: `4px solid ${categoriaColor(g.categoria)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ ...s.categoriaBadge, background: categoriaColor(g.categoria) + '22', color: categoriaColor(g.categoria) }}>
                    {g.categoria}
                  </span>
                  <div style={s.ganadorNombre}>{g.nombre}</div>
                  <div style={s.ganadorNumero}>Número: <strong style={{ letterSpacing: '2px' }}>{g.numero}</strong></div>
                </div>
                <div style={{ ...s.premioBig, color: categoriaColor(g.categoria) }}>
                  {g.categoria === '2 Últimas' ? 'Boleta gratis' : `$${(g.premio).toLocaleString('es-CO')}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={s.footer}>
        <div style={s.footerTitle}>¿Quieres participar en el próximo sorteo?</div>
        <Link to="/sorteo" style={s.btnRegister}>🎟️ Comprar boleta</Link>
      </div>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', background: '#0f0f0f', color: '#fff', padding: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  logo: { fontSize: '20px', fontWeight: '600' },
  gold: { color: '#D4AF37' },
  link: { color: '#D4AF37', textDecoration: 'none', fontSize: '13px' },
  hero: { textAlign: 'center', marginBottom: '2rem' },
  heroTitle: { fontSize: '28px', fontWeight: '700', marginBottom: '8px' },
  sorteoNombre: { fontSize: '14px', color: '#888', marginBottom: '20px' },
  numeroGanador: { background: 'linear-gradient(135deg, #2a1f00, #4a3800)', borderRadius: '20px', padding: '24px', display: 'inline-block', minWidth: '200px' },
  numeroLabel: { fontSize: '12px', color: '#D4AF37', opacity: 0.8, marginBottom: '8px' },
  numero: { fontSize: '48px', fontWeight: '700', color: '#D4AF37', letterSpacing: '8px' },
  fecha: { fontSize: '12px', color: '#D4AF37', opacity: 0.6, marginTop: '8px' },
  ganadoresList: { maxWidth: '600px', margin: '0 auto' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '14px', textAlign: 'center' },
  ganadorCard: { background: '#1a1a1a', borderRadius: '12px', padding: '16px', marginBottom: '10px' },
  categoriaBadge: { fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', display: 'inline-block', marginBottom: '8px' },
  ganadorNombre: { fontSize: '16px', fontWeight: '600', marginBottom: '4px' },
  ganadorNumero: { fontSize: '13px', color: '#888' },
  premioBig: { fontSize: '18px', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#666', padding: '4rem', fontSize: '14px' },
  footer: { textAlign: 'center', marginTop: '3rem', padding: '2rem', background: '#1a1a1a', borderRadius: '16px' },
  footerTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '14px' },
  btnRegister: { background: '#D4AF37', color: '#1a1200', padding: '12px 28px', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '15px' },
}
