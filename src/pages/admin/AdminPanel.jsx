import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const API = import.meta.env.VITE_API_URL

export default function AdminPanel() {
  const { usuario, token, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState({ boletas: 0, recaudo: 0, usuarios: 0, recargas_pendientes: 0, retiros_pendientes: 0 })
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

  useEffect(() => { cargarDatos() }, [tab])

  const h = () => ({ Authorization: `Bearer ${token}` })

  const cargarDatos = async () => {
    try {
      const [statsRes, recargasRes, usuariosRes, retirosRes, anunciosRes, historialRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: h() }),
        axios.get(`${API}/admin/recargas`, { headers: h() }),
        axios.get(`${API}/admin/usuarios`, { headers: h() }),
        axios.get(`${API}/retiros/pendientes`, { headers: h() }),
        axios.get(`${API}/anuncios/todos`, { headers: h() }),
        axios.get(`${API}/admin/sorteos/historial`, { headers: h() }),
      ])
      setStats(statsRes.data)
      setSorteoActivo(statsRes.data.sorteo)
      setRecargas(recargasRes.data)
      setUsuarios(usuariosRes.data)
      setRetiros(retirosRes.data)
      setAnuncios(anunciosRes.data)
      setHistorialSorteos(historialRes.data)
      const total = historialRes.data.filter(s => s.estado === 'jugado').reduce((acc, s) => acc + (s.saldo_acumulado || 0), 0)
      setSaldoAcumulado(total)
    } catch (err) { console.error('Error cargando datos:', err) }
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

  const abrirModal = (u) => {
    setModalUsuario(u)
    setFormEdit({ nombre: u.nombre, celular: u.celular, email: u.email, saldo: u.saldo, activo: u.activo })
    setEditando(false); setRecargarMonto(''); setRecargarDesc('')
  }

  const guardarEdicion = async () => {
    try {
      await axios.put(`${API}/admin/usuarios/${modalUsuario.id}`, formEdit, { headers: h() })
      cargarDatos(); setModalUsuario(null); alert('✅ Usuario actualizado')
    } catch (err) { alert('Error al actualizar') }
  }

  const eliminarUsuario = async (id) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
    try {
      await axios.delete(`${API}/admin/usuarios/${id}`, { headers: h() })
      cargarDatos(); setModalUsuario(null); alert('✅ Usuario eliminado')
    } catch (err) { alert('Error al eliminar') }
  }

  const recargarUsuario = async () => {
    if (!recargarMonto || Number(recargarMonto) <= 0) return alert('Monto inválido')
    try {
      await axios.post(`${API}/admin/usuarios/${modalUsuario.id}/recargar`, { monto: Number(recargarMonto), descripcion: recargarDesc || 'Recarga manual por administrador' }, { headers: h() })
      cargarDatos(); setModalUsuario(null); alert(`✅ Saldo recargado`)
    } catch (err) { alert('Error al recargar') }
  }

  const aprobarRecarga = async (id) => {
    try { await axios.post(`${API}/admin/recargas/${id}/aprobar`, {}, { headers: h() }); cargarDatos() }
    catch (err) { alert('Error al aprobar recarga') }
  }

  const rechazarRecarga = async (id) => {
    try { await axios.post(`${API}/admin/recargas/${id}/rechazar`, {}, { headers: h() }); cargarDatos() }
    catch (err) { alert('Error al rechazar recarga') }
  }

  const aprobarRetiro = async (id) => {
    try { await axios.post(`${API}/retiros/${id}/aprobar`, {}, { headers: h() }); cargarDatos(); alert('✅ Retiro aprobado') }
    catch (err) { alert('Error al aprobar retiro') }
  }

  const rechazarRetiro = async (id) => {
    try { await axios.post(`${API}/retiros/${id}/rechazar`, {}, { headers: h() }); cargarDatos(); alert('✅ Retiro rechazado — saldo devuelto') }
    catch (err) { alert('Error al rechazar retiro') }
  }

  const calcularGanadores = async () => {
    if (!/^\d{4}$/.test(winner)) return alert('Ingresa exactamente 4 dígitos')
    setCargando(true)
    try {
      const { data } = await axios.post(`${API}/admin/sorteo/ganadores`, { numero: winner }, { headers: h() })
      setGanadores(data); setPremiosPagados({})
    } catch (err) { alert('Error al calcular') }
    finally { setCargando(false) }
  }

  const pagarPremio = async (g, idx) => {
    if (!confirm(`¿Pagar $${g.premio.toLocaleString('es-CO')} a ${g.nombre}?`)) return
    try {
      await axios.post(`${API}/admin/sorteo/pagar-premio`, { usuario_id: g.usuario_id, premio: g.premio, categoria: g.categoria, numero: g.numero }, { headers: h() })
      setPremiosPagados(prev => ({ ...prev, [idx]: true }))
      cargarDatos()
    } catch (err) { alert('Error al pagar premio') }
  }

  const cerrarSorteo = async () => {
    if (!winner || winner.length !== 4) return alert('Primero ingresa el número ganador de 4 dígitos')
    if (!confirm(`¿Cerrar el sorteo actual con número ganador ${winner} e iniciar uno nuevo? Esta acción no se puede deshacer.`)) return
    setCerrando(true)
    try {
      const { data } = await axios.post(`${API}/admin/sorteo/cerrar`, { numero_ganador: winner }, { headers: h() })
      alert(`✅ Sorteo cerrado exitosamente.\nUtilidad: $${data.utilidad.toLocaleString('es-CO')}\nSaldo acumulado total: $${data.saldo_total.toLocaleString('es-CO')}\n\n¡El nuevo sorteo ha iniciado!`)
      setWinner(''); setGanadores([]); setPremiosPagados({})
      cargarDatos()
    } catch (err) { alert('Error al cerrar sorteo: ' + (err.response?.data?.error || err.message)) }
    finally { setCerrando(false) }
  }

  const publicarAnuncio = async () => {
    if (!nuevoAnuncio.titulo || !nuevoAnuncio.contenido) return alert('Completa título y contenido')
    try {
      await axios.post(`${API}/anuncios`, nuevoAnuncio, { headers: h() })
      setNuevoAnuncio({ titulo: '', contenido: '' }); cargarDatos(); alert('✅ Anuncio publicado')
    } catch (err) { alert('Error al publicar anuncio') }
  }

  const toggleAnuncio = async (id, activo) => {
    try { await axios.put(`${API}/anuncios/${id}`, { activo: !activo }, { headers: h() }); cargarDatos() }
    catch (err) { alert('Error al actualizar anuncio') }
  }

  const eliminarAnuncio = async (id) => {
    if (!confirm('¿Eliminar este anuncio?')) return
    try { await axios.delete(`${API}/anuncios/${id}`, { headers: h() }); cargarDatos() }
    catch (err) { alert('Error al eliminar anuncio') }
  }

  const recaudoActivo = sorteoActivo ? (sorteoActivo.total_boletas * 5000) : 0
  const premiosPagadosActivo = sorteoActivo?.premios_pagados || 0
  const utilidadActivo = recaudoActivo - premiosPagadosActivo

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
          { id: 'usuarios', label: '👥 Usuarios' },
          { id: 'anuncios', label: '📢 Anuncios' },
          { id: 'historial', label: '📋 Historial' },
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
            <div style={s.kpi}><div style={{ ...s.kpiVal, color: '#4ade80' }}>${recaudoActivo.toLocaleString('es-CO')}</div><div style={s.kpiLabel}>Recaudo sorteo actual</div></div>
            <div style={s.kpi}><div style={{ ...s.kpiVal, color: '#f87171' }}>${premiosPagadosActivo.toLocaleString('es-CO')}</div><div style={s.kpiLabel}>Premios pagados</div></div>
            <div style={s.kpi}><div style={{ ...s.kpiVal, color: '#D4AF37' }}>${utilidadActivo.toLocaleString('es-CO')}</div><div style={s.kpiLabel}>Utilidad actual</div></div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>💰 Contabilidad acumulada</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={s.kpi}><div style={{ ...s.kpiVal, color: '#4ade80', fontSize: '18px' }}>${saldoAcumulado.toLocaleString('es-CO')}</div><div style={s.kpiLabel}>Saldo total acumulado (sorteos cerrados)</div></div>
              <div style={s.kpi}><div style={{ ...s.kpiVal, fontSize: '18px' }}>{historialSorteos.filter(s => s.estado === 'jugado').length}</div><div style={s.kpiLabel}>Sorteos realizados</div></div>
            </div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>📈 Progreso sorteo #{String(sorteoActivo?.id || 1).padStart(4,'0')}</div>
            <div style={s.progressBar}><div style={{ ...s.progressFill, width: `${Math.min(((sorteoActivo?.total_boletas || 0) / 1000) * 100, 100)}%` }} /></div>
            <div style={s.progressText}>{sorteoActivo?.total_boletas || 0} / 1.000 boletas — {(((sorteoActivo?.total_boletas || 0) / 1000) * 100).toFixed(1)}% vendido</div>
          </div>
          <div style={s.card}>
            <div style={s.cardTitle}>⚠️ Pendientes</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button style={s.btn} onClick={() => setTab('recargas')}>💳 Recargas ({stats.recargas_pendientes})</button>
              <button style={s.btn} onClick={() => setTab('recargas')}>💸 Retiros ({stats.retiros_pendientes})</button>
              <button style={s.btnSecondary} onClick={cargarDatos}>🔄 Actualizar</button>
            </div>
          </div>
        </div>
      )}

      {/* SORTEO */}
      {tab === 'sorteo' && (
        <div>
          <div style={s.card}>
            <div style={s.cardTitle}>🎯 Número ganador — Sorteo #{String(sorteoActivo?.id || 1).padStart(4,'0')}</div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input
                style={{ ...s.input, fontSize: '28px', letterSpacing: '8px', textAlign: 'center', maxWidth: '160px' }}
                value={winner}
                onChange={e => setWinner(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="0000" maxLength={4}
              />
              <button style={{ ...s.btn, opacity: cargando ? 0.7 : 1 }} onClick={calcularGanadores} disabled={cargando}>
                {cargando ? 'Calculando...' : '🔍 Calcular ganadores'}
              </button>
            </div>

            {ganadores.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>{ganadores.length} ganador(es):</div>
                {ganadores.map((g, i) => (
                  <div key={i} style={s.ganadorRow}>
                    <div style={{ flex: 1 }}>
                      <span style={{ ...s.badge, background: categoriaBadge(g.categoria) }}>{g.categoria}</span>
                      <strong style={{ marginLeft: '8px', letterSpacing: '2px' }}>{g.numero}</strong>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{g.nombre} · {g.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontWeight: '600', color: '#D4AF37' }}>${(g.premio).toLocaleString('es-CO')}</div>
                      {premiosPagados[i] ? (
                        <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: '600' }}>✅ Pagado</span>
                      ) : (
                        <button style={{ ...s.btn, fontSize: '12px', padding: '6px 12px' }} onClick={() => pagarPremio(g, i)}>💰 Pagar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#111', borderRadius: '10px', padding: '14px', border: '1px solid #D4AF3730' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#D4AF37', marginBottom: '8px' }}>⚠️ Cerrar sorteo e iniciar nuevo</div>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                Esto cerrará el sorteo actual, guardará la utilidad al saldo acumulado y creará un nuevo sorteo con todos los números disponibles.
              </div>
              <button style={{ ...s.btnDanger, opacity: cerrando ? 0.7 : 1, width: '100%' }} onClick={cerrarSorteo} disabled={cerrando}>
                {cerrando ? 'Cerrando...' : '🔄 Cerrar sorteo e iniciar nuevo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGOS (recargas + retiros) */}
      {tab === 'recargas' && (
        <div>
          <div style={s.card}>
            <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
              <span>💳 Recargas pendientes ({recargas.length})</span>
              <button style={s.btnSecondary} onClick={cargarDatos}>🔄</button>
            </div>
            {recargas.length === 0 ? <div style={s.empty}>✅ No hay recargas pendientes</div>
              : recargas.map(r => (
                <div key={r.id} style={s.recargaRow}>
                  <div>
                    <div style={s.recargaNombre}>{r.usuario?.nombre} · {r.metodo}</div>
                    <div style={s.recargaMeta}>${r.monto.toLocaleString('es-CO')} · {new Date(r.created_at).toLocaleString('es-CO')}</div>
                    {r.comprobante_url && <div style={{ fontSize: '12px', color: '#D4AF37', marginTop: '3px' }}>Comprobante: {r.comprobante_url}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={s.btn} onClick={() => aprobarRecarga(r.id)}>✅ Aprobar</button>
                    <button style={s.btnDanger} onClick={() => rechazarRecarga(r.id)}>❌</button>
                  </div>
                </div>
              ))}
          </div>

          <div style={s.card}>
            <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
              <span>💸 Retiros pendientes ({retiros.length})</span>
            </div>
            {retiros.length === 0 ? <div style={s.empty}>✅ No hay retiros pendientes</div>
              : retiros.map(r => (
                <div key={r.id} style={s.recargaRow}>
                  <div>
                    <div style={s.recargaNombre}>{r.usuario?.nombre} · {r.metodo}</div>
                    <div style={s.recargaMeta}>${r.monto.toLocaleString('es-CO')} · {new Date(r.created_at).toLocaleString('es-CO')}</div>
                    <div style={{ fontSize: '12px', color: '#D4AF37', marginTop: '3px' }}>Cuenta: {r.datos_pago}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={s.btn} onClick={() => aprobarRetiro(r.id)}>✅ Aprobar</button>
                    <button style={s.btnDanger} onClick={() => rechazarRetiro(r.id)}>❌</button>
                  </div>
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
            <button style={s.btnSecondary} onClick={cargarDatos}>🔄 Actualizar</button>
          </div>
          {usuarios.map(u => (
            <div key={u.id} style={s.usuarioRow}>
              <div style={s.avatar}>{u.nombre?.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={s.usuarioNombre}>{u.nombre} {!u.activo && <span style={{ fontSize: '11px', color: '#f87171' }}>(Inactivo)</span>}</div>
                <div style={s.usuarioMeta}>{u.codigo_referido} · {u.email} · {u.celular}</div>
                {usuarioAbierto === u.id && (
                  <div style={{ marginTop: '10px' }}>
                    {(boletasUsuario[u.id] || []).length === 0
                      ? <div style={{ fontSize: '12px', color: '#666' }}>No tiene boletas</div>
                      : (boletasUsuario[u.id] || []).map(b => (
                        <div key={b.id} style={{ background: '#0f0f0f', borderRadius: '8px', padding: '10px', marginBottom: '6px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#D4AF37', marginBottom: '6px' }}>
                            Boleta #{String(b.id).padStart(3,'0')} · {new Date(b.created_at).toLocaleDateString('es-CO')}
                          </div>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {b.numeros?.map(n => <span key={n} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', padding: '3px 7px', fontSize: '12px', fontWeight: '600', color: '#fff' }}>{n}</span>)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#4ade80' }}>${(u.saldo || 0).toLocaleString('es-CO')}</div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button style={{ ...s.btn, fontSize: '11px', padding: '4px 10px' }} onClick={() => abrirModal(u)}>✏️ Gestionar</button>
                  <button style={{ ...s.btnSecondary, fontSize: '11px', padding: '4px 10px' }} onClick={() => verBoletas(u.id)}>{usuarioAbierto === u.id ? 'Ocultar' : '🎟️ Boletas'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANUNCIOS */}
      {tab === 'anuncios' && (
        <div>
          <div style={s.card}>
            <div style={s.cardTitle}>➕ Publicar nuevo anuncio</div>
            <div style={s.field}>
              <label style={s.fieldLabel}>Título</label>
              <input style={s.input} placeholder="Ej: Fecha del próximo sorteo" value={nuevoAnuncio.titulo} onChange={e => setNuevoAnuncio({ ...nuevoAnuncio, titulo: e.target.value })} />
            </div>
            <div style={s.field}>
              <label style={s.fieldLabel}>Contenido</label>
              <textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} placeholder="Escribe el mensaje para tus clientes..." value={nuevoAnuncio.contenido} onChange={e => setNuevoAnuncio({ ...nuevoAnuncio, contenido: e.target.value })} />
            </div>
            <button style={s.btn} onClick={publicarAnuncio}>📢 Publicar anuncio</button>
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>📋 Anuncios publicados</div>
            {anuncios.length === 0 ? <div style={s.empty}>No hay anuncios publicados</div>
              : anuncios.map(a => (
                <div key={a.id} style={{ ...s.recargaRow, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{a.titulo}</div>
                    <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px' }}>{a.contenido}</div>
                    <div style={{ fontSize: '11px', color: '#555' }}>{new Date(a.created_at).toLocaleDateString('es-CO')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button style={{ ...s.btnSecondary, fontSize: '11px', padding: '4px 10px', color: a.activo ? '#4ade80' : '#f87171' }} onClick={() => toggleAnuncio(a.id, a.activo)}>
                      {a.activo ? '✅ Activo' : '❌ Inactivo'}
                    </button>
                    <button style={{ ...s.btnDanger, fontSize: '11px', padding: '4px 10px' }} onClick={() => eliminarAnuncio(a.id)}>🗑️</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      {tab === 'historial' && (
        <div style={s.card}>
          <div style={{ ...s.cardTitle, display: 'flex', justifyContent: 'space-between' }}>
            <span>📋 Historial de sorteos</span>
            <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: '600' }}>Acumulado: ${saldoAcumulado.toLocaleString('es-CO')}</div>
          </div>
          {historialSorteos.length === 0 ? <div style={s.empty}>No hay sorteos registrados</div>
            : historialSorteos.map(s2 => (
              <div key={s2.id} style={{ background: '#111', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{s2.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {s2.numero_ganador ? `Número ganador: ` : 'En curso'}
                      {s2.numero_ganador && <strong style={{ color: '#D4AF37', letterSpacing: '2px' }}>{s2.numero_ganador}</strong>}
                    </div>
                    {s2.jugado_at && <div style={{ fontSize: '11px', color: '#555', marginTop: '3px' }}>{new Date(s2.jugado_at).toLocaleDateString('es-CO')}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', background: s2.estado === 'activo' ? '#14532d' : '#1a1a1a', color: s2.estado === 'activo' ? '#4ade80' : '#888', padding: '2px 8px', borderRadius: '10px' }}>
                      {s2.estado}
                    </span>
                    {s2.saldo_acumulado > 0 && <div style={{ fontSize: '13px', fontWeight: '600', color: '#4ade80', marginTop: '6px' }}>Utilidad: ${s2.saldo_acumulado.toLocaleString('es-CO')}</div>}
                    {s2.estado === 'jugado' && (
                      <button style={{ ...s.btnSecondary, fontSize: '11px', padding: '4px 10px', marginTop: '6px' }} onClick={() => verGanadoresSorteo(s2.id)}>
                        {sorteoDetalle === s2.id ? 'Ocultar' : '🏆 Ver ganadores'}
                      </button>
                    )}
                  </div>
                </div>
                {sorteoDetalle === s2.id && (
                  <div style={{ marginTop: '10px' }}>
                    {(boletasUsuario[`sorteo_${s2.id}`] || []).length === 0
                      ? <div style={{ fontSize: '12px', color: '#666' }}>No se registraron ganadores</div>
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
                    { label: 'Saldo', val: `$${(modalUsuario.saldo || 0).toLocaleString('es-CO')}`, color: '#4ade80' },
                    { label: 'Estado', val: modalUsuario.activo ? 'Activo' : 'Inactivo', color: modalUsuario.activo ? '#4ade80' : '#f87171' },
                  ].map((item, i) => (
                    <div key={i} style={s.infoItem}>
                      <div style={s.infoLabel}>{item.label}</div>
                      <div style={{ ...s.infoVal, color: item.color || '#fff' }}>{item.val}</div>
                    </div>
                  ))}
                </div>
                <div style={s.sectionTitle}>💰 Recargar saldo manualmente</div>
                <input style={{ ...s.input, marginBottom: '8px' }} type="number" placeholder="Monto" value={recargarMonto} onChange={e => setRecargarMonto(e.target.value)} />
                <input style={{ ...s.input, marginBottom: '10px' }} placeholder="Descripción (opcional)" value={recargarDesc} onChange={e => setRecargarDesc(e.target.value)} />
                <button style={{ ...s.btn, width: '100%', marginBottom: '12px' }} onClick={recargarUsuario}>💰 Recargar saldo</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ ...s.btnSecondary, flex: 1 }} onClick={() => setEditando(true)}>✏️ Editar</button>
                  <button style={{ ...s.btnDanger, flex: 1 }} onClick={() => eliminarUsuario(modalUsuario.id)}>🗑️ Eliminar</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={s.sectionTitle}>✏️ Editar información</div>
                {[
                  { key: 'nombre', label: 'Nombre', type: 'text' },
                  { key: 'celular', label: 'Celular', type: 'text' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'saldo', label: 'Saldo', type: 'number' },
                ].map(f => (
                  <div key={f.key} style={s.field}>
                    <label style={s.fieldLabel}>{f.label}</label>
                    <input style={s.input} type={f.type} value={formEdit[f.key] || ''} onChange={e => setFormEdit({ ...formEdit, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })} />
                  </div>
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
  tab: { padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#666', borderBottom: '2px solid transparent', marginBottom: '-1px' },
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
