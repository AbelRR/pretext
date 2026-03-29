import { prepare, layout, prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const scoreEl = document.getElementById('score')!
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

const bumperTexts = [
  "DOM reflow", "layout()", "prepare()", "0.0002ms",
  "shrinkwrap", "CJK 春天", "emoji 🚀", "canvas",
  "pure math", "no jank", "resize", "fast",
]

const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8', '#ff922b', '#20c997', '#38bdf8']
const font = "bold 12px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 16

await document.fonts.ready

type Bumper = {
  x: number; y: number; w: number; h: number
  text: string; color: string; flash: number
  prepared: ReturnType<typeof prepareWithSegments>
  currentWidth: number
}

const bumpers: Bumper[] = bumperTexts.map((text, i) => {
  const w = 100 + Math.random() * 60
  const prepared = prepareWithSegments(text, font)
  const result = layout(prepared as any, w - 16, lineHeight)
  const h = result.height + 16

  return {
    x: 60 + (i % 4) * (W - 120) / 4 + Math.random() * 30,
    y: 80 + Math.floor(i / 4) * (H - 160) / 3 + Math.random() * 40,
    w, h, text, color: colors[i % colors.length], flash: 0,
    prepared, currentWidth: w,
  }
})

// Ball
let ball = { x: W / 2, y: H - 60, vx: 0, vy: 0, r: 8, active: false }
let score = 0

canvas.addEventListener('click', e => {
  if (!ball.active) {
    ball.x = e.clientX
    ball.y = H - 60
    ball.vx = (Math.random() - 0.5) * 6
    ball.vy = -12
    ball.active = true
  }
})

function update() {
  if (!ball.active) return

  ball.vy += 0.15 // gravity
  ball.x += ball.vx
  ball.y += ball.vy

  // Wall bounce
  if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * 0.8 }
  if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx) * 0.8 }
  if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy) * 0.8 }

  // Floor — reset
  if (ball.y > H + 50) {
    ball.active = false
  }

  // Bumper collision
  for (const b of bumpers) {
    b.flash *= 0.95

    const cx = Math.max(b.x, Math.min(ball.x, b.x + b.w))
    const cy = Math.max(b.y, Math.min(ball.y, b.y + b.h))
    const dx = ball.x - cx
    const dy = ball.y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < ball.r) {
      // Bounce
      const nx = dx / (dist || 1)
      const ny = dy / (dist || 1)
      const dot = ball.vx * nx + ball.vy * ny
      ball.vx -= 2 * dot * nx
      ball.vy -= 2 * dot * ny
      ball.vx *= 1.1
      ball.vy *= 1.1

      // Push out
      ball.x = cx + nx * (ball.r + 1)
      ball.y = cy + ny * (ball.r + 1)

      // Score + flash
      score += 10
      scoreEl.textContent = String(score)
      b.flash = 1

      // Reflow bumper to new width!
      b.currentWidth = 80 + Math.random() * 100
      const result = layout(b.prepared as any, b.currentWidth - 16, lineHeight)
      b.w = b.currentWidth
      b.h = result.height + 16
    }
  }
}

function draw() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  // Bumpers
  for (const b of bumpers) {
    ctx.fillStyle = b.color
    ctx.globalAlpha = 0.1 + b.flash * 0.3
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, b.w, b.h, 6)
    ctx.fill()

    ctx.strokeStyle = b.color
    ctx.globalAlpha = 0.5 + b.flash * 0.5
    ctx.lineWidth = 1 + b.flash * 2
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, b.w, b.h, 6)
    ctx.stroke()

    if (b.flash > 0.1) {
      ctx.shadowColor = b.color
      ctx.shadowBlur = 20 * b.flash
    }

    ctx.font = font
    ctx.fillStyle = b.color
    ctx.globalAlpha = 0.8
    ctx.fillText(b.text, b.x + 8, b.y + b.h / 2 + 4, b.w - 16)
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }

  // Ball
  if (ball.active) {
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 15
    ctx.fill()
    ctx.shadowBlur = 0
  } else {
    ctx.font = "16px 'Helvetica Neue'"
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.textAlign = 'center'
    ctx.fillText('Click to launch ball', W / 2, H - 40)
    ctx.textAlign = 'left'
  }
}

function frame() {
  update()
  draw()
  requestAnimationFrame(frame)
}

frame()
