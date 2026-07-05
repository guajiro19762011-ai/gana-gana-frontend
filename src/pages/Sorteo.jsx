import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

export default function Sorteo() {
  const { usuario, token, logout } = useAuth()
  const navigate = useNavigate()
  const [sorteo, setSorteo] = useState(null)
  const [tomados, setTomados] = useState(new Set())
  const [seleccionados, setSeleccionados] = useState([])
  const [mios, setMios] = useState([])
  const [modo, setModo] = useState('manual')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarBoleta, setMostrarBoleta] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [saldo, setSaldo] = useState(0)
  const [tab, setTab] = useState('sorteo')
  const [misBoletas, setMisBoletas] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [metodo, setMetodo] = useState('')
  const [monto, setMonto] = useState('')
  const [comprobante, setComprobante] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensajeRecarga, setMensajeRecarga] = useState('')
  const [anuncios, setAnuncios] = useState([])
  const [retiroMonto, setRetiroMonto] = useState('')
  const [retiroMetodo, setRetiroMetodo] = useState('')
  const [retiroDatos, setRetiroDatos] = useState('')
  const [enviandoRetiro, setEnviandoRetiro] = useState(false)
  const [mensajeRetiro, setMensajeRetiro] = useState('')
  const [misRetiros, setMisRetiros] = useState([])
  const [rolUsuario, setRolUsuario] = useState('cliente')
  const [solicitudRevendedor, setSolicitudRevendedor] = useState(null)
  const [mensajeSolicitud, setMensajeSolicitud] = useState('')
  const [modoVenta, setModoVenta] = useState(false)
  const [nombreCliente, setNombreCliente] = useState('')
  const [celularCliente, setCelularCliente] = useState('')
  const intervalRef = useRef(null)

  const headers = { Authorization: `Bearer ${token}` }
  const pad = n => String(n).padStart(4, '0')

  const cargarSorteo = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/sorteos/activo`, { headers })
      setSorteo(data.sorteo)
      const tkn = new Set(data.numeros.map(n => n.numero))
      const propios = data.numeros.filter(n => n.usuario_id === usuario?.id).map(n => n.numero)
      setTomados(tkn)
      setMios(propios)
    } catch (err) { console.error(err) }
  }, [token])

  const cargarBilletera = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/billetera`, { headers })
      setSaldo(data.saldo)
      setMovimientos(data.movimientos || [])
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

  const cargarPerfil = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/billetera`, { headers })
      setRolUsuario(data.rol || 'cliente')
      setSolicitudRevendedor(data.solicitud_revendedor)
    } catch (err) { console.error(err) }
  }, [token])

  useEffect(() => {
    cargarSorteo()
    cargarBilletera()
    cargarMisBoletas()
    cargarAnuncios()
    cargarMisRetiros()
    cargarPerfil()
    intervalRef.current = setInterval(() => { cargarSorteo() }, 10000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const toggleNum = (num) => {
    if (modo !== 'manual') return
    if (tomados.has(num) || mios.includes(num)) return
    if (seleccionados.includes(num)) {
      setSeleccionados(seleccionados.filter(n => n !== num))
    } else {
      if (seleccionados.length >= 10) return alert('Máximo 10 números por boleta')
      setSeleccionados([...seleccionados, num])
    }
  }

  const tomarAleatorio = () => {
    const disponibles = []
    for (let i = 0; i < 10000; i++) {
      const n = pad(i)
      if (!tomados.has(n) && !mios.includes(n)) disponibles.push(n)
    }
    const nuevos = []
    while (nuevos.length < 10 && disponibles.length > 0) {
      const idx = Math.floor(Math.random() * disponibles.length)
      nuevos.push(disponibles.splice(idx, 1)[0])
    }
    setSeleccionados(nuevos)
  }

  const handleTomar = () => {
    if (modo === 'auto') { tomarAleatorio(); setMostrarBoleta(true); return }
    if (seleccionados.length < 10) return alert(`Selecciona ${10 - seleccionados.length} número(s) más`)
    setMostrarBoleta(true)
  }

  const confirmarCompra = async () => {
    if (saldo < 5000) return alert('Saldo insuficiente. Recarga tu billetera.')
    if (modoVenta && (!nombreCliente || !celularCliente)) return alert('Ingresa el nombre y celular del cliente')
    setCargando(true)
    try {
      let data
      if (modoVenta) {
        const res = await axios.post(`${API}/sorteos/vender`, { numeros: seleccionados, nombre_cliente: nombreCliente, celular_cliente: celularCliente }, { headers })
        data = res.data
      } else {
        const res = await axios.post(`${API}/sorteos/comprar`, { numeros: seleccionados }, { headers })
        data = res.data
      }
      setMios([...mios, ...seleccionados])
      seleccionados.forEach(n => tomados.add(n))
      setTomados(new Set(tomados))
      setSaldo(data.saldo_nuevo)
      setSeleccionados([])
      setMostrarBoleta(false)
      setNombreCliente('')
      setCelularCliente('')
      cargarMisBoletas()
      const bono = modoVenta ? '$1.000' : '$500'
      alert(`✅ ¡Boleta ${modoVenta ? 'vendida' : 'comprada'}! Recibiste un bono de ${bono}.`)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar')
    } finally { setCargando(false) }
  }

  const solicitarRevendedor = async () => {
    try {
      await axios.post(`${API}/sorteos/solicitar-revendedor`, {}, { headers })
      setSolicitudRevendedor('pendiente')
      setMensajeSolicitud('✅ Solicitud enviada. El admin la revisará pronto.')
    } catch (err) {
      setMensajeSolicitud('❌ ' + (err.response?.data?.error || 'Error al enviar solicitud'))
    }
  }

  const descargarBoleta = (boleta) => {
    const nombreMostrar = boleta.nombre_cliente || usuario?.nombre
    const celularMostrar = boleta.celular_cliente || ''
    const contenido = `
