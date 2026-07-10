import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL

export default function AdminPanel() {
  const { usuario, token, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState({ boletas: 0, usuarios: 0, recargas_pendientes: 0, retiros_pendientes: 0 })
  const [sorteoActivo, setSorteoActivo] = useState(null)
  const [recargas, setRecargas] = useState([])
  const [retiros, setRetiros] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [historialSorteos, setHistorialSorteos] = useState([])
  const [ganadores, setGanadores] = useState([])
  const [premiosPagados, setPremiosPagados] = useState({})
  const [winner, setWinner] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cerrando, setCerrando] = useState(false)
  const [usuarioAbierto, setUsuarioAbierto] = useState(null)
  const [boletasUsuario, setBoletasUsuario] = useState({})
  const [modalUsuario, setModalUsuario] = useState(null)
  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({})
  const [recargarMonto, setRecargarMonto] = useState('')
  const [recargarDesc, setRecargarDesc] = useState('')
  const [anuncios, setAnuncios] = useState([])
  const [nuevoAnuncio, setNuevoAnuncio] = useState({ titulo: '', contenido: '' })
  const [saldoAcumulado, setSaldoAcumulado] = useState(0)
  const [sorteoDetalle, setSorteoDetalle] = useState(null)
  const [solicitudesRevendedor, setSolicitudesRevendedor] = useState([])
  const [mensajes, setMensajes] = useState([])
  const [usuarioMensaje, setUsuarioMensaje] = useState(null)
  const [chatMensajes, setChatMensajes] = useState([])
  const [respuesta, setRespuesta] = useState('')
  const [pagina, setPagina] = useState({})
  const [editPagina, setEditPagina] = useState(false)
  const [editPago, setEditPago] = useState(false)
  const [formPago, setFormPago] = useState({})
  const [mensajePago, setMensajePago] = useState('')
  const [formPagina, setFormPagina] = useState({})
  const [confirmReinicio, setConfirmReinicio] = useState('')
  const [reiniciando, setReiniciando] = useState(false)
  const [formCred, setFormCred] = useState({ email: '', password_actual: '', password_nuevo: '', confirmar: '' })
  const [mensajeCred, setMensajeCred] = useState('')
  const [generando, setGenerando] = useState(false)
  const [mensajeGenerar, setMensajeGenerar] = useState('')

  useEffect(() => { cargarDatos() }, [tab])

  const h = () => ({ Authorization: `Bearer ${token}` })

  const cargarDatos = async () => {
    try {
      const [statsRes, recargasRes, usuariosRes, retirosRes, anunciosRes, historialRes, revendedoresRes, mensajesRes, paginaRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: h() }),
        axios.get(`${API}/admin/recargas`, { headers: h() }),
        axios.get(`${API}/admin/usuarios`, { headers: h() }),
        axios.get(`${API}/retiros/pendientes`, { headers: h() }),
        axios.get(`${API}/anuncios/todos`, { headers: h() }),
        axios.get(`${API}/admin/sorteos/historial`, { headers: h() }),
        axios.get(`${API}/admin/revendedores/solicitudes`, { headers: h() }),
        axios.get(`${API}/mensajes/todos`, { headers: h() }),
        axios.get(`${API}/pagina`).catch(() => ({ data: {} })),
      ])
      setStats(statsRes.data)
      setSorteoActivo(statsRes.data.sorteo)
      setRecargas(recargasRes.data)
      setUsuarios(usuariosRes.data)
      setRetiros(retirosRes.data)
      setAnuncios(anunciosRes.data)
      setHistorialSorteos(historialRes.data)
      setSolicitudesRevendedor(revendedoresRes.data)
      setMensajes(mensajesRes.data)
      setPagina(paginaRes.data)
      setFormPagina(paginaRes.data)
      setFormPago(paginaRes.data)
      const total = historialRes.data.filter(s => s.estado === 'jugado').reduce((acc, s) => acc + (s.saldo_acumulado || 0), 0)
      setSaldoAcumulado(total)
    } catch (err) { console.error('Error:', err) }
  }

  const verBoletas = async (usuarioId) => {
    if (usuarioAbierto === usuarioId) { setUsuarioAbierto(null); return }
    try {
      const { data } = await axios.get(`${API}/admin/usuarios/${usuarioId}/boletas`, { headers: h() })
      setBoletasUsuario(prev => ({ ...prev, [usuarioId]: data }))
      setUsuarioAbierto(usuarioId)
    } catch (err) { console.error(err) }
  }

  const verGanadoresSorteo = async (sorteoId) => {
    if (sorteoDetalle === sorteoId) { setSorteoDetalle(null); return }
    try {
      const { data } = await axios.get(`${API}/admin/sorteos/${sorteoId}/ganadores`, { headers: h() })
      setBoletasUsuario(prev => ({ ...prev, [`sorteo_${sorteoId}`]: data }))
      setSorteoDetalle(sorteoId)
    } catch (err) { console.error(err) }
  }

  const abrirChat = async (uid, nombre) => {
    setUsuarioMensaje({ id: uid, nombre })
    try {
      const { data } = await axios.get(`${API}/mensajes/usuario/${uid}`, { headers: h() })
      setChatMensajes(data)
    } catch (err) { console.error(err) }
  }

  const enviarRespuesta = async () => {
    if (!respuesta.trim()) return
    try {
      await axios.post(`${API}/mensajes/responder`, { usuario_id: usuarioMensaje.id, contenido: respuesta }, { headers: h() })
      setRespuesta('')
      abrirChat(usuarioMensaje.id, usuarioMensaje.nombre)
      cargarDatos()
    } catch (err) { alert('Error al enviar') }
  }

  const eliminarConversacion = async (usuarioId) => {
    if (!confirm('¿Eliminar toda la conversación con este usuario?')) return
    try {
      await axios.delete(`${API}/mensajes/usuario/${usuarioId}`, { headers: h() })
      if (usuarioMensaje?.id === usuarioId) { setUsuarioMensaje(null); setChatMensajes([]) }
      cargarDatos()
      alert('✅ Conversación eliminada')
    } catch (err) { alert('Error al eliminar') }
  }

  const abrirModal = (u) => {
    setModalUsuario(u)
    setFormEdit({ nombre: u.nombre, celular: u.celular, email: u.email, saldo: u.saldo, activo: u.activo })
    setEditando(false); setRecargarMonto(''); setRecargarDesc('')
  }

  const guardarEdicion = async () => {
    try {
      await axios.put(`${API}/admin/usuarios/${modalUsuario.id}`, formEdit, { headers: h() })
      cargarDatos(); setModalUsuario(null); alert('✅ Usuario actualizado')
    } catch (err) { alert('Error') }
  }

  const eliminarUsuario = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await axios.delete(`${API}/admin/usuarios/${id}`, { headers: h() })
      cargarDatos(); setModalUsuario(null); alert('✅ Eliminado')
    } catch (err) { alert('Error') }
  }

  const recargarUsuario = async () => {
    if (!recargarMonto || Number(recargarMonto) <= 0) return alert('Monto inválido')
    try {
      await axios.post(`${API}/admin/usuarios/${modalUsuario.id}/recargar`, { monto: Number(recargarMonto), descripcion: recargarDesc || 'Recarga manual' }, { headers: h() })
      cargarDatos(); setModalUsuario(null); alert('✅ Recargado')
    } catch (err) { alert('Error') }
  }

  const aprobarRecarga = async (id) => {
    try { await axios.post(`${API}/admin/recargas/${id}/aprobar`, {}, { headers: h() }); cargarDatos() }
    catch (err) { alert('Error') }
  }

  const rechazarRecarga = async (id) => {
    try { await axios.post(`${API}/admin/recargas/${id}/rechazar`, {}, { headers: h() }); cargarDatos() }
    catch (err) { alert('Error') }
  }

  const aprobarRetiro = async (id) => {
    try { await axios.post(`${API}/retiros/${id}/aprobar`, {}, { headers: h() }); cargarDatos(); alert('✅ Aprobado') }
    catch (err) { alert('Error') }
  }

  const rechazarRetiro = async (id) => {
    try { await axios.post(`${API}/retiros/${id}/rechazar`, {}, { headers: h() }); cargarDatos(); alert('✅ Rechazado') }
    catch (err) { alert('Error') }
  }

  const aprobarRevendedor = async (id, nombre) => {
    try { await axios.post(`${API}/admin/revendedores/${id}/aprobar`, {}, { headers: h() }); cargarDatos(); alert(`✅ ${nombre} es revendedor`) }
    catch (err) { alert('Error') }
  }

  const rechazarRevendedor = async (id) => {
    try { await axios.post(`${API}/admin/revendedores/${id}/rechazar`, {}, { headers: h() }); cargarDatos() }
    catch (err) { alert('Error') }
  }

  const calcularGanadores = async () => {
    if (!/^\d{4}$/.test(winner)) return alert('Ingresa 4 dígitos')
    setCargando(true)
    try {
      const { data } = await axios.post(`${API}/admin/sorteo/ganadores`, { numero: winner }, { headers: h() })
      setGanadores(data); setPremiosPagados({})
    } catch (err) { alert('Error') }
    finally { setCargando(false) }
  }

  const pagarPremio = async (g, idx) => {
    if (!confirm(`¿Pagar $${g.premio.toLocaleString('es-CO')} a ${g.nombre}?`)) return
    try {
      await axios.post(`${API}/admin/sorteo/pagar-premio`, { usuario_id: g.usuario_id, premio: g.premio, categoria: g.categoria, numero: g.numero, celular: g.celular }, { headers: h() })
      setPremiosPagados(prev => ({ ...prev, [idx]: true }))
      cargarDatos()
    } catch (err) { alert('Error') }
  }

  const cerrarSorteo = async () => {
    if (!winner || winner.length !== 4) return alert('Ingresa el número ganador')
    if (!confirm(`¿Cerrar sorteo con ganador ${winner}?`)) return
    setCerrando(true)
    try {
      const { data } = await axios.post(`${API}/admin/sorteo/cerrar`, { numero_ganador: winner }, { headers: h() })
      alert(`✅ Sorteo cerrado.\nUtilidad: $${data.utilidad.toLocaleString('es-CO')}\n¡Nuevo sorteo iniciado!`)
      setWinner(''); setGanadores([]); setPremiosPagados({})
      cargarDatos()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
    finally { setCerrando(false) }
  }

  const publicarAnuncio = async () => {
    if (!nuevoAnuncio.titulo || !nuevoAnuncio.contenido) return alert('Completa todos los campos')
    try {
      await axios.post(`${API}/anuncios`, nuevoAnuncio, { headers: h() })
      setNuevoAnuncio({ titulo: '', contenido: '' }); cargarDatos(); alert('✅ Publicado')
    } catch (err) { alert('Error') }
  }

  const toggleAnuncio = async (id, activo) => {
    try { await axios.put(`${API}/anuncios/${id}`, { activo: !activo }, { headers: h() }); cargarDatos() }
    catch (err) { alert('Error') }
  }

  const eliminarAnuncio = async (id) => {
    if (!confirm('¿Eliminar?')) return
    try { await axios.delete(`${API}/anuncios/${id}`, { headers: h() }); cargarDatos() }
    catch (err) { alert('Error') }
  }

  const guardarPago = async () => {
    try {
      await axios.put(`${API}/pagina`, {
        pago_nequi: formPago.pago_nequi || '',
        pago_daviplata: formPago.pago_daviplata || '',
        pago_usdt: formPago.pago_usdt || '',
      }, { headers: h() })
      setPagina({ ...pagina, ...formPago })
      setEditPago(false)
      setMensajePago('✅ Datos de pago actualizados')
      setTimeout(() => setMensajePago(''), 4000)
    } catch (err) { setMensajePago('❌ Error al guardar') }
  }

  const guardarPagina = async () => {
    try {
      await axios.put(`${API}/pagina`, formPagina, { headers: h() })
      setPagina(formPagina); setEditPagina(false); alert('✅ Página actualizada')
    } catch (err) { alert('Error') }
  }

  const reiniciarSistema = async () => {
    if (confirmReinicio !== 'REINICIAR') return alert('Escribe REINICIAR para confirmar')
    if (!confirm('⚠️ ESTO BORRARÁ TODOS LOS DATOS. ¿Estás seguro?')) return
    setReiniciando(true)
    try {
      await axios.post(`${API}/admin/reiniciar`, { confirmacion: 'REINICIAR' }, { headers: h() })
      alert('✅ Sistema reiniciado.')
      setConfirmReinicio('')
      cargarDatos()
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
    finally { setReiniciando(false) }
  }

  const otorgarBoletaGratis = async (g) => {
    if (!confirm(`¿Otorgar boleta gratis a ${g.nombre}?`)) return
    try {
      await axios.post(`${API}/admin/sorteo/otorgar-boleta-gratis`, { usuario_id: g.usuario_id, numero: g.numero }, { headers: h() })
      setPremiosPagados(prev => ({ ...prev, [`gratis_${g.numero}_${g.usuario_id}`]: true }))
      alert(`✅ Boleta gratis otorgada a ${g.nombre}. Ya puede reclamarla desde su panel.`)
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)) }
  }

  const generarBoletasFn = async () => {
    if (!confirm('¿Generar 1.000 boletas para el sorteo activo?')) return
    setGenerando(true)
    setMensajeGenerar('')
    try {
      const { data } = await axios.post(`${API}/admin/sorteo/generar-boletas`,
        { sorteo_id: sorteoActivo?.id },
        { headers: h() }
      )
      setMensajeGenerar(`✅ ${data.total} boletas generadas exitosamente`)
      cargarDatos()
    } catch (err) {
      setMensajeGenerar('❌ ' + (err.response?.data?.error || 'Error al generar'))
    } finally { setGenerando(false) }
  }

  const cambiarCredenciales = async () => {
    if (!formCred.password_actual) return alert('Ingresa tu contraseña actual')
    try {
      const { data } = await axios.put(`${API}/admin/credenciales`, formCred, { headers: h() })
      setMensajeCred('✅ ' + data.mensaje)
      setFormCred({ email: '', password_actual: '', password_nuevo: '', confirmar: '' })
      setTimeout(() => setMensajeCred(''), 5000)
    } catch (err) {
      setMensajeCred('❌ ' + (err.response?.data?.error || 'Error'))
    }
  }

  const recaudoActivo = sorteoActivo ? (sorteoActivo.total_boletas * 5000) : 0
  const premiosPagadosActivo = sorteoActivo?.premios_pagados || 0
  const utilidadActivo = recaudoActivo - premiosPagadosActivo

  const usuariosMensaje = {}
  mensajes.forEach(m => {
    if (!usuariosMensaje[m.usuario_id]) {
      usuariosMensaje[m.usuario_id] = { usuario: m.usuarios, mensajes: [], ultimoMensaje: m }
    }
    usuariosMensaje[m.usuario_id].mensajes.push(m)
    if (new Date(m.created_at) > new Date(usuariosMensaje[m.usuario_id].ultimoMensaje.created_at)) {
      usuariosMensaje[m.usuario_id].ultimoMensaje = m
    }
  })

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <div style={s.logo}>⚙️ Panel <span style={s.gold}>Admin</span></div>
          <div style={s.sub}>GANA GANA O GANA · {usuario?.nombre}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={s.badge}>👑 Administrador</span>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/admin/login') }}>Cerrar sesión</button>
        </div>
      </div>

      <div style={s.tabs}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'sorteo', label: '🎯 Sorteo' },
          { id: 'recargas', label: '💰 Pagos' },
          { id: 'revendedores', label: `🤝 Revendedores${solicitudesRevendedor.length > 0 ? ` (${solicitudesRevendedor.length})` : ''}` },
          { id: 'usuarios', label: '👥 Usuarios' },
          { id: 'buzon', label: `💬 Buzón${Object.keys(usuariosMensaje).length > 0 ? ` (${Object.keys(usuariosMensaje).length})` : ''}` },
          { id: 'anuncios', label: '📢 Anuncios' },
          { id: 'pagina', label: '📄 Quiénes somos' },
          { id: 'historial', label: '📋 Historial' },
          { id: 'sistema', label: '⚠️ Sistema' },
        ].map(t => (
          <button key={t.id} style={{ ...s.tab, ...(tab === t.id ? s.tabActive : {}) }} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab === 'dashboard' && (
        <div>
          <div style={s.kpiGrid}>
            <div style={s.kpi}><div style={{ ...s.kpiVal, color: '#D4AF37' }}>{stats.usuarios}</div><div style={s.kpiLabel}>Usuarios</div></div>
            <div style={s.kpi}><div style={{ ...s.kpiVal, color: '#4ade80' }}>${recaudoActivo.toLocaleString('es-CO')}</div><div style={s.kpiLabel}>Recaudo actual</div></div>
            <div style={s.kpi}><div style={{ ...s.kpiVal, color: '#f87171' }}>${premiosPagadosActivo.toLocaleString('es-CO')}</div><div style={s.kpiLabel}>Premios pagados</div></div>
            <div style={s.kpi}><div style={{ ...s.kpiVal, color: '#D4AF37' }}>${utilidadActivo.toLocaleString('es-CO')}</div><div style={s.kpiLabel}>Utilidad actual</div></div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>💰 Contabilidad acumulada</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={s.kpi}><div style={{ ...s.kpiVal, color: '#4ade80', fontSize: '18px' }}>${saldoAcumulado.toLocaleString('es-CO')}</div><div style={s.kpiLabel}>Saldo total acumulado</div></div>
              <div style={s.kpi}><div style={{ ...s.kpiVal, fontSize: '18px' }}>{historialSorteos.filter(s => s.estado === 'jugado').length}</div><div style={s.kpiLabel}>Sorteos realizados</div></div>
            </div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>📈 Progreso sorteo #{String(sorteoActivo?.id || 1).padStart(4,'0')}</div>
            <div style={s.progressBar}><div style={{ ...s.progressFill, width: `${Math.min(((sorteoActivo?.total_boletas || 0) / 1000) * 100, 100)}%` }} /></div>
            <div style={s.progressText}>{sorteoActivo?.total_boletas || 0} / 1.000 boletas</div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>⚠️ Pendientes</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button style={s.btn} onClick={() => setTab('recargas')}>💳 Recargas ({stats.recargas_pendientes})</button>
              <button style={s.btn} onClick={() => setTab('recargas')}>💸 Retiros ({stats.retiros_pendientes})</button>
              <button style={{ ...s.btn, background: '#9333ea' }} onClick={() => setTab('revendedores')}>🤝 Revendedores ({solicitudesRevendedor.length})</button>
              <button style={{ ...s.btn, background: '#1d4ed8' }} onClick={() => setTab('buzon')}>💬 Mensajes ({Object.keys(usuariosMensaje).length})</button>
              <button style={s.btnSecondary} onClick={cargarDatos}>🔄 Actualizar</button>
            </div>
          </div>
        </div>
      )}

      {/* SORTEO */}
      {tab === 'sorteo' && (
        <div style={s.card}>
          <div style={s.cardTitle}>🎯 Número ganador — Sorteo #{String(sorteoActivo?.id || 1).padStart(4,'0')}</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input style={{ ...s.input, fontSize: '28px', letterSpacing: '8px', textAlign: 'center', maxWidth: '160px' }} value={winner} onChange={e => setWinner(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} placeholder="0000" maxLength={4} />
            <button style={{ ...s.btn, opacity: cargando ? 0.7 : 1 }} onClick={calcularGanadores} disabled={cargando}>{cargando ? 'Calculando...' : '🔍 Calcular'}</button>
          </div>
          {ganadores.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              {ganadores.map((g, i) => (
                <div key={i} style={s.ganadorRow}>
                  <div style={{ flex: 1 }}>
                    <span style={{ ...s.badge, background: categoriaBadge(g.categoria) }}>{g.categoria}</span>
                    <strong style={{ marginLeft: '8px', letterSpacing: '2px' }}>{g.numero}</strong>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{g.nombre} · {g.email}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontWeight: '600', color: g.esBoleta ? '#22c55e' : '#D4AF37' }}>
                      {g.esBoleta ? '🎟️ Boleta gratis' : `$${(g.premio).toLocaleString('es-CO')}`}
                    </div>
                    {g.esBoleta ? (
                      premiosPagados[`gratis_${g.numero}_${g.usuario_id}`]
                        ? <span style={{ fontSize: '12px', color: '#22c55e' }}>✅ Otorgada</span>
                        : <button style={{ ...s.btn, fontSize: '12px', padding: '6px 12px', background: '#22c55e', color: '#000' }} onClick={() => otorgarBoletaGratis(g)}>🎟️ Otorgar</button>
                    ) : (
                      premiosPagados[i]
                        ? <span style={{ fontSize: '12px', color: '#4ade80' }}>✅ Pagado</span>
                        : <button style={{ ...s.btn, fontSize: '12px', padding: '6px 12px' }} onClick={() => pagarPremio(g, i)}>💰 Pagar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: '#111', borderRadius: '10px', padding: '14px', border: '1px solid #D4AF3730' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#D4AF37', marginBottom: '8px' }}>⚠️ Cerrar sorteo e iniciar nuevo</div>
            <button style={{ ...s.btnDanger, opacity: cerrando ? 0.7 : 1, width: '100%' }} onClick={cerrarSorteo} disabled={cerrando}>{cerrando ? 'Cerrando...' : '🔄 Cerrar sorteo e iniciar nuevo'}</button>
          </div>
        </div>
      )}

      {/* PAGOS */}
      {tab === 'recargas' && (
        <div>
          <div style={s.card}>
            <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
              <span>💳 Recargas ({recargas.length})</span>
              <button style={s.btnSecondary} onClick={cargarDatos}>🔄</button>
            </div>
            {recargas.length === 0 ? <div style={s.empty}>✅ No hay recargas pendientes</div>
              : recargas.map(r => (
                <div key={r.id} style={s.recargaRow}>
                  <div><div style={s.recargaNombre}>{r.usuario?.nombre} · {r.metodo}</div><div style={s.recargaMeta}>${r.monto.toLocaleString('es-CO')} · {new Date(r.created_at).toLocaleString('es-CO')}</div>{r.comprobante_url && <div style={{ fontSize: '12px', color: '#D4AF37' }}>Comprobante: {r.comprobante_url}</div>}</div>
                  <div style={{ display: 'flex', gap: '6px' }}><button style={s.btn} onClick={() => aprobarRecarga(r.id)}>✅</button><button style={s.btnDanger} onClick={() => rechazarRecarga(r.id)}>❌</button></div>
                </div>
              ))}
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>💸 Retiros ({retiros.length})</div>
            {retiros.length === 0 ? <div style={s.empty}>✅ No hay retiros pendientes</div>
              : retiros.map(r => (
                <div key={r.id} style={s.recargaRow}>
                  <div><div style={s.recargaNombre}>{r.usuario?.nombre} · {r.metodo}</div><div style={s.recargaMeta}>${r.monto.toLocaleString('es-CO')} · {new Date(r.created_at).toLocaleString('es-CO')}</div><div style={{ fontSize: '12px', color: '#D4AF37' }}>Cuenta: {r.datos_pago}</div></div>
                  <div style={{ display: 'flex', gap: '6px' }}><button style={s.btn} onClick={() => aprobarRetiro(r.id)}>✅</button><button style={s.btnDanger} onClick={() => rechazarRetiro(r.id)}>❌</button></div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* REVENDEDORES */}
      {tab === 'revendedores' && (
        <div>
          <div style={s.card}>
            <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
              <span>🤝 Solicitudes ({solicitudesRevendedor.length})</span>
              <button style={s.btnSecondary} onClick={cargarDatos}>🔄</button>
            </div>
            {solicitudesRevendedor.length === 0 ? <div style={s.empty}>✅ No hay solicitudes</div>
              : solicitudesRevendedor.map(u => (
                <div key={u.id} style={s.recargaRow}>
                  <div><div style={s.recargaNombre}>{u.nombre}</div><div style={s.recargaMeta}>{u.email} · {u.celular} · Saldo: ${(u.saldo||0).toLocaleString('es-CO')}</div></div>
                  <div style={{ display: 'flex', gap: '6px' }}><button style={s.btn} onClick={() => aprobarRevendedor(u.id, u.nombre)}>✅ Aprobar</button><button style={s.btnDanger} onClick={() => rechazarRevendedor(u.id)}>❌</button></div>
                </div>
              ))}
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>👥 Revendedores activos</div>
            {usuarios.filter(u => u.rol === 'revendedor').length === 0 ? <div style={s.empty}>No hay revendedores</div>
              : usuarios.filter(u => u.rol === 'revendedor').map(u => (
                <div key={u.id} style={s.usuarioRow}>
                  <div style={{ ...s.avatar, background: '#4a0080' }}>🤝</div>
                  <div style={{ flex: 1 }}><div style={s.usuarioNombre}>{u.nombre}</div><div style={s.usuarioMeta}>{u.codigo_referido} · {u.email}</div></div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#4ade80' }}>${(u.saldo||0).toLocaleString('es-CO')}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* USUARIOS */}
      {tab === 'usuarios' && (
        <div style={s.card}>
          <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
            <span>👥 Usuarios ({usuarios.length})</span>
            <button style={s.btnSecondary} onClick={cargarDatos}>🔄</button>
          </div>
          {usuarios.map(u => (
            <div key={u.id} style={s.usuarioRow}>
              <div style={{ ...s.avatar, background: u.rol === 'revendedor' ? '#4a0080' : '#2a1f00' }}>
                {u.rol === 'revendedor' ? '🤝' : u.nombre?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.usuarioNombre}>{u.nombre}{u.rol === 'revendedor' && <span style={{ fontSize: '10px', background: '#4a0080', color: '#e879f9', padding: '1px 6px', borderRadius: '8px', marginLeft: '6px' }}>Revendedor</span>}</div>
                <div style={s.usuarioMeta}>{u.codigo_referido} · {u.email}</div>
                {usuarioAbierto === u.id && (
                  <div style={{ marginTop: '10px' }}>
                    {(boletasUsuario[u.id] || []).length === 0 ? <div style={{ fontSize: '12px', color: '#666' }}>No tiene boletas</div>
                      : (boletasUsuario[u.id] || []).map(b => (
                        <div key={b.id} style={{ background: '#0f0f0f', borderRadius: '8px', padding: '10px', marginBottom: '6px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#D4AF37', marginBottom: '4px' }}>Boleta #{String(b.id).padStart(3,'0')} {b.nombre_cliente ? `· ${b.nombre_cliente}` : ''}</div>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>{b.numeros?.map(n => <span key={n} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '3px 7px', fontSize: '12px', color: '#fff' }}>{n}</span>)}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#4ade80' }}>${(u.saldo||0).toLocaleString('es-CO')}</div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button style={{ ...s.btn, fontSize: '11px', padding: '4px 10px' }} onClick={() => abrirModal(u)}>✏️</button>
                  <button style={{ ...s.btnSecondary, fontSize: '11px', padding: '4px 10px' }} onClick={() => verBoletas(u.id)}>🎟️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BUZON */}
      {tab === 'buzon' && (
        <div style={{ display: 'grid', gridTemplateColumns: usuarioMensaje ? '1fr 2fr' : '1fr', gap: '12px' }}>
          <div style={s.card}>
            <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
              <span>💬 Conversaciones</span>
              <button style={s.btnSecondary} onClick={cargarDatos}>🔄</button>
            </div>
            {Object.keys(usuariosMensaje).length === 0 ? <div style={s.empty}>No hay mensajes</div>
              : Object.values(usuariosMensaje).map(({ usuario: u, ultimoMensaje }) => (
                <div key={ultimoMensaje.usuario_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ ...s.usuarioRow, cursor: 'pointer', flex: 1, background: usuarioMensaje?.id === ultimoMensaje.usuario_id ? '#2a2a2a' : '#111', marginBottom: 0 }} onClick={() => abrirChat(ultimoMensaje.usuario_id, u?.nombre)}>
                    <div style={s.avatar}>{u?.nombre?.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={s.usuarioNombre}>{u?.nombre}</div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{ultimoMensaje.contenido.slice(0, 35)}...</div>
                    </div>
                  </div>
                  <button style={{ ...s.btnDanger, fontSize: '11px', padding: '4px 10px', flexShrink: 0 }} onClick={() => eliminarConversacion(ultimoMensaje.usuario_id)}>🗑️</button>
                </div>
              ))}
          </div>

          {usuarioMensaje && (
            <div style={s.card}>
              <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
                <span>💬 {usuarioMensaje.nombre}</span>
                <button style={s.closeBtn} onClick={() => setUsuarioMensaje(null)}>✕</button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {chatMensajes.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.remitente === 'admin' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ background: m.remitente === 'admin' ? '#2a1f00' : '#1a1a1a', border: `1px solid ${m.remitente === 'admin' ? '#D4AF3740' : '#2a2a2a'}`, borderRadius: '10px', padding: '8px 12px', maxWidth: '80%' }}>
                      <div style={{ fontSize: '13px', color: m.remitente === 'admin' ? '#D4AF37' : '#fff' }}>{m.contenido}</div>
                      <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{new Date(m.created_at).toLocaleString('es-CO')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...s.input, flex: 1 }} placeholder="Responder..." value={respuesta} onChange={e => setRespuesta(e.target.value)} onKeyPress={e => e.key === 'Enter' && enviarRespuesta()} />
                <button style={s.btn} onClick={enviarRespuesta}>Enviar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANUNCIOS */}
      {tab === 'anuncios' && (
        <div>
          <div style={s.card}>
            <div style={s.cardTitle}>➕ Nuevo anuncio</div>
            <div style={s.field}><label style={s.fieldLabel}>Título</label><input style={s.input} placeholder="Título" value={nuevoAnuncio.titulo} onChange={e => setNuevoAnuncio({ ...nuevoAnuncio, titulo: e.target.value })} /></div>
            <div style={s.field}><label style={s.fieldLabel}>Contenido</label><textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} placeholder="Mensaje..." value={nuevoAnuncio.contenido} onChange={e => setNuevoAnuncio({ ...nuevoAnuncio, contenido: e.target.value })} /></div>
            <button style={s.btn} onClick={publicarAnuncio}>📢 Publicar</button>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>📋 Anuncios publicados</div>
            {anuncios.length === 0 ? <div style={s.empty}>No hay anuncios</div>
              : anuncios.map(a => (
                <div key={a.id} style={{ ...s.recargaRow, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{a.titulo}</div><div style={{ fontSize: '12px', color: '#ccc' }}>{a.contenido}</div></div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button style={{ ...s.btnSecondary, fontSize: '11px', padding: '4px 10px', color: a.activo ? '#4ade80' : '#f87171' }} onClick={() => toggleAnuncio(a.id, a.activo)}>{a.activo ? '✅' : '❌'}</button>
                    <button style={{ ...s.btnDanger, fontSize: '11px', padding: '4px 10px' }} onClick={() => eliminarAnuncio(a.id)}>🗑️</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* PAGINA */}
      {tab === 'pagina' && (
        <div style={s.card}>
          <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
            <span>📄 Quiénes somos</span>
            <button style={s.btnSecondary} onClick={() => setEditPagina(!editPagina)}>{editPagina ? 'Cancelar' : '✏️ Editar'}</button>
          </div>
          {!editPagina ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {[
                { label: 'Nombre', key: 'nombre' }, { label: 'Descripción', key: 'descripcion' },
                { label: 'Misión', key: 'mision' }, { label: 'WhatsApp', key: 'contacto_whatsapp' },
                { label: 'Email', key: 'contacto_email' }, { label: 'Instagram', key: 'redes_instagram' },
                { label: 'Facebook', key: 'redes_facebook' },
              ].map(f => (
                <div key={f.key} style={s.infoItem}><div style={s.infoLabel}>{f.label}</div><div style={s.infoVal}>{pagina[f.key] || <span style={{ color: '#555' }}>Sin definir</span>}</div></div>
              ))}
            </div>
          ) : (
            <div>
              {[
                { label: 'Nombre del negocio', key: 'nombre', type: 'text' },
                { label: 'Descripción', key: 'descripcion', type: 'textarea' },
                { label: 'Misión', key: 'mision', type: 'textarea' },
                { label: 'WhatsApp (sin +57)', key: 'contacto_whatsapp', type: 'text' },
                { label: 'Email de contacto', key: 'contacto_email', type: 'email' },
                { label: 'Instagram (sin @)', key: 'redes_instagram', type: 'text' },
                { label: 'Facebook', key: 'redes_facebook', type: 'text' },
              ].map(f => (
                <div key={f.key} style={s.field}>
                  <label style={s.fieldLabel}>{f.label}</label>
                  {f.type === 'textarea'
                    ? <textarea style={{ ...s.input, minHeight: '60px', resize: 'vertical' }} value={formPagina[f.key] || ''} onChange={e => setFormPagina({ ...formPagina, [f.key]: e.target.value })} />
                    : <input style={s.input} type={f.type} value={formPagina[f.key] || ''} onChange={e => setFormPagina({ ...formPagina, [f.key]: e.target.value })} />}
                </div>
              ))}
              <button style={s.btn} onClick={guardarPagina}>✅ Guardar</button>
            </div>
          )}
        </div>
      )}

      {/* HISTORIAL */}
      {tab === 'historial' && (
        <div style={s.card}>
          <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
            <span>📋 Historial de sorteos</span>
            <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600' }}>Acumulado: ${saldoAcumulado.toLocaleString('es-CO')}</div>
          </div>
          {historialSorteos.length === 0 ? <div style={s.empty}>No hay sorteos</div>
            : historialSorteos.map(s2 => (
              <div key={s2.id} style={{ background: '#111', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{s2.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{s2.numero_ganador ? <>Ganador: <strong style={{ color: '#D4AF37', letterSpacing: '2px' }}>{s2.numero_ganador}</strong></> : 'En curso'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', background: s2.estado === 'activo' ? '#14532d' : '#1a1a1a', color: s2.estado === 'activo' ? '#4ade80' : '#888', padding: '2px 8px', borderRadius: '10px' }}>{s2.estado}</span>
                    {s2.saldo_acumulado > 0 && <div style={{ fontSize: '13px', fontWeight: '600', color: '#4ade80', marginTop: '6px' }}>Utilidad: ${s2.saldo_acumulado.toLocaleString('es-CO')}</div>}
                    {s2.estado === 'jugado' && <button style={{ ...s.btnSecondary, fontSize: '11px', padding: '4px 10px', marginTop: '6px' }} onClick={() => verGanadoresSorteo(s2.id)}>{sorteoDetalle === s2.id ? 'Ocultar' : '🏆 Ganadores'}</button>}
                  </div>
                </div>
                {sorteoDetalle === s2.id && (
                  <div style={{ marginTop: '10px' }}>
                    {(boletasUsuario[`sorteo_${s2.id}`] || []).length === 0 ? <div style={{ fontSize: '12px', color: '#666' }}>Sin ganadores</div>
                      : (boletasUsuario[`sorteo_${s2.id}`] || []).map((g, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #2a2a2a', fontSize: '12px' }}>
                          <div><span style={{ ...s.badge, background: categoriaBadge(g.categoria), fontSize: '10px' }}>{g.categoria}</span> <strong style={{ marginLeft: '6px' }}>{g.numero}</strong> · {g.usuarios?.nombre}</div>
                          <div style={{ color: '#D4AF37', fontWeight: '600' }}>${g.premio.toLocaleString('es-CO')}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* SISTEMA */}
      {tab === 'sistema' && (
        <div>
          <div style={s.card}>
            <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
              <span>💳 Datos de pago (Nequi / Daviplata / USDT)</span>
              <button style={s.btnSecondary} onClick={() => setEditPago(!editPago)}>{editPago ? 'Cancelar' : '✏️ Editar'}</button>
            </div>
            {mensajePago && <div style={{ fontSize: '13px', color: mensajePago.startsWith('✅') ? '#4ade80' : '#f87171', marginBottom: '10px' }}>{mensajePago}</div>}
            {!editPago ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={s.infoItem}><div style={s.infoLabel}>📱 Nequi</div><div style={s.infoVal}>{pagina.pago_nequi || 'Sin configurar'}</div></div>
                <div style={s.infoItem}><div style={s.infoLabel}>🏦 Daviplata</div><div style={s.infoVal}>{pagina.pago_daviplata || 'Sin configurar'}</div></div>
                <div style={s.infoItem}><div style={s.infoLabel}>₮ USDT TRC20</div><div style={{ ...s.infoVal, fontSize: '11px', wordBreak: 'break-all' }}>{pagina.pago_usdt || 'Sin configurar'}</div></div>
              </div>
            ) : (
              <div>
                <div style={s.field}><label style={s.fieldLabel}>📱 Número Nequi</label><input style={s.input} placeholder="Ej: 3001234567" value={formPago.pago_nequi || ''} onChange={e => setFormPago({ ...formPago, pago_nequi: e.target.value })} /></div>
                <div style={s.field}><label style={s.fieldLabel}>🏦 Número Daviplata</label><input style={s.input} placeholder="Ej: 3001234567" value={formPago.pago_daviplata || ''} onChange={e => setFormPago({ ...formPago, pago_daviplata: e.target.value })} /></div>
                <div style={s.field}><label style={s.fieldLabel}>₮ Wallet USDT (TRC20)</label><input style={s.input} placeholder="Ej: TXxxxxxxxxxxxxxxxxxxxxxx" value={formPago.pago_usdt || ''} onChange={e => setFormPago({ ...formPago, pago_usdt: e.target.value })} /></div>
                <button style={{ ...s.btn, width: '100%' }} onClick={guardarPago}>✅ Guardar datos de pago</button>
              </div>
            )}
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>🎲 Generar boletas del sorteo activo</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '14px', lineHeight: '1.6' }}>
              Genera las 1.000 boletas pre-distribuidas para el sorteo actual. Úsalo al iniciar un nuevo sorteo o después de reiniciar el sistema.
            </div>
            {mensajeGenerar && (
              <div style={{ fontSize: '13px', color: mensajeGenerar.startsWith('✅') ? '#4ade80' : '#f87171', marginBottom: '10px' }}>
                {mensajeGenerar}
              </div>
            )}
            <button style={{ ...s.btn, width: '100%', opacity: generando ? 0.7 : 1 }} onClick={generarBoletasFn} disabled={generando}>
              {generando ? '⏳ Generando 1.000 boletas...' : '🎲 Generar boletas'}
            </button>
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>🔐 Cambiar credenciales del admin</div>
            <div style={s.field}><label style={s.fieldLabel}>Nuevo correo electrónico (opcional)</label><input style={s.input} type="email" placeholder="Nuevo correo" value={formCred.email} onChange={e => setFormCred({ ...formCred, email: e.target.value })} /></div>
            <div style={s.field}><label style={s.fieldLabel}>Contraseña actual *</label><input style={s.input} type="password" placeholder="Contraseña actual" value={formCred.password_actual} onChange={e => setFormCred({ ...formCred, password_actual: e.target.value })} /></div>
            <div style={s.field}><label style={s.fieldLabel}>Nueva contraseña (opcional)</label><input style={s.input} type="password" placeholder="Nueva contraseña (mín. 6)" value={formCred.password_nuevo} onChange={e => setFormCred({ ...formCred, password_nuevo: e.target.value })} /></div>
            <div style={s.field}><label style={s.fieldLabel}>Confirmar nueva contraseña</label><input style={s.input} type="password" placeholder="Repite la nueva contraseña" value={formCred.confirmar} onChange={e => setFormCred({ ...formCred, confirmar: e.target.value })} /></div>
            {mensajeCred && <div style={{ fontSize: '13px', color: mensajeCred.startsWith('✅') ? '#4ade80' : '#f87171', marginBottom: '10px' }}>{mensajeCred}</div>}
            <button style={s.btn} onClick={cambiarCredenciales}>🔐 Guardar cambios</button>
          </div>

          <div style={{ ...s.card, borderColor: '#5a0000' }}>
            <div style={{ ...s.cardTitle, color: '#f87171' }}>⚠️ Zona de peligro — Reiniciar sistema</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px', lineHeight: '1.6' }}>
              Borrará <strong style={{ color: '#f87171' }}>TODOS</strong> los datos: usuarios, boletas, saldos, historial y sorteos. El admin se mantiene con saldo en cero.
            </div>
            <div style={{ background: '#2a0000', borderRadius: '10px', padding: '16px', border: '1px solid #5a0000' }}>
              <div style={s.field}>
                <label style={s.fieldLabel}>Escribe <strong style={{ color: '#f87171' }}>REINICIAR</strong> para confirmar</label>
                <input style={{ ...s.input, borderColor: '#5a0000' }} placeholder="REINICIAR" value={confirmReinicio} onChange={e => setConfirmReinicio(e.target.value)} />
              </div>
              <button style={{ ...s.btnDanger, width: '100%', opacity: reiniciando ? 0.7 : 1, fontSize: '14px', padding: '12px' }} onClick={reiniciarSistema} disabled={reiniciando}>
                {reiniciando ? '⏳ Reiniciando...' : '🗑️ Reiniciar sistema'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL USUARIO */}
      {modalUsuario && (
        <div style={s.modalOverlay} onClick={() => setModalUsuario(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <div style={s.modalTitle}>👤 {modalUsuario.nombre}</div>
              <button style={s.closeBtn} onClick={() => setModalUsuario(null)}>✕</button>
            </div>
            {!editando ? (
              <div>
                <div style={s.infoGrid}>
                  {[
                    { label: 'Nombre', val: modalUsuario.nombre },
                    { label: 'Email', val: modalUsuario.email },
                    { label: 'Celular', val: modalUsuario.celular },
                    { label: 'Código', val: modalUsuario.codigo_referido, color: '#D4AF37' },
                    { label: 'Saldo', val: `$${(modalUsuario.saldo||0).toLocaleString('es-CO')}`, color: '#4ade80' },
                    { label: 'Rol', val: modalUsuario.rol, color: modalUsuario.rol === 'revendedor' ? '#e879f9' : '#fff' },
                  ].map((item, i) => (
                    <div key={i} style={s.infoItem}><div style={s.infoLabel}>{item.label}</div><div style={{ ...s.infoVal, color: item.color || '#fff' }}>{item.val}</div></div>
                  ))}
                </div>
                <div style={s.sectionTitle}>💰 Recargar manualmente</div>
                <input style={{ ...s.input, marginBottom: '8px' }} type="number" placeholder="Monto" value={recargarMonto} onChange={e => setRecargarMonto(e.target.value)} />
                <input style={{ ...s.input, marginBottom: '10px' }} placeholder="Descripción" value={recargarDesc} onChange={e => setRecargarDesc(e.target.value)} />
                <button style={{ ...s.btn, width: '100%', marginBottom: '12px' }} onClick={recargarUsuario}>💰 Recargar</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...s.btnSecondary, flex: 1 }} onClick={() => setEditando(true)}>✏️ Editar</button>
                  <button style={{ ...s.btnDanger, flex: 1 }} onClick={() => eliminarUsuario(modalUsuario.id)}>🗑️ Eliminar</button>
                </div>
              </div>
            ) : (
              <div>
                {[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'celular', label: 'Celular', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'saldo', label: 'Saldo', type: 'number' }].map(f => (
                  <div key={f.key} style={s.field}><label style={s.fieldLabel}>{f.label}</label><input style={s.input} type={f.type} value={formEdit[f.key] || ''} onChange={e => setFormEdit({ ...formEdit, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })} /></div>
                ))}
                <div style={s.field}>
                  <label style={s.fieldLabel}>Estado</label>
                  <select style={s.input} value={formEdit.activo} onChange={e => setFormEdit({ ...formEdit, activo: e.target.value === 'true' })}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...s.btn, flex: 1 }} onClick={guardarEdicion}>✅ Guardar</button>
                  <button style={{ ...s.btnSecondary, flex: 1 }} onClick={() => setEditando(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function categoriaBadge(cat) {
  const m = { 'Premio Mayor': '#8B6914', '3 Primeras': '#5020A0', '3 Últimas': '#1050A0', '2 Últimas': '#106020' }
  return m[cat] || '#333'
}

const s = {
  container: { minHeight: '100vh', background: '#0f0f0f', padding: '1.5rem', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #2a2a2a' },
  logo: { fontSize: '20px', fontWeight: '600' },
  gold: { color: '#D4AF37' },
  sub: { fontSize: '12px', color: '#666', marginTop: '3px' },
  badge: { background: '#2a1f00', color: '#D4AF37', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '500' },
  logoutBtn: { fontSize: '12px', color: '#f87171', background: 'none', border: '1px solid #5a0000', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '1.5rem', borderBottom: '1px solid #2a2a2a', flexWrap: 'wrap' },
  tab: { padding: '8px 10px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', color: '#666', borderBottom: '2px solid transparent', marginBottom: '-1px', whiteSpace: 'nowrap' },
  tabActive: { color: '#fff', borderBottom: '2px solid #D4AF37', fontWeight: '500' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '1rem' },
  kpi: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '14px', textAlign: 'center' },
  kpiVal: { fontSize: '20px', fontWeight: '600', color: '#fff' },
  kpiLabel: { fontSize: '10px', color: '#666', marginTop: '4px' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
  cardTitle: { fontSize: '14px', fontWeight: '600', marginBottom: '14px', color: '#fff' },
  progressBar: { background: '#2a2a2a', borderRadius: '4px', height: '8px', overflow: 'hidden', marginBottom: '6px' },
  progressFill: { height: '100%', background: '#D4AF37', borderRadius: '4px' },
  progressText: { fontSize: '12px', color: '#888' },
  btn: { background: '#D4AF37', color: '#1a1200', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' },
  btnDanger: { background: '#2a0000', color: '#f87171', border: '1px solid #5a0000', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' },
  input: { background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' },
  recargaRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#111', borderRadius: '8px', marginBottom: '8px', gap: '10px' },
  recargaNombre: { fontSize: '13px', fontWeight: '600', marginBottom: '3px' },
  recargaMeta: { fontSize: '11px', color: '#888' },
  ganadorRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#111', borderRadius: '8px', marginBottom: '6px' },
  usuarioRow: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: '#111', borderRadius: '8px', marginBottom: '6px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#2a1f00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: '#D4AF37', flexShrink: 0 },
  usuarioNombre: { fontSize: '13px', fontWeight: '600' },
  usuarioMeta: { fontSize: '11px', color: '#888', marginTop: '2px' },
  empty: { textAlign: 'center', color: '#666', padding: '2rem', fontSize: '13px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '16px', fontWeight: '600' },
  closeBtn: { background: 'none', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  infoItem: { background: '#111', borderRadius: '8px', padding: '10px' },
  infoLabel: { fontSize: '11px', color: '#666', marginBottom: '3px' },
  infoVal: { fontSize: '13px', fontWeight: '600' },
  sectionTitle: { fontSize: '13px', fontWeight: '600', color: '#D4AF37', marginBottom: '10px' },
  field: { marginBottom: '10px' },
  fieldLabel: { fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' },
}
