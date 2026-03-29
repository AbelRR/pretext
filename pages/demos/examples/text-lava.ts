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

const blobTexts = [
  "The web can't measure text without rendering it",
  "Pure arithmetic layout in microseconds",
  "AGI 春天到了 🚀 The journey begins",
  "Shrinkwrap finds the tightest container",
  "Every language every script every emoji",
  "No DOM no reflow no jank",
  "0.0002ms per text block",
  "Canvas SVG WebGL — render anywhere",
]

const blobColors = ['#ff6b6b', '#cc5de8', '#4d96ff', '#20c997', '#ff922b', '#6bcb77', '#f472b6', '#a78bfa']
const font = "14px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 20

await document.fonts.ready

const prepared = blobTexts.map(t => prepareWithSegments(t, font))

type Blob = {
  x: number; y: number; baseY: number
  vy: number; phase: number; speed: number
  widthPhase: number; color: string; idx: number
}

const blobs: Blob[] = blobTexts.map((_, i) => ({
  x: 80 + Math.random() * (W - 300),
  y: Math.random() * H,
  baseY: Math.random() * H,
  vy: (Math.random() - 0.5) * 0.5,
  phase: Math.random() * Math.PI * 2,
  speed: 0.3 + Math.random() * 0.7,
  widthPhase: Math.random() * Math.PI * 2,
  color: blobColors[i],
  idx: i,
}))

let time = 0

function update() {
  time += 0.01
  for (const b of blobs) {
    b.y += Math.sin(time * b.speed + b.phase) * 0.8
    b.x += Math.cos(time * b.speed * 0.7 + b.phase) * 0.3

    // Keep in bounds
    if (b.y < 50) b.y = 50
    if (b.y > H - 100) b.y = H - 100
    if (b.x < 50) b.x = 50
    if (b.x > W - 250) b.x = W - 250
  }
}

function draw() {
  ctx.fillStyle = 'rgba(10, 5, 24, 0.1)'
  ctx.fillRect(0, 0, W, H)

  for (const b of blobs) {
    // Pulsing width
    const baseWidth = 180
    const widthVar = 60
    const blobWidth = baseWidth + Math.sin(time * 1.5 + b.widthPhase) * widthVar

    const result = layoutWithLines(prepared[b.idx], blobWidth, lineHeight)
    const blobHeight = result.height + 24

    // Glow background
    const gradient = ctx.createRadialGradient(
      b.x + blobWidth / 2, b.y + blobHeight / 2, 0,
      b.x + blobWidth / 2, b.y + blobHeight / 2, Math.max(blobWidth, blobHeight)
    )
    gradient.addColorStop(0, b.color + '30')
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(b.x + blobWidth / 2, b.y + blobHeight / 2, blobWidth * 0.7, blobHeight * 0.7, 0, 0, Math.PI * 2)
    ctx.fill()

    // Text
    ctx.font = font
    ctx.fillStyle = b.color
    ctx.globalAlpha = 0.8
    for (let i = 0; i < result.lines.length; i++) {
      ctx.fillText(result.lines[i].text, b.x + 12, b.y + 12 + i * lineHeight + 14)
    }
    ctx.globalAlpha = 1
  }
}

function frame() {
  update()
  draw()
  requestAnimationFrame(frame)
}

frame()
