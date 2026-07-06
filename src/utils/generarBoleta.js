export const generarBoletaPNG = async (boleta, usuario, sorteo) => {
  const canvas = document.createElement('canvas')
  const W = 600
  const H = 920
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const pad = n => String(n).padStart(4, '0')
  const numeros = boleta.numeros || []
  const nombreCliente = boleta.nombre_cliente || usuario?.nombre || 'Cliente'
  const celularCliente = boleta.celular_cliente || usuario?.celular || ''
  const vendedor = boleta.nombre_cliente ? usuario?.nombre : null
  const fecha = new Date(boleta.created_at)
  const fechaStr = fecha.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const horaStr = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  // FONDO NEGRO
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, W, H)

  // LOGO MARCA DE AGUA
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = '/logo-ganagana.png'
    })
    ctx.globalAlpha = 0.07
    const imgSize = W * 0.85
    ctx.drawImage(img, (W - imgSize) / 2, (H - imgSize) / 2 - 40, imgSize, imgSize)
    ctx.globalAlpha = 1.0
  } catch (e) { console.log('Sin marca de agua') }

  // HEADER
  const grad = ctx.createLinearGradient(0, 0, W, 95)
  grad.addColorStop(0, '#1a1200')
  grad.addColorStop(0.5, '#2a1f00')
  grad.addColorStop(1, '#1a1200')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, 95)
  ctx.fillStyle = '#D4AF37'
  ctx.fillRect(0, 93, W, 2)

  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('GANA GANA O GANA', W / 2, 38)

  ctx.fillStyle = '#aaa'
  ctx.font = '13px Arial'
  ctx.fillText(`${sorteo?.nombre || 'Sorteo #0001'}  ·  Boleta #${String(boleta.id).padStart(3,'0')}`, W / 2, 62)

  ctx.fillStyle = '#555'
  ctx.font = '11px Arial'
  ctx.fillText('ganaganaogana.com', W / 2, 82)

  // DATOS CLIENTE
  let y = 120
  const drawField = (label, value, yPos) => {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#888'
    ctx.font = '12px Arial'
    ctx.fillText(label, 50, yPos)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px Arial'
    ctx.fillText(value, 175, yPos)
  }

  drawField('Cliente:', nombreCliente, y)
  if (celularCliente) { y += 24; drawField('Celular:', celularCliente, y) }
  if (vendedor) { y += 24; drawField('Vendedor:', vendedor, y) }
  y += 24; drawField('Fecha:', fechaStr, y)
  y += 24; drawField('Hora:', horaStr, y)

  // SEPARADOR
  y += 22
  ctx.fillStyle = '#D4AF3750'
  ctx.fillRect(40, y, W - 80, 1)
  y += 24

  // TITULO NUMEROS
  ctx.textAlign = 'center'
  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 15px Arial'
  ctx.fillText('— TUS NÚMEROS —', W / 2, y)
  y += 32

  // GRID 3 columnas
  const colW = (W - 80) / 3
  const rowH = 64
  numeros.forEach((num, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const cx = 40 + col * colW + colW / 2
    const cy = y + row * rowH

    const bW = colW - 16
    const bH = 50
    const bX = cx - bW / 2
    const bY = cy - 36

    ctx.fillStyle = '#1a1400'
    ctx.beginPath()
    ctx.roundRect(bX, bY, bW, bH, 10)
    ctx.fill()

    ctx.strokeStyle = '#D4AF3770'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(bX, bY, bW, bH, 10)
    ctx.stroke()

    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 26px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(pad(num), cx, cy + 2)
  })

  y += Math.ceil(numeros.length / 3) * rowH + 14

  // SEPARADOR
  ctx.fillStyle = '#D4AF3750'
  ctx.fillRect(40, y, W - 80, 1)
  y += 22

  // PREMIOS
  ctx.textAlign = 'center'
  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 15px Arial'
  ctx.fillText('— PREMIOS —', W / 2, y)
  y += 24

  const premios = [
    { emoji: '🥇', desc: '4 cifras exactas', valor: '$2.000.000', color: '#FFD700' },
    { emoji: '🥈', desc: '3 primeras cifras', valor: '$50.000', color: '#C0C0C0' },
    { emoji: '🥉', desc: '3 últimas cifras', valor: '$50.000', color: '#CD7F32' },
    { emoji: '🎁', desc: '2 últimas cifras', valor: 'Boleta gratis', color: '#22c55e' },
  ]

  premios.forEach(p => {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#bbb'
    ctx.font = '13px Arial'
    ctx.fillText(`${p.emoji}  ${p.desc}`, 50, y)
    ctx.textAlign = 'right'
    ctx.fillStyle = p.color
    ctx.font = 'bold 13px Arial'
    ctx.fillText(p.valor, W - 50, y)
    y += 24
  })

  // SEPARADOR
  y += 10
  ctx.fillStyle = '#D4AF3750'
  ctx.fillRect(40, y, W - 80, 1)
  y += 26

  // FOOTER
  ctx.textAlign = 'center'
  ctx.fillStyle = '#FFD700'
  ctx.font = 'bold 20px Arial'
  ctx.fillText('✨  ¡MUCHA SUERTE!  ✨', W / 2, y)
  y += 26

  ctx.fillStyle = '#555'
  ctx.font = '12px Arial'
  ctx.fillText('Guarda este comprobante · Válido solo para este sorteo', W / 2, y)
  y += 20

  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 13px Arial'
  ctx.fillText('ganaganaogana.com', W / 2, y)

  // BORDE INFERIOR DORADO
  ctx.fillStyle = '#D4AF37'
  ctx.fillRect(0, H - 5, W, 5)

  // DESCARGAR
  const link = document.createElement('a')
  link.download = `boleta-${String(boleta.id).padStart(3,'0')}-ganagana.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
