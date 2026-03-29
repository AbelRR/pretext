import { prepare, layout, prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const resetBtn = document.getElementById('reset-btn')!
const dpr = window.devicePixelRatio || 1
let W = window.innerWidth, H = window.innerHeight

function resize() {
  W = window.innerWidth; H = window.innerHeight
  canvas.width = W * dpr; canvas.height = H * dpr
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
window.addEventListener('resize', () => { resize(); initSlots() })

const texts = [
  "The quick brown fox jumps over the lazy dog.",
  "Pretext: pure arithmetic text layout. No DOM, no reflow.",
  "AGI 春天到了 🚀 Layout in microseconds.",
  "Every line break computed without touching the browser.",
  "Chat bubbles, virtualized lists, editorial layouts — all unlocked.",
  "0.0002ms per text. That's 500x faster than DOM measurement.",
  "CJK, Arabic, Thai, emoji — all languages measured perfectly.",
  "The right abstraction changes everything.",
  "Shrinkwrap: find the tightest container width with binary search.",
  "Variable-width flow: each line gets a different max width.",
  "Height prediction eliminates layout shift entirely.",
  "Canvas, SVG, WebGL — render text anywhere, not just DOM.",
]

const font = "14px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 20
const pad = 12
const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8', '#ff922b', '#20c997', '#38bdf8', '#f472b6', '#a78bfa', '#fb923c', '#34d399']

await document.fonts.ready

type Slot = {
  x: number; y: number; w: number; h: number; color: string
}

type Piece = {
  text: string; w: number; h: number; color: string
  x: number; y: number; targetX: number; targetY: number
  vx: number; vy: number; settled: boolean
  lines: { text: string; width: number }[]
}

let slots: Slot[] = []
let pieces: Piece[] = []
let settling = false

function initSlots() {
  const slotWidth = Math.min(280, (W - 60) / 3 - 20)
  const cols = Math.min(3, Math.floor((W - 40) / (slotWidth + 16)))
  const prepared = texts.map(t => prepareWithSegments(t, font))

  slots = []
  pieces = []

  texts.forEach((text, i) => {
    const textW = slotWidth - pad * 2
    const result = layoutWithLines(prepared[i], textW, lineHeight)
    const h = result.height + pad * 2

    const col = i % cols
    const row = Math.floor(i / cols)
    const sx = 30 + col * (slotWidth + 16)
    const sy = 30 + row * (h + 16)

    // Exact-fit slot
    slots.push({ x: sx, y: sy, w: slotWidth, h, color: colors[i % colors.length] })

    // Piece starts at random position
    pieces.push({
      text, w: slotWidth, h, color: colors[i % colors.length],
      x: Math.random() * (W - slotWidth),
      y: -h - Math.random() * H,
      targetX: sx, targetY: sy,
      vx: 0, vy: 0, settled: false,
      lines: result.lines,
    })
  })

  // Stagger the settling
  settling = true
  pieces.forEach((p, i) => {
    setTimeout(() => { p.settled = true }, 200 + i * 300)
  })
}

resetBtn.addEventListener('click', () => {
  // Scatter pieces
  for (const p of pieces) {
    p.x = Math.random() * (W - p.w)
    p.y = -p.h - Math.random() * H * 0.5
    p.settled = false
    p.vx = (Math.random() - 0.5) * 10
    p.vy = 0
  }
  pieces.forEach((p, i) => {
    setTimeout(() => { p.settled = true }, 500 + i * 300)
  })
})

function update() {
  for (const p of pieces) {
    if (p.settled) {
      // Spring to target
      const dx = p.targetX - p.x
      const dy = p.targetY - p.y
      p.vx += dx * 0.06
      p.vy += dy * 0.06
      p.vx *= 0.82
      p.vy *= 0.82
    } else {
      p.vy += 0.5 // gravity
    }
    p.x += p.vx
    p.y += p.vy
  }
}

function draw() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  // Draw slots (targets)
  for (const s of slots) {
    ctx.strokeStyle = s.color
    ctx.globalAlpha = 0.15
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.strokeRect(s.x, s.y, s.w, s.h)
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }

  // Draw pieces
  for (const p of pieces) {
    const dist = Math.sqrt((p.x - p.targetX) ** 2 + (p.y - p.targetY) ** 2)
    const isClose = dist < 3

    // Background
    ctx.fillStyle = p.color
    ctx.globalAlpha = isClose ? 0.15 : 0.1
    ctx.beginPath()
    ctx.roundRect(p.x, p.y, p.w, p.h, 6)
    ctx.fill()

    // Border
    ctx.strokeStyle = p.color
    ctx.globalAlpha = isClose ? 0.8 : 0.4
    ctx.lineWidth = isClose ? 2 : 1
    ctx.beginPath()
    ctx.roundRect(p.x, p.y, p.w, p.h, 6)
    ctx.stroke()

    // Checkmark when settled
    if (isClose) {
      ctx.fillStyle = p.color
      ctx.globalAlpha = 0.3
      ctx.font = "bold 16px sans-serif"
      ctx.fillText('✓', p.x + p.w - 22, p.y + 18)
    }

    // Text
    ctx.font = font
    ctx.fillStyle = '#e2e8f0'
    ctx.globalAlpha = isClose ? 0.9 : 0.5
    for (let i = 0; i < p.lines.length; i++) {
      ctx.fillText(p.lines[i].text, p.x + pad, p.y + pad + 14 + i * lineHeight)
    }

    ctx.globalAlpha = 1
  }
}

function frame() {
  update()
  draw()
  requestAnimationFrame(frame)
}

initSlots()
frame()
