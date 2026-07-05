import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL

export default function QuienesSomos() {
  const [info, setInfo] = useState({})
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    axios.get(`${API}/pagina`).then(({ data }) => {
      setInfo(data)
      setCargando(false)
    }).catch(() => setCargando(false))
  }, [])

  if (cargando) return <div style={{ background: '#0f0f0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Cargando...</div>

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.logo}>🎟️ <span style={s.gold}>GANA GANA</span> O <span style={s.gold}>GANA</span></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/login" style={s.linkBtn}>Iniciar sesión</Link>
          <Link to="/register" style={s.btnPrimary}>Registrarse</Link>
        </div>
      </div>

      <div style={s.hero}>
        <div style={s.heroIcon}>🎟️</div>
        <div style={s.heroTitle}>{info.nombre || 'GANA GANA O GANA'}</div>
        <div style={s.heroSub}>{info.descripcion || ''}</div>
      </div>

      <div style={s.grid}>
        <div style={s.card}>
          <div style={s.cardIcon}>🎯</div>
          <div style={s.cardTitle}>Nuestra misión</div>
          <div style={s.cardText}>{info.mision || ''}</div>
        </div>

        <div style={s.card}>
          <div style={s.cardIcon}>🏆</div>
          <div style={s.cardTitle}>¿Cómo funciona?</div>
          <div style={s.cardText}>
            Compra tu boleta por solo <strong style={{ color: '#D4AF37' }}>$5.000 COP</strong> y obtén 10 números para participar. El sorteo juega al venderse todas las boletas. ¡Tienes 10 chances de ganar!
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardIcon}>💰</div>
          <div style={s.cardTitle}>Premios</div>
          <div style={s.cardText}>
            <div style={s.premioItem}>🥇 Premio Mayor (4 cifras): <strong style={{ color: '#D4AF37' }}>$2.000.000</strong></div>
            <div style={s.premioItem}>🥈 3 primeras cifras: <strong style={{ color: '#9333ea' }}>$50.000</strong></div>
            <div style={s.premioItem}>🥉 3 últimas cifras: <strong style={{ color: '#3b82f6' }}>$50.000</strong></div>
            <div style={s.premioItem}>🎁 2 últimas cifras: <strong style={{ color: '#22c55e' }}>Boleta gratis</strong></div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardIcon}>📱</div>
          <div style={s.cardTitle}>Contáctanos</div>
          <div style={s.cardText}>
            {info.contacto_whatsapp && (
              <a href={`https://wa.me/57${info.contacto_whatsapp}`} target="_blank" rel="noreferrer" style={s.contactLink}>
                📱 WhatsApp: +57 {info.contacto_whatsapp}
              </a>
            )}
            {info.contacto_email && (
              <a href={`mailto:${info.contacto_email}`} style={s.contactLink}>
                ✉️ {info.contacto_email}
              </a>
            )}
            {info.redes_instagram && (
              <a href={`https://instagram.com/${info.redes_instagram}`} target="_blank" rel="noreferrer" style={s.contactLink}>
                📸 Instagram: @{info.redes_instagram}
              </a>
            )}
            {info.redes_facebook && (
              <a href={`https://facebook.com/${info.redes_facebook}`} target="_blank" rel="noreferrer" style={s.contactLink}>
                👤 Facebook: {info.redes_facebook}
              </a>
            )}
          </div>
        </div>
      </div>

      <div style={s.cta}>
        <div style={s.ctaTitle}>¿Listo para ganar?</div>
        <div style={s.ctaSub}>Únete a miles de participantes y gana hasta $2.000.000 COP</div>
        <Link to="/register" style={s.ctaBtn}>🎟️ Comprar boleta ahora</Link>
      </div>

      <div style={s.footer}>
        <Link to="/resultados" style={s.footerLink}>🏆 Ver resultados</Link>
        <Link to="/login" style={s.footerLink}>👤 Iniciar sesión</Link>
        <Link to="/register" style={s.footerLink}>📝 Registrarse</Link>
      </div>
    </div>
  )
}

const s = {
  container: { minHeight: '100vh', background: '#0f0f0f', color: '#fff', padding: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' },
  logo: { fontSize: '20px', fontWeight: '600' },
  gold: { color: '#D4AF37' },
  linkBtn: { color: '#D4AF37', textDecoration: 'none', fontSize: '13px', padding: '6px 14px', border: '1px solid #D4AF3740', borderRadius: '8px' },
  btnPrimary: { background: '#D4AF37', color: '#1a1200', textDecoration: 'none', fontSize: '13px', fontWeight: '600', padding: '6px 14px', borderRadius: '8px' },
  hero: { textAlign: 'center', marginBottom: '3rem', padding: '2rem 0' },
  heroIcon: { fontSize: '48px', marginBottom: '12px' },
  heroTitle: { fontSize: '36px', fontWeight: '700', color: '#D4AF37', marginBottom: '12px' },
  heroSub: { fontSize: '16px', color: '#aaa', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '3rem' },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '20px' },
  cardIcon: { fontSize: '28px', marginBottom: '10px' },
  cardTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#D4AF37' },
  cardText: { fontSize: '14px', color: '#aaa', lineHeight: '1.6' },
  premioItem: { marginBottom: '6px' },
  contactLink: { display: 'block', color: '#D4AF37', textDecoration: 'none', marginBottom: '8px', fontSize: '14px' },
  cta: { background: 'linear-gradient(135deg, #2a1f00, #4a3800)', borderRadius: '20px', padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' },
  ctaTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '8px' },
  ctaSub: { fontSize: '14px', color: '#D4AF37', opacity: 0.8, marginBottom: '20px' },
  ctaBtn: { background: '#D4AF37', color: '#1a1200', textDecoration: 'none', fontWeight: '700', fontSize: '16px', padding: '14px 28px', borderRadius: '12px', display: 'inline-block' },
  footer: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #2a2a2a' },
  footerLink: { color: '#666', textDecoration: 'none', fontSize: '13px' },
}
