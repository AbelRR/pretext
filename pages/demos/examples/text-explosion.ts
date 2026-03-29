import { prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const dpr = window.devicePixelRatio || 1
let W = window.innerWidth, H = window.innerHeight

function resize() {
  W = window.innerWidth; H = window.innerHeight
  canvas.width = W * dpr; canvas.height = H * dpr
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
window.addEventListener('resize', resize)

const paragraphs = [
  "The web has a dirty secret: it can't measure text without rendering it. Every call to getBoundingClientRect forces a synchronous layout reflow of the entire document.",
  "Pretext changes everything. Canvas measurement, cached widths, pure arithmetic. Layout in microseconds, not milliseconds. No DOM, no reflow, no jank.",
  "AGI 春天到了 🚀 The future of text layout is here. Arabic, CJK, Thai, emoji — all measured perfectly. بدأت الرحلة",
  "Shrinkwrap, balanced text, variable-width flow, height prediction. Things that were impossible on the web are now trivial arithmetic.",
]

const font = "18px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 26
const textWidth = 500

await document.fonts.ready

type LinePiece = {
  text: string; width: number
  homeX: number; homeY: number
  x: number; y: number; vx: number; vy: number
  rotation: number; vr: number; alpha: number
  color: string; exploded: boolean
}

const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8', '#ff922b', '#20c997', '#38bdf8']
let pieces: LinePiece[] = []
let currentParagraph = 0

function layoutParagraph(idx: number) {
  const text = paragraphs[idx % paragraphs.length]
  const prepared = prepareWithSegments(text, font)
  const result = layoutWithLines(prepared, textWidth, lineHeight)

  const startX = (W - textWidth) / 2
  const startY = (H - result.height) / 2

  pieces = result.lines.map((line, i) => ({
    text: line.text,
    width: line.width,
    homeX: startX,
    homeY: startY + i * lineHeight,
    x: startX,
    y: startY + i * lineHeight,
    vx: 0, vy: 0,
    rotation: 0, vr: 0,
    alpha: 1,
    color: colors[i % colors.length],
    exploded: false,
  }))
}

layoutParagraph(0)

canvas.addEventListener('click', e => {
  const mx = e.clientX, my = e.clientY

  if (pieces.every(p => p.exploded)) {
    // Reassembling — next paragraph
    currentParagraph++
    layoutParagraph(currentParagraph)
    return
  }

  // Explode!
  for (const p of pieces) {
    const dx = p.x + p.width / 2 - mx
    const dy = p.y + lineHeight / 2 - my
    const dist = Math.sqrt(dx * dx + dy * dy) + 1
    const force = Math.min(30, 800 / dist)
    p.vx = (dx / dist) * force + (Math.random() - 0.5) * 5
    p.vy = (dy / dist) * force + (Math.random() - 0.5) * 5
    p.vr = (Math.random() - 0.5) * 15
    p.exploded = true
  }

  // After explosion, start reassembly after a delay
  setTimeout(() => {
    for (const p of pieces) {
      p.exploded = false
    }
  }, 1500)
})

function update() {
  for (const p of pieces) {
    if (p.exploded) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.3 // gravity
      p.vx *= 0.99
      p.rotation += p.vr
      p.vr *= 0.98
      p.alpha = Math.max(0.3, p.alpha - 0.005)
    } else {
      // Spring back to home
      const dx = p.homeX - p.x
      const dy = p.homeY - p.y
      p.vx += dx * 0.08
      p.vy += dy * 0.08
      p.vx *= 0.85
      p.vy *= 0.85
      p.x += p.vx
      p.y += p.vy
      p.rotation *= 0.9
      p.vr *= 0.9
      p.alpha = Math.min(1, p.alpha + 0.02)
    }
  }
}

function draw() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  // Subtle crosshair at center
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H)
  ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2)
  ctx.stroke()

  for (const p of pieces) {
    ctx.save()
    ctx.translate(p.x + p.width / 2, p.y + lineHeight / 2)
    ctx.rotate(p.rotation * Math.PI / 180)
    ctx.globalAlpha = p.alpha
    ctx.font = font

    // Glow when exploded
    if (p.exploded) {
      ctx.shadowColor = p.color
      ctx.shadowBlur = 15
    }

    ctx.fillStyle = p.exploded ? p.color : '#e2e8f0'
    ctx.fillText(p.text, -p.width / 2, lineHeight * 0.65)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // Instruction
  ctx.globalAlpha = 0.2
  ctx.fillStyle = '#fff'
  ctx.font = "13px 'Helvetica Neue'"
  ctx.textAlign = 'center'
  ctx.fillText('click anywhere to explode', W / 2, H - 30)
  ctx.textAlign = 'left'
  ctx.globalAlpha = 1
}

function frame() {
  update()
  draw()
  requestAnimationFrame(frame)
}

frame()