GANA GANA O GANA
================================
Boleta #${String(boleta.id).padStart(3,'0')}
Sorteo: ${boleta.sorteos?.nombre}
Cliente: ${nombreMostrar}
${celularMostrar ? `Celular: ${celularMostrar}` : ''}
Fecha: ${new Date(boleta.created_at).toLocaleDateString('es-CO')}
Valor: $5.000 COP
================================
NÚMEROS:

${boleta.numeros?.join('   ')}

================================
PREMIOS:
4 cifras exactas → $2.000.000
3 primeras (123X) → $50.000
3 últimas (X234) → $50.000
2 últimas (XX34) → Boleta gratis
================================
¡Mucha suerte!
    `.trim()
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `boleta-${String(boleta.id).padStart(3,'0')}-ganagana.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const solicitarRecarga = async () => {
    if (!metodo) return alert('Selecciona un método de pago')
    if (!monto || Number(monto) < 5000) return alert('El monto mínimo es $5.000')
    setEnviando(true)
    try {
      await axios.post(`${API}/billetera/recargar`, { monto: Number(monto), metodo, comprobante_url: comprobante || null }, { headers })
      setMensajeRecarga('✅ Solicitud enviada. El administrador la aprobará en breve.')
      setMonto(''); setMetodo(''); setComprobante('')
      setTimeout(() => setMensajeRecarga(''), 5000)
    } catch (err) {
      setMensajeRecarga('❌ ' + (err.response?.data?.error || 'Error'))
    } finally { setEnviando(false) }
  }

  const solicitarRetiro = async () => {
    if (!retiroMetodo) return alert('Selecciona un método')
    if (!retiroMonto || Number(retiroMonto) < 10000) return alert('El retiro mínimo es $10.000')
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

  const getClase = (num) => {
    if (mios.includes(num)) return 'mio'
    if (seleccionados.includes(num)) return 'sel'
    if (tomados.has(num)) return 'tomado'
    return 'libre'
  }

  const numeros = []
  for (let i = 0; i < 10000; i++) {
    const n = pad(i)
    if (busqueda && !n.includes(busqueda)) continue
    numeros.push(n)
  }

  const vendidas = sorteo?.total_boletas || 0
  const pct = ((vendidas / 1000) * 100).toFixed(1)
  const metodos = [
    { id: 'nequi', emoji: '📱', label: 'Nequi', info: 'Transfiere a: 300 000 0000' },
    { id: 'daviplata', emoji: '🏦', label: 'Daviplata', info: 'Transfiere a: 300 000 0001' },
    { id: 'usdt', emoji: '₮', label: 'USDT', info: 'Red TRC20: TXxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
  ]

  const esRevendedor = rolUsuario === 'revendedor'

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
          <Link to="/resultados" style={s.linkBtn}>🏆 Resultados</Link>
          <Link to="/buzon" style={s.linkBtn}>💬 Buzón</Link>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/login') }}>Salir</button>
        </div>
      </div>

      {anuncios.length > 0 && (
        <div style={s.anunciosWrap}>
          <div style={s.anunciosTitulo}>📢 Noticias y anuncios</div>
          {anuncios.map(a => (
            <div key={a.id} style={s.anuncioCard}>
              <div style={s.anuncioTitulo}>{a.titulo}</div>
              <div style={s.anuncioContenido}>{a.contenido}</div>
              <div style={s.anuncioFecha}>{new Date(a.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
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

      {/* SORTEO */}
      {tab === 'sorteo' && (
        <div>
          <div style={s.statsGrid}>
            <div style={s.stat}><div style={s.statLabel}>Sorteo</div><div style={{ ...s.statVal, color: '#D4AF37' }}>#{String(sorteo?.id || 1).padStart(4,'0')}</div></div>
            <div style={s.stat}><div style={s.statLabel}>Vendidas</div><div style={s.statVal}>{vendidas}</div></div>
            <div style={s.stat}><div style={s.statLabel}>Disponibles</div><div style={{ ...s.statVal, color: '#4ade80' }}>{1000 - vendidas}</div></div>
          </div>
          <div style={s.progressBar}><div style={{ ...s.progressFill, width: pct + '%' }} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={s.progressText}>{pct}% vendido — juega al llegar al 100%</div>
            <div style={{ fontSize: '11px', color: '#555' }}>🔄 Auto-actualiza cada 10s</div>
          </div>

          {esRevendedor && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button style={{ ...s.modeBtn, ...(modoVenta === false ? s.modeBtnActive : {}) }} onClick={() => setModoVenta(false)}>
                🛒 Compra personal
              </button>
              <button style={{ ...s.modeBtn, ...(modoVenta === true ? s.modeBtnActive : {}) }} onClick={() => setModoVenta(true)}>
                🤝 Vender a cliente
              </button>
            </div>
          )}

          <div style={s.searchRow}>
            <input style={{ ...s.input, flex: 1 }} placeholder="Buscar número..." maxLength={4} value={busqueda} onChange={e => setBusqueda(e.target.value.replace(/[^0-9]/g, ''))} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={{ ...s.modeBtn, ...(modo === 'manual' ? s.modeBtnActive : {}) }} onClick={() => setModo('manual')}>Manual</button>
              <button style={{ ...s.modeBtn, ...(modo === 'auto' ? s.modeBtnActive : {}) }} onClick={() => setModo('auto')}>Aleatorio</button>
            </div>
            <button style={s.btnPrimary} onClick={handleTomar}>Tomar números</button>
          </div>

          <div style={s.leyenda}>
            <span><span style={{ ...s.dot, background: '#1a1a1a', border: '1px solid #333' }} />Disponible</span>
            <span><span style={{ ...s.dot, background: '#2a0000' }} />Tomado</span>
            <span><span style={{ ...s.dot, background: '#D4AF37' }} />Seleccionado</span>
            <span><span style={{ ...s.dot, background: '#14532d' }} />Mis números</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#888' }}>Sel: <strong style={{ color: '#D4AF37' }}>{seleccionados.length}</strong>/10</span>
          </div>

          <div style={s.gridWrap}>
            <div style={s.grid}>
              {numeros.map(n => (
                <div key={n} style={{ ...s.num, ...s['num_' + getClase(n)] }} onClick={() => toggleNum(n)}>{n}</div>
              ))}
            </div>
          </div>

          {mostrarBoleta && (
            <div style={s.boletaCard}>
              <div style={s.boletaHeader}>
                <div style={{ fontWeight: '600' }}>
                  {modoVenta ? '🤝 Venta a cliente' : '🎟️ Tu boleta'} · Sorteo #{String(sorteo?.id || 1).padStart(4,'0')}
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>$5.000 COP · Bono: +{modoVenta ? '$1.000' : '$500'}</div>
              </div>

              {modoVenta && (
                <div style={{ marginBottom: '12px' }}>
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

              <div style={s.numerosGrid}>
                {seleccionados.map(n => <div key={n} style={s.numBoleta}>{n}</div>)}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button style={{ ...s.btnPrimary, opacity: cargando ? 0.7 : 1 }} onClick={confirmarCompra} disabled={cargando}>
                  {cargando ? 'Procesando...' : modoVenta ? '✅ Confirmar venta' : '✅ Confirmar y pagar'}
                </button>
                <button style={s.btnSecondary} onClick={() => { setMostrarBoleta(false); setSeleccionados([]) }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PREMIOS */}
      {tab === 'premios' && (
        <div>
          {[
            { color: '#D4AF37', titulo: '🥇 Premio Mayor', desc: '4 cifras exactas · 1 ganador', valor: '$2.000.000' },
            { color: '#9333ea', titulo: '🥈 Tres primeras cifras', desc: '123X · hasta 9 ganadores', valor: '$50.000 c/u' },
            { color: '#3b82f6', titulo: '🥉 Tres últimas cifras', desc: 'X234 · hasta 9 ganadores', valor: '$50.000 c/u' },
            { color: '#22c55e', titulo: '🎁 Dos últimas cifras', desc: 'XX34 · hasta 81 ganadores', valor: 'Boleta gratis' },
            { color: '#f97316', titulo: '🎁 Bono por compra', desc: 'Recibe $500 por cada boleta comprada', valor: '$500 c/u' },
            { color: '#e879f9', titulo: '🤝 Bono revendedor', desc: 'Revendedores reciben $1.000 por boleta vendida', valor: '$1.000 c/u' },
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

      {/* BILLETERA */}
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
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>Retiro mínimo: $10.000</div>
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

      {/* MIS BOLETAS */}
      {tab === 'misboletas' && (
        <div>
          {misBoletas.length === 0 ? <div style={s.empty}>No tienes boletas aún.</div>
            : misBoletas.map(b => (
              <div key={b.id} style={s.boletaCard}>
                <div style={s.boletaHeader}>
                  <div style={{ fontWeight: '600' }}>
                    {b.nombre_cliente ? `👤 ${b.nombre_cliente}` : 'Boleta'} #{String(b.id).padStart(3,'0')} · {b.sorteos?.nombre}
                  </div>
                  <span style={{ fontSize: '11px', background: b.sorteos?.estado === 'activo' ? '#14532d' : '#1a1a1a', color: b.sorteos?.estado === 'activo' ? '#4ade80' : '#888', padding: '2px 8px', borderRadius: '10px' }}>
                    {b.sorteos?.estado === 'activo' ? 'Activa' : 'Finalizada'}
                  </span>
                </div>
                {b.celular_cliente && <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>📱 {b.celular_cliente}</div>}
                <div style={s.numerosGrid}>{b.numeros?.map(n => <div key={n} style={s.numBoleta}>{n}</div>)}</div>
                {b.sorteos?.numero_ganador && <div style={{ fontSize: '12px', color: '#D4AF37', marginBottom: '10px' }}>Número ganador: <strong>{b.sorteos.numero_ganador}</strong></div>}
                <button style={{ ...s.btnSecondary, fontSize: '12px', padding: '7px 14px' }} onClick={() => descargarBoleta(b)}>⬇ Descargar boleta</button>
              </div>
            ))}
        </div>
      )}

      {/* PERFIL */}
      {tab === 'perfil' && (
        <div>
          <div style={s.card}>
            <div style={s.cardTitle}>👤 Mi perfil</div>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
              <div style={s.infoItem}><div style={s.infoLabel}>Nombre</div><div style={s.infoVal}>{usuario?.nombre}</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Código referido</div><div style={{ ...s.infoVal, color: '#D4AF37' }}>{usuario?.codigo_referido}</div></div>
              <div style={s.infoItem}><div style={s.infoLabel}>Rol</div><div style={{ ...s.infoVal, color: esRevendedor ? '#e879f9' : '#4ade80' }}>{esRevendedor ? '🤝 Revendedor' : '👤 Cliente'}</div></div>
            </div>
          </div>

          {!esRevendedor && (
            <div style={s.card}>
              <div style={s.cardTitle}>🤝 Ser revendedor</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '14px', lineHeight: '1.6' }}>
                Como revendedor podrás vender boletas a tus clientes e ingresar sus datos directamente en el sistema. Recibirás un bono de <strong style={{ color: '#e879f9' }}>$1.000</strong> por cada boleta vendida (vs $500 como cliente normal).
              </div>
              {solicitudRevendedor === 'pendiente' ? (
                <div style={{ background: '#2a1f00', border: '1px solid #D4AF3740', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#D4AF37' }}>
                  ⏳ Tu solicitud está pendiente de aprobación por el administrador.
                </div>
              ) : solicitudRevendedor === 'rechazada' ? (
                <div style={{ background: '#2a0000', border: '1px solid #5a0000', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#f87171' }}>
                  ❌ Tu solicitud fue rechazada. Puedes contactar al administrador.
                </div>
              ) : (
                <div>
                  {mensajeSolicitud && <div style={{ fontSize: '13px', color: mensajeSolicitud.startsWith('✅') ? '#4ade80' : '#f87171', marginBottom: '10px' }}>{mensajeSolicitud}</div>}
                  <button style={{ ...s.btnPrimary, width: '100%', background: '#9333ea', color: '#fff' }} onClick={solicitarRevendedor}>
                    🤝 Solicitar ser revendedor
                  </button>
                </div>
              )}
            </div>
          )}

          {esRevendedor && (
            <div style={{ ...s.card, borderColor: '#e879f930', background: '#1a0a2a' }}>
              <div style={{ ...s.cardTitle, color: '#e879f9' }}>🤝 Eres revendedor</div>
              <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.6' }}>
                Puedes vender boletas a tus clientes desde la pestaña <strong>🎲 Sorteo</strong> usando el modo <strong>"Vender a cliente"</strong>.<br /><br />
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
  anunciosWrap: { background: '#1a1a1a', border: '1px solid #D4AF3740', borderRadius: '12px', padding: '14px', marginBottom: '1.2rem' },
  anunciosTitulo: { fontSize: '13px', fontWeight: '600', color: '#D4AF37', marginBottom: '10px' },
  anuncioCard: { background: '#111', borderRadius: '8px', padding: '12px', marginBottom: '8px', borderLeft: '3px solid #D4AF37' },
  anuncioTitulo: { fontSize: '14px', fontWeight: '600', marginBottom: '4px' },
  anuncioContenido: { fontSize: '13px', color: '#ccc', lineHeight: '1.5' },
  anuncioFecha: { fontSize: '11px', color: '#555', marginTop: '6px' },
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
  searchRow: { display: 'flex', gap: '8px', margin: '1rem 0 10px', alignItems: 'center', flexWrap: 'wrap' },
  input: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', color: '#fff', outline: 'none', boxSizing: 'border-box', width: '100%' },
  modeBtn: { fontSize: '12px', padding: '6px 10px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', color: '#888', whiteSpace: 'nowrap' },
  modeBtnActive: { background: '#D4AF37', color: '#1a1200', borderColor: '#D4AF37', fontWeight: '600' },
  btnPrimary: { background: '#D4AF37', color: '#1a1200', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' },
  leyenda: { display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '11px', color: '#888', alignItems: 'center', flexWrap: 'wrap' },
  dot: { width: '11px', height: '11px', borderRadius: '2px', display: 'inline-block', marginRight: '3px' },
  gridWrap: { border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden', maxHeight: '260px', overflowY: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(20,1fr)', gap: '1px', background: '#2a2a2a', padding: '1px' },
  num: { fontSize: '9px', padding: '3px 1px', textAlign: 'center', cursor: 'pointer', borderRadius: '2px', userSelect: 'none' },
  num_libre: { background: '#1a1a1a', color: '#555' },
  num_tomado: { background: '#2a0000', color: '#7f1d1d', cursor: 'not-allowed' },
  num_sel: { background: '#D4AF37', color: '#1a1200', fontWeight: '600' },
  num_mio: { background: '#14532d', color: '#4ade80' },
  boletaCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginTop: '1rem', marginBottom: '10px' },
  boletaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  numerosGrid: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' },
  numBoleta: { background: '#111', border: '1px solid #333', borderRadius: '6px', padding: '6px 10px', fontSize: '14px', fontWeight: '600', letterSpacing: '1px', color: '#D4AF37' },
  premioCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#1a1a1a', borderRadius: '10px', marginBottom: '8px' },
  walletCard: { background: 'linear-gradient(135deg, #2a1f00, #4a3800)', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '12px' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
  cardTitle: { fontSize: '14px', fontWeight: '600', marginBottom: '14px' },
  metodoCard: { background: '#111', border: '2px solid #2a2a2a', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer' },
  field: { marginBottom: '12px' },
  label: { fontSize: '12px', color: '#888', display: 'block', marginBottom: '5px' },
  empty: { textAlign: 'center', color: '#666', padding: '2rem', fontSize: '13px' },
  infoItem: { background: '#111', borderRadius: '8px', padding: '10px' },
  infoLabel: { fontSize: '11px', color: '#666', marginBottom: '3px' },
  infoVal: { fontSize: '13px', fontWeight: '600' },
}
