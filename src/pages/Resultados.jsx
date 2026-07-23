import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function Resultados() {
  const [sorteos, setSorteos] = useState([])
  const [seleccionado, setSeleccionado] = useState(null)
  const [ganadores, setGanadores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoGanadores, setCargandoGanadores] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await axios.get(`${API}/sorteos/historial-publico`)
        setSorteos(data || [])
        if (data && data.length > 0) {
          setSeleccionado(data[0])
          cargarGanadores(data[0].id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  const cargarGanadores = async (sorteoId) => {
    setCargandoGanadores(true)
    try {
      const { data } = await axios.get(`${API}/sorteos/ganadores-sorteo/${sorteoId}`)
      setGanadores(data || [])
    } catch (err) {
      console.error(err)
      setGanadores([])
    } finally {
      setCargandoGanadores(false) }
  }

  const seleccionarSorteo = (s) => {
    setSeleccionado(s)
    cargarGanadores(s.id)
  }

  const categoriaColor = (cat) => {
    if (cat === 'Premio Mayor') return '#D4AF37'
    if (cat === '3 Primeras') return '#9333ea'
    if (cat === '3 Últimas') return '#3b82f6'
    if (cat === '2 Últimas') return '#22c55e'
    return '#888'
  }

  const categoriaEmoji = (cat) => {
    if (cat === 'Premio Mayor') return '🥇'
    if (cat === '3 Primeras') return '🥈'
    if (cat === '3 Últimas') return '🥉'
    if (cat === '2 Últimas') return '🎁'
    return '🏆'
  }

  const porCategoria = {
    'Premio Mayor': ganadores.filter(g => g.categoria === 'Premio Mayor'),
    '3 Primeras': ganadores.filter(g => g.categoria === '3 Primeras'),
    '3 Últimas': ganadores.filter(g => g.categoria === '3 Últimas'),
    '2 Últimas': ganadores.filter(g => g.categoria === '2 Últimas'),
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.logo}>🏆 <span style={s.gold}>Resultados</span></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/sorteo" style={s.linkBtn}>🎲 Volver al sorteo</Link>
          <Link to="/login" style={s.btnPrimary}>Entrar</Link>
        </div>
      </div>

      {cargando ? (
        <div style={s.empty}>Cargando resultados...</div>
      ) : sorteos.length === 0 ? (
        <div style={s.emptyCard}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎲</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Aún no hay resultados</div>
          <div style={{ fontSize: '14px', color: '#666' }}>El primer sorteo está en curso. ¡Compra tu boleta y participa!</div>
          <Link to="/login" style={{ ...s.btnPrimary, display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>
            🎟️ Comprar boleta
          </Link>
        </div>
      ) : (
        <div>
          {/* Selector de sorteos */}
          <div style={s.card}>
            <div style={s.cardTitle}>📋 Historial de sorteos</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {sorteos.map(s2 => (
                <button key={s2.id} style={{ ...s.sorteoBtn, ...(seleccionado?.id === s2.id ? s.sorteoBtnActive : {}) }} onClick={() => seleccionarSorteo(s2)}>
                  {s2.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Info del sorteo seleccionado */}
          {seleccionado && (
            <div style={s.sorteoCard}>
              <div style={s.sorteoNombre}>{seleccionado.nombre}</div>
              <div style={s.numeroGanador}>{seleccionado.numero_ganador}</div>
              <div style={s.sorteoFecha}>
                Jugado el {new Date(seleccionado.jugado_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          )}

          {/* Ganadores */}
          {cargandoGanadores ? (
            <div style={s.empty}>Cargando ganadores...</div>
          ) : ganadores.length === 0 ? (
            <div style={{ ...s.emptyCard, padding: '2rem' }}>
              <div style={{ fontSize: '14px', color: '#666' }}>No se registraron ganadores en este sorteo.</div>
            </div>
          ) : (
            <div>
              {/* Stats */}
              <div style={s.statsGrid}>
                <div style={s.stat}>
                  <div style={{ ...s.statVal, color: '#D4AF37' }}>{ganadores.length}</div>
                  <div style={s.statLabel}>Total ganadores</div>
                </div>
                <div style={s.stat}>
                  <div style={{ ...s.statVal, color: '#4ade80' }}>
                    ${ganadores.filter(g => g.premio > 0).reduce((acc, g) => acc + g.premio, 0).toLocaleString('es-CO')}
                  </div>
                  <div style={s.statLabel}>Total repartido</div>
                </div>
                <div style={s.stat}>
                  <div style={{ ...s.statVal, color: '#22c55e' }}>{porCategoria['2 Últimas'].length}</div>
                  <div style={s.statLabel}>Boletas gratis</div>
                </div>
              </div>

              {/* Ganadores por categoría */}
              {Object.entries(porCategoria).map(([categoria, lista]) => (
                lista.length > 0 && (
                  <div key={categoria} style={{ ...s.categoriaCard, borderLeft: `3px solid ${categoriaColor(categoria)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{categoriaEmoji(categoria)}</span>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: categoriaColor(categoria) }}>{categoria}</div>
                          <div style={{ fontSize: '11px', color: '#666' }}>{lista.length} ganador(es)</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: '700', color: categoriaColor(categoria), fontSize: '14px' }}>
                        {categoria === '2 Últimas' ? '🎟️ Boleta gratis' : `$${lista[0]?.premio?.toLocaleString('es-CO')} c/u`}
                      </div>
                    </div>
                    {lista.map((g, i) => (
                      <div key={i} style={s.ganadorRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ background: '#1a1a1a', border: `1px solid ${categoriaColor(g.categoria)}40`, borderRadius: '8px', padding: '6px 10px', fontSize: '16px', fontWeight: '700', letterSpacing: '3px', color: categoriaColor(g.categoria) }}>
                            {g.numero}
                          </div>
                          <div style={{ fontSize: '13px', color: '#ccc' }}>{g.usuarios?.nombre || 'Ganador'}</div>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: categoriaColor(g.categoria) }}>
                          {categoria === '2 Últimas' ? '🎟️ Boleta gratis' : `$${g.premio.toLocaleString('es-CO')}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>
          )}

          <Link to="/login" style={{ ...s.btnPrimary, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '16px', padding: '14px' }}>
            🎟️ Participar en el próximo sorteo
          </Link>
        </div>
      )}
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', background: '#0f0f0f', padding: '1.5rem', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #2a2a2a' },
  logo: { fontSize: '20px', fontWeight: '600' },
  gold: { color: '#D4AF37' },
  linkBtn: { fontSize: '12px', color: '#D4AF37', textDecoration: 'none', background: '#2a1f00', padding: '6px 12px', borderRadius: '20px' },
  btnPrimary: { background: '#D4AF37', color: '#1a1200', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' },
  empty: { textAlign: 'center', color: '#666', padding: '4rem', fontSize: '14px' },
  emptyCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '3rem', textAlign: 'center' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
  cardTitle: { fontSize: '14px', fontWeight: '600', marginBottom: '12px' },
  sorteoBtn: { padding: '6px 14px', fontSize: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', color: '#888' },
  sorteoBtnActive: { background: '#2a1f00', borderColor: '#D4AF37', color: '#D4AF37', fontWeight: '600' },
  sorteoCard: { background: 'linear-gradient(135deg, #1a1200, #2a1f00)', border: '1px solid #D4AF3740', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '16px' },
  sorteoNombre: { fontSize: '14px', color: '#888', marginBottom: '8px' },
  numeroGanador: { fontSize: '48px', fontWeight: '700', color: '#D4AF37', letterSpacing: '10px', marginBottom: '8px' },
  sorteoFecha: { fontSize: '12px', color: '#666' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' },
  stat: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '14px', textAlign: 'center' },
  statVal: { fontSize: '20px', fontWeight: '700', marginBottom: '4px' },
  statLabel: { fontSize: '11px', color: '#666' },
  categoriaCard: { background: '#1a1a1a', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
  ganadorRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #2a2a2a' },
}
