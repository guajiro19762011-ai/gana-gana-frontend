import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

export default function Sorteo() {
  const { usuario, token, logout } = useAuth()
  const navigate = useNavigate()
  const [sorteo, setSorteo] = useState(null)
  const [tab, setTab] = useState('sorteo')
  const [busqueda, setBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [boletaEncontrada, setBoletaEncontrada] = useState(null)
  const [mensajeBusqueda, setMensajeBusqueda] = useState('')
  const [modoVenta, setModoVenta] = useState(false)
  const [nombreCliente, setNombreCliente] = useState('')
  const [celularCliente, setCelularCliente] = useState('')
  const [comprando, setComprando] = useState(false)
  const [saldo, setSaldo] = useState(0)
  const [rolUsuario, setRolUsuario] = useState('cliente')
  const [solicitudRevendedor, setSolicitudRevendedor] = useState(null)
  const [mensajeSolicitud, setMensajeSolicitud] = useState('')
  const [misBoletas, setMisBoletas] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [metodo, setMetodo] = useState('')
  const [monto, setMonto] = useState('')
  const [comprobante, setComprobante] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensajeRecarga, setMensajeRecarga] = useState('')
  const [retiroMonto, setRetiroMonto] = useState('')
  const [retiroMetodo, setRetiroMetodo] = useState('')
  const [retiroDatos, setRetiroDatos] = useState('')
  const [enviandoRetiro, setEnviandoRetiro] = useState(false)
  const [mensajeRetiro, setMensajeRetiro] = useState('')
  const [misRetiros, setMisRetiros] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const intervalRef = useRef(null)

  const headers = { Authorization: `Bearer ${token}` }
  const pad = n => String(n).padStart(4, '0')

  const cargarSorteo = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/sorteos/activo`, { headers })
      setSorteo(data.sorteo)
    } catch (err) { console.error(err) }
  }, [token])

  const cargarBilletera = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/billetera`, { headers })
      setSaldo(data.saldo)
      setMovimientos(data.movimientos || [])
      setRolUsuario(data.rol || 'cliente')
      setSolicitudRevendedor(data.solicitud_revendedor)
    } catch (err) { console.error(err) }
  }, [token])

  const cargarMisBoletas = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/sorteos/mis-boletas`, { headers })
      setMisBoletas(data)
    } catch (err) { console.error(err) }
  }, [token])

  const cargarAnuncios = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/anuncios`, { headers })
      setAnuncios(data)
    } catch (err) { console.error(err) }
  }, [token])

  const cargarMisRetiros = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/retiros/mis-retiros`, { headers })
      setMisRetiros(data)
    } catch (err) { console.error(err) }
  }, [token])

  useEffect(() => {
    cargarSorteo()
    cargarBilletera()
    cargarMisBoletas()
    cargarAnuncios()
    cargarMisRetiros()
    intervalRef.current = setInterval(cargarSorteo, 10000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const buscarNumero = async () => {
    if (!/^\d{4}$/.test(busqueda)) return alert('Ingresa exactamente 4 dígitos')
    setBuscando(true)
    setBoletaEncontrada(null)
    setMensajeBusqueda('')
    try {
      const { data } = await axios.get(`${API}/sorteos/buscar/${busqueda}`, { headers })
      setBoletaEncontrada(data.boleta)
    } catch (err) {
      setMensajeBusqueda(err.response?.data?.error || 'Error al buscar')
    } finally { setBuscando(false) }
  }

  const tomarAleatoria = async () => {
    setBuscando(true)
    setBoletaEncontrada(null)
    setMensajeBusqueda('')
    try {
      const { data } = await axios.get(`${API}/sorteos/aleatoria`, { headers })
      setBoletaEncontrada(data.boleta)
    } catch (err) {
      setMensajeBusqueda(err.response?.data?.error || 'Error al obtener boleta')
    } finally { setBuscando(false) }
  }

  const confirmarCompra = async () => {
    if (!boletaEncontrada) return
    if (saldo < 5000) return alert('Saldo insuficiente. Recarga tu billetera.')
    if (modoVenta && (!nombreCliente || !celularCliente)) return alert('Ingresa nombre y celular del cliente')
    setComprando(true)
    try {
      let data
      if (modoVenta) {
        const res = await axios.post(`${API}/sorteos/vender`, { boleta_id: boletaEncontrada.id, nombre_cliente: nombreCliente, celular_cliente: celularCliente }, { headers })
        data = res.data
      } else {
        const res = await axios.post(`${API}/sorteos/comprar`, { boleta_id: boletaEncontrada.id }, { headers })
        data = res.data
      }
      setSaldo(data.saldo_nuevo)
      setBoletaEncontrada(null)
      setBusqueda('')
      setNombreCliente('')
      setCelularCliente('')
      cargarMisBoletas()
      alert(`✅ ¡Boleta ${modoVenta ? 'vendida' : 'comprada'}! Bono: +${modoVenta ? '$1.000' : '$500'}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar')
    } finally { setComprando(false) }
  }

  const descargarBoleta = async (boleta) => {
    const { generarBoletaPNG } = await import('../utils/generarBoleta')
    await generarBoletaPNG(boleta, usuario, sorteo)
  }

  const solicitarRevendedor = async () => {
    try {
      await axios.post(`${API}/sorteos/solicitar-revendedor`, {}, { headers })
      setSolicitudRevendedor('pendiente')
      setMensajeSolicitud('✅ Solicitud enviada.')
    } catch (err) {
      setMensajeSolicitud('❌ ' + (err.response?.data?.error || 'Error'))
    }
  }

  const solicitarRecarga = async () => {
    if (!metodo) return alert('Selecciona un método')
    if (!monto || Number(monto) < 5000) return alert('Monto mínimo $5.000')
    setEnviando(true)
    try {
      await axios.post(`${API}/billetera/recargar`, { monto: Number(monto), metodo, comprobante_url: comprobante || null }, { headers })
      setMensajeRecarga('✅ Solicitud enviada.')
      setMonto(''); setMetodo(''); setComprobante('')
      setTimeout(() => setMensajeRecarga(''), 5000)
    } catch (err) {
      setMensajeRecarga('❌ ' + (err.response?.data?.error || 'Error'))
    } finally { setEnviando(false) }
  }

  const solicitarRetiro = async () => {
    if (!retiroMetodo) return alert('Selecciona un método')
    if (!retiroMonto || Number(retiroMonto) < 10000) return alert('Retiro mínimo $10.000')
    if (!retiroDatos) return alert('Ingresa los datos de pago')
    setEnviandoRetiro(true)
    try {
      await axios.post(`${API}/retiros`, { monto: Number(retiroMonto), metodo: retiroMetodo, datos_pago: retiroDatos }, { headers })
      setMensajeRetiro('✅ Solicitud enviada.')
      setSaldo(prev => prev - Number(retiroMonto))
      setRetiroMonto(''); setRetiroMetodo(''); setRetiroDatos('')
      cargarMisRetiros()
      setTimeout(() => setMensajeRetiro(''), 5000)
    } catch (err) {
      setMensajeRetiro('❌ ' + (err.response?.data?.error || 'Error'))
    } finally { setEnviandoRetiro(false) }
  }

  const vendidas = sorteo?.total_boletas || 0
  const pct = ((vendidas / 1000) * 100).toFixed(1)
  const esRevendedor = rolUsuario === 'revendedor'
  const metodos = [
    { id: 'nequi', emoji: '📱', label: 'Nequi', info: 'Transfiere a: 300 000 0000' },
    { id: 'daviplata', emoji: '🏦', label: 'Daviplata', info: 'Transfiere a: 300 000 0001' },
    { id: 'usdt', emoji: '₮', label: 'USDT', info: 'Red TRC20: TXxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
  ]

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <div style={s.logo}>🎟️ <span style={s.gold}>GANA GANA</span> O <span style={s.gold}>GANA</span></div>
          <div style={s.sub}>
            Hola, {usuario?.nombre} · <span style={s.gold}>{usuario?.codigo_referido}</span>
            {esRevendedor && <span style={s.revendedorBadge}>🤝 Revendedor</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={s.saldoBadge}>💰 ${saldo.toLocaleString('es-CO')}</div>
          <Link to="/buzon" style={s.linkBtn}>💬 Buzón</Link>
          <Link to="/resultados" style={s.linkBtn}>🏆 Resultados</Link>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/login') }}>Salir</button>
        </div>
      </div>

      {anuncios.length > 0 && (
        <div style={s.anunciosWrap}>
          <div style={s.anunciosTitulo}>📢 Anuncios</div>
          {anuncios.map(a => (
            <div key={a.id} style={s.anuncioCard}>
              <div style={s.anuncioTitulo}>{a.titulo}</div>
              <div style={s.anuncioContenido}>{a.contenido}</div>
            </div>
          ))}
        </div>
      )}

      <div style={s.tabs}>
        {[
          { id: 'sorteo', label: '🎲 Sorteo' },
          { id: 'premios', label: '🏆 Premios' },
          { id: 'billetera', label: '💰 Billetera' },
          { id: 'misboletas', label: '🎟️ Mis boletas' },
          { id: 'perfil', label: '👤 Perfil' },
        ].map(t => (
          <button key={t.id} style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sorteo' && (
        <div>
          <div style={s.statsGrid}>
            <div style={s.stat}><div style={s.statLabel}>Sorteo</div><div style={{ ...s.statVal, color: '#D4AF37' }}>#{String(sorteo?.id || 1).padStart(4,'0')}</div></div>
            <div style={s.stat}><div style={s.statLabel}>Vendidas</div><div style={s.statVal}>{vendidas}</div></div>
            <div style={s.stat}><div style={s.statLabel}>Disponibles</div><div style={{ ...s.statVal, color: '#4ade80' }}>{1000 - vendidas}</div></div>
          </div>
          <div style={s.progressBar}><div style={{ ...s.progressFill, width: pct + '%' }} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={s.progressText}>{pct}% vendido</div>
            <div style={{ fontSize: '11px', color: '#555' }}>🔄 Auto-actualiza cada 10s</div>
          </div>

          {esRevendedor && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button style={{ ...s.modeBtn, ...(modoVenta === false ? s.modeBtnActive : {}) }} onClick={() => setModoVenta(false)}>🛒 Compra personal</button>
              <button style={{ ...s.modeBtn, ...(modoVenta === true ? s.modeBtnActive : {}) }} onClick={() => setModoVenta(true)}>🤝 Vender a cliente</button>
            </div>
          )}

          <div style={s.card}>
            <div style={s.cardTitle}>🔍 Buscar boleta por número</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>
              Ingresa cualquier número de 4 cifras y te mostraremos la boleta completa que lo contiene.
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <input
                style={{ ...s.input, flex: 1, fontSize: '22px', letterSpacing: '6px', textAlign: 'center', minWidth: '120px' }}
                placeholder="0000" maxLength={4} value={busqueda}
                onChange={e => { setBusqueda(e.target.value.replace(/[^0-9]/g, '')); setBoletaEncontrada(null); setMensajeBusqueda('') }}
                onKeyPress={e => e.key === 'Enter' && buscarNumero()}
              />
              <button style={{ ...s.btnPrimary, opacity: buscando ? 0.7 : 1 }} onClick={buscarNumero} disabled={buscando}>
                {buscando ? '...' : '🔍 Buscar'}
              </button>
              <button style={{ ...s.btnSecondary, opacity: buscando ? 0.7 : 1 }} onClick={tomarAleatoria} disabled={buscando}>
                ⚡ Aleatoria
              </button>
            </div>

            {mensajeBusqueda && (
              <div style={{ background: '#2a0000', border: '1px solid #5a0000', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#f87171', marginBottom: '12px' }}>
                ❌ {mensajeBusqueda}
              </div>
            )}

            {boletaEncontrada && (
              <div style={{ background: '#0a1a0a', border: '1px solid #22c55e40', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px', color: '#22c55e' }}>✅ Boleta #{String(boletaEncontrada.numero_boleta).padStart(3,'0')} disponible</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>$5.000 COP · Bono: +{modoVenta ? '$1.000' : '$500'}</div>
                  </div>
                  <button style={{ ...s.btnSecondary, fontSize: '12px', padding: '5px 10px' }} onClick={() => { setBoletaEncontrada(null); setBusqueda('') }}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {boletaEncontrada.numeros?.map((n, i) => (
                    <div key={i} style={{
                      background: busqueda && String(n) === busqueda ? '#2a1f00' : '#1a1a1a',
                      border: `1px solid ${busqueda && String(n) === busqueda ? '#D4AF37' : '#333'}`,
                      borderRadius: '10px', padding: '12px', textAlign: 'center',
                      fontSize: '20px', fontWeight: '700', letterSpacing: '3px',
                      color: busqueda && String(n) === busqueda ? '#D4AF37' : '#fff'
                    }}>
                      {pad(Number(n))}
                    </div>
                  ))}
                </div>

                {modoVenta && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={s.field}>
                      <label style={s.label}>Nombre del cliente</label>
                      <input style={s.input} placeholder="Nombre completo" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Celular del cliente</label>
                      <input style={s.input} placeholder="3001234567" value={celularCliente} onChange={e => setCelularCliente(e.target.value)} />
                    </div>
                  </div>
                )}

                <button style={{ ...s.btnPrimary, width: '100%', fontSize: '15px', padding: '13px', opacity: comprando ? 0.7 : 1 }} onClick={confirmarCompra} disabled={comprando}>
                  {comprando ? 'Procesando...' : modoVenta ? '✅ Confirmar venta — $5.000' : '✅ Confirmar compra — $5.000'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'premios' && (
        <div>
          {[
            { color: '#D4AF37', titulo: '🥇 Premio Mayor', desc: '4 cifras exactas · 1 ganador', valor: '$2.000.000' },
            { color: '#9333ea', titulo: '🥈 Tres primeras cifras', desc: '123X · hasta 9 ganadores', valor: '$50.000 c/u' },
            { color: '#3b82f6', titulo: '🥉 Tres últimas cifras', desc: 'X234 · hasta 9 ganadores', valor: '$50.000 c/u' },
            { color: '#22c55e', titulo: '🎁 Dos últimas cifras', desc: 'XX34 · hasta 81 ganadores', valor: 'Boleta gratis' },
            { color: '#f97316', titulo: '🎁 Bono por compra', desc: 'Recibe $500 por cada boleta', valor: '$500 c/u' },
            { color: '#e879f9', titulo: '🤝 Bono revendedor', desc: '$1.000 por boleta vendida', valor: '$1.000 c/u' },
          ].map((p, i) => (
            <div key={i} style={{ ...s.premioCard, borderLeft: `3px solid ${p.color}` }}>
              <div><div style={{ fontWeight: '600', fontSize: '14px' }}>{p.titulo}</div><div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{p.desc}</div></div>
              <div style={{ fontWeight: '600', color: p.color }}>{p.valor}</div>
            </div>
          ))}
          <Link to="/resultados" style={{ ...s.btnPrimary, display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '12px' }}>
            🏆 Ver resultados del último sorteo
          </Link>
        </div>
      )}

      {tab === 'billetera' && (
        <div>
          <div style={s.walletCard}>
            <div style={{ fontSize: '12px', color: '#D4AF37', opacity: 0.8 }}>Saldo disponible</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#D4AF37', margin: '6px 0' }}>${saldo.toLocaleString('es-CO')}</div>
            <div style={{ fontSize: '11px', color: '#D4AF37', opacity: 0.6 }}>{Math.floor(saldo / 5000)} boletas disponibles</div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>💳 Recargar saldo</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {metodos.map(m => (
                <div key={m.id} style={{ ...s.metodoCard, borderColor: metodo === m.id ? '#D4AF37' : '#2a2a2a' }} onClick={() => setMetodo(m.id)}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{m.emoji}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>{m.label}</div>
                </div>
              ))}
            </div>
            {metodo && <div style={{ background: '#111', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '13px' }}><div style={{ color: '#888', marginBottom: '4px' }}>Datos:</div><div style={{ color: '#D4AF37', fontWeight: '600' }}>{metodos.find(m => m.id === metodo)?.info}</div></div>}
            <div style={s.field}><label style={s.label}>Monto (mín. $5.000)</label><input style={s.input} type="number" placeholder="Ej: 10000" value={monto} onChange={e => setMonto(e.target.value)} /></div>
            <div style={s.field}><label style={s.label}>Número de comprobante</label><input style={s.input} placeholder="Ej: 123456789" value={comprobante} onChange={e => setComprobante(e.target.value)} /></div>
            {mensajeRecarga && <div style={{ fontSize: '13px', color: mensajeRecarga.startsWith('✅') ? '#4ade80' : '#f87171', marginBottom: '10px' }}>{mensajeRecarga}</div>}
            <button style={{ ...s.btnPrimary, width: '100%', opacity: enviando ? 0.7 : 1 }} onClick={solicitarRecarga} disabled={enviando}>{enviando ? 'Enviando...' : 'Solicitar recarga'}</button>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>💸 Retirar saldo</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
              {metodos.map(m => (
                <div key={m.id} style={{ ...s.metodoCard, borderColor: retiroMetodo === m.id ? '#D4AF37' : '#2a2a2a' }} onClick={() => setRetiroMetodo(m.id)}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{m.emoji}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={s.field}><label style={s.label}>Monto a retirar</label><input style={s.input} type="number" placeholder="Ej: 50000" value={retiroMonto} onChange={e => setRetiroMonto(e.target.value)} /></div>
            <div style={s.field}><label style={s.label}>Número de cuenta / wallet</label><input style={s.input} placeholder="Ej: 3001234567" value={retiroDatos} onChange={e => setRetiroDatos(e.target.value)} /></div>
            {mensajeRetiro && <div style={{ fontSize: '13px', color: mensajeRetiro.startsWith('✅') ? '#4ade80' : '#f87171', marginBottom: '10px' }}>{mensajeRetiro}</div>}
            <button style={{ ...s.btnPrimary, width: '100%', opacity: enviandoRetiro ? 0.7 : 1 }} onClick={solicitarRetiro} disabled={enviandoRetiro}>{enviandoRetiro ? 'Enviando...' : 'Solicitar retiro'}</button>
            {misRetiros.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Mis retiros</div>
                {misRetiros.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2a2a2a', fontSize: '12px' }}>
                    <div><div>${r.monto.toLocaleString('es-CO')} · {r.metodo}</div><div style={{ color: '#666' }}>{new Date(r.created_at).toLocaleDateString('es-CO')}</div></div>
                    <span style={{ color: r.estado === 'aprobado' ? '#4ade80' : r.estado === 'rechazado' ? '#f87171' : '#D4AF37', fontWeight: '600' }}>{r.estado}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>📋 Historial</div>
            {movimientos.length === 0 ? <div style={s.empty}>No hay movimientos</div>
              : movimientos.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2a2a2a', fontSize: '13px' }}>
                  <div><div>{m.descripcion}</div><div style={{ fontSize: '11px', color: '#666' }}>{new Date(m.created_at).toLocaleDateString('es-CO')}</div></div>
                  <div style={{ fontWeight: '600', color: m.monto > 0 ? '#4ade80' : '#f87171' }}>{m.monto > 0 ? '+' : ''}${Math.abs(m.monto).toLocaleString('es-CO')}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {tab === 'misboletas' && (
        <div>
          {misBoletas.length === 0 ? <div style={s.empty}>No tienes boletas aún.</div>
            : misBoletas.map(b => (
              <div key={b.id} style={s.boletaCard}>
                <div style={s.boletaHeader}>
                  <div style={{ fontWeight: '600' }}>{b.nombre_cliente ? `👤 ${b.nombre_cliente}` : 'Boleta'} #{String(b.id).padStart(3,'0')} · {b.sorteos?.nombre}</div>
                  <span style={{ fontSize: '11px', background: b.sorteos?.estado === 'activo' ? '#14532d' : '#1a1a1a', color: b.sorteos?.estado === 'activo' ? '#4ade80' : '#888', padding: '2px 8px', borderRadius: '10px' }}>
                    {b.sorteos?.estado === 'activo' ? 'Activa' : 'Finalizada'}
                  </span>
                </div>
                {b.celular_cliente && <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>📱 {b.celular_cliente}</div>}
                <div style={s.numerosGrid}>
                  {b.numeros?.map((n, i) => <div key={i} style={s.numBoleta}>{pad(Number(n))}</div>)}
                </div>
                {b.sorteos?.numero_ganador && <div style={{ fontSize: '12px', color: '#D4AF37', marginBottom: '10px' }}>Número ganador: <strong>{b.sorteos.numero_ganador}</strong></div>}
                <button style={{ ...s.btnSecondary, fontSize: '12px', padding: '7px 14px' }} onClick={() => descargarBoleta(b)}>⬇ Descargar PNG</button>
              </div>
            ))}
        </div>
      )}

      {tab === 'perfil' && (
        <div>
          <div style={s.card}>
            <div style={s.cardTitle}>👤 Mi perfil</div>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={s.infoItem}><div style={s.infoLabel}>Nombre</div><div style={s.infoVal}>{usuario?.nombre}</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Código referido</div><div style={{ ...s.infoVal, color: '#D4AF37' }}>{usuario?.codigo_referido}</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Rol</div><div style={{ ...s.infoVal, color: esRevendedor ? '#e879f9' : '#4ade80' }}>{esRevendedor ? '🤝 Revendedor' : '👤 Cliente'}</div></div>
            </div>
          </div>
          {!esRevendedor && (
            <div style={s.card}>
              <div style={s.cardTitle}>🤝 Ser revendedor</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '14px', lineHeight: '1.6' }}>
                Vende boletas a tus clientes y recibe <strong style={{ color: '#e879f9' }}>$1.000</strong> de bono por cada venta.
              </div>
              {solicitudRevendedor === 'pendiente' ? (
                <div style={{ background: '#2a1f00', border: '1px solid #D4AF3740', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#D4AF37' }}>⏳ Solicitud pendiente de aprobación.</div>
              ) : solicitudRevendedor === 'rechazada' ? (
                <div style={{ background: '#2a0000', border: '1px solid #5a0000', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#f87171' }}>❌ Solicitud rechazada.</div>
              ) : (
                <div>
                  {mensajeSolicitud && <div style={{ fontSize: '13px', color: mensajeSolicitud.startsWith('✅') ? '#4ade80' : '#f87171', marginBottom: '10px' }}>{mensajeSolicitud}</div>}
                  <button style={{ ...s.btnPrimary, width: '100%', background: '#9333ea' }} onClick={solicitarRevendedor}>🤝 Solicitar ser revendedor</button>
                </div>
              )}
            </div>
          )}
          {esRevendedor && (
            <div style={{ ...s.card, borderColor: '#e879f930', background: '#1a0a2a' }}>
              <div style={{ ...s.cardTitle, color: '#e879f9' }}>🤝 Eres revendedor</div>
              <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.6' }}>
                En la pestaña <strong>🎲 Sorteo</strong> selecciona <strong>"Vender a cliente"</strong>, busca una boleta e ingresa los datos del comprador.<br /><br />
                Bono por venta: <strong style={{ color: '#e879f9' }}>$1.000</strong> por boleta.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', background: '#0f0f0f', padding: '1rem', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #2a2a2a' },
  logo: { fontSize: '20px', fontWeight: '600' },
  gold: { color: '#D4AF37' },
  sub: { fontSize: '12px', color: '#888', marginTop: '3px' },
  revendedorBadge: { background: '#4a0080', color: '#e879f9', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px', fontWeight: '600' },
  saldoBadge: { background: '#2a1f00', color: '#D4AF37', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  linkBtn: { fontSize: '12px', color: '#D4AF37', textDecoration: 'none', background: '#2a1f00', padding: '6px 12px', borderRadius: '20px' },
  logoutBtn: { fontSize: '12px', color: '#888', background: 'none', border: '1px solid #333', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' },
  anunciosWrap: { background: '#1a1a1a', border: '1px solid #D4AF3740', borderRadius: '12px', padding: '14px', marginBottom: '1rem' },
  anunciosTitulo: { fontSize: '13px', fontWeight: '600', color: '#D4AF37', marginBottom: '10px' },
  anuncioCard: { background: '#111', borderRadius: '8px', padding: '12px', marginBottom: '8px', borderLeft: '3px solid #D4AF37' },
  anuncioTitulo: { fontSize: '14px', fontWeight: '600', marginBottom: '4px' },
  anuncioContenido: { fontSize: '13px', color: '#ccc', lineHeight: '1.5' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '1.2rem', borderBottom: '1px solid #2a2a2a', overflowX: 'auto' },
  tab: { padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#666', borderBottom: '2px solid transparent', marginBottom: '-1px', whiteSpace: 'nowrap' },
  tabActive: { color: '#fff', borderBottom: '2px solid #D4AF37', fontWeight: '500' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '10px' },
  stat: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '10px 12px' },
  statLabel: { fontSize: '11px', color: '#666', marginBottom: '3px' },
  statVal: { fontSize: '18px', fontWeight: '600' },
  progressBar: { background: '#2a2a2a', borderRadius: '4px', height: '7px', overflow: 'hidden', marginBottom: '4px' },
  progressFill: { height: '100%', background: '#D4AF37', borderRadius: '4px', transition: 'width 0.3s' },
  progressText: { fontSize: '11px', color: '#666' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
  cardTitle: { fontSize: '14px', fontWeight: '600', marginBottom: '12px' },
  modeBtn: { fontSize: '12px', padding: '8px 12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', color: '#888', whiteSpace: 'nowrap' },
  modeBtnActive: { background: '#D4AF37', color: '#1a1200', borderColor: '#D4AF37', fontWeight: '600' },
  btnPrimary: { background: '#D4AF37', color: '#1a1200', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' },
  input: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', color: '#fff', outline: 'none', boxSizing: 'border-box', width: '100%' },
  premioCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#1a1a1a', borderRadius: '10px', marginBottom: '8px' },
  walletCard: { background: 'linear-gradient(135deg, #2a1f00, #4a3800)', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '12px' },
  metodoCard: { background: '#111', border: '2px solid #2a2a2a', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer' },
  field: { marginBottom: '12px' },
  label: { fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' },
  boletaCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '10px' },
  boletaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  numerosGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' },
  numBoleta: { background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '8px', fontSize: '16px', fontWeight: '700', letterSpacing: '2px', color: '#D4AF37', textAlign: 'center' },
  infoItem: { background: '#111', borderRadius: '8px', padding: '10px' },
  infoLabel: { fontSize: '11px', color: '#666', marginBottom: '3px' },
  infoVal: { fontSize: '13px', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#666', padding: '2rem', fontSize: '13px' },
}
