import { prepareWithSegments, layoutWithLines, walkLineRanges } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const dpr = window.devicePixelRatio || 1
let W = window.innerWidth, H = window.innerHeight
let mouseX = -1, mouseY = -1

function resize() {
  W = window.innerWidth; H = window.innerHeight
  canvas.width = W * dpr; canvas.height = H * dpr
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
window.addEventListener('resize', resize)
canvas.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY })
canvas.addEventListener('mouseleave', () => { mouseX = -1; mouseY = -1 })

const tooltips = [
  { label: 'Performance', tip: 'layout() runs in ~0.0002ms — pure arithmetic, no DOM reads.' },
  { label: 'i18n', tip: 'Supports CJK 春天, Arabic بدأت, Thai สวัสดี, emoji 🚀✨ — all measured correctly.' },
  { label: 'Shrinkwrap', tip: 'walkLineRanges() binary-searches for the tightest container width. Never existed on web before.' },
  { label: 'Accuracy', tip: '7680/7680 on Chrome, Safari, AND Firefox. Browser-specific epsilon tuning.' },
  { label: 'Variable Flow', tip: 'layoutNextLine() gives each line a different width. Magazine-style text flow around obstacles.' },
  { label: 'Virtual Lists', tip: 'Predict exact item heights before rendering. Zero layout shift, perfect scroll position.' },
  { label: 'Canvas Render', tip: 'layoutWithLines() returns line text + width. Render to canvas, SVG, or WebGL — not just DOM.' },
  { label: 'Caching', tip: 'Segment metrics cached as Map<font, Map<segment, metrics>>. Shared across all prepare() calls.' },
]

const font = "13px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const tipFont = "13px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 18
const tipMaxWidth = 260
const tipPad = 10
const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8', '#ff922b', '#20c997', '#38bdf8']

await document.fonts.ready

type Dot = {
  x: number; y: number; label: string; tip: string; color: string
  prepared: ReturnType<typeof prepareWithSegments>
  tipWidth: number; tipHeight: number
  tipLines: { text: string; width: number }[]
}

const dots: Dot[] = tooltips.map((t, i) => {
  const cols = 4
  const rows = 2
  const col = i % cols
  const row = Math.floor(i / cols)
  const spacingX = W / (cols + 1)
  const spacingY = H / (rows + 1)

  const prepared = prepareWithSegments(t.tip, tipFont)

  // Shrinkwrap the tooltip
  const textWidth = tipMaxWidth - tipPad * 2
  let baseLines = 0
  walkLineRanges(prepared, textWidth, () => { baseLines++ })
  let optWidth = textWidth
  if (baseLines > 1) {
    let lo = 1, hi = textWidth
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      let count = 0
      walkLineRanges(prepared, mid, () => { count++ })
      count <= baseLines ? hi = mid : lo = mid + 1
    }
    let widest = 0
    walkLineRanges(prepared, lo, line => { if (line.width > widest) widest = line.width })
    optWidth = Math.ceil(widest)
  } else {
    let w = 0
    walkLineRanges(prepared, textWidth, line => { w = line.width })
    optWidth = Math.ceil(w)
  }

  const result = layoutWithLines(prepared, optWidth, lineHeight)

  return {
    x: spacingX * (col + 1),
    y: spacingY * (row + 1),
    label: t.label, tip: t.tip, color: colors[i],
    prepared,
    tipWidth: optWidth + tipPad * 2,
    tipHeight: result.height + tipPad * 2,
    tipLines: result.lines,
  }
})

function draw() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  let hoveredDot: Dot | null = null

  for (const d of dots) {
    const dist = Math.hypot(mouseX - d.x, mouseY - d.y)
    const hovered = dist < 30

    if (hovered) hoveredDot = d

    // Dot
    ctx.beginPath()
    ctx.arc(d.x, d.y, hovered ? 14 : 10, 0, Math.PI * 2)
    ctx.fillStyle = d.color
    ctx.globalAlpha = hovered ? 0.3 : 0.15
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.beginPath()
    ctx.arc(d.x, d.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = d.color
    ctx.fill()

    // Label
    ctx.font = "bold 12px 'Helvetica Neue'"
    ctx.fillStyle = d.color
    ctx.textAlign = 'center'
    ctx.fillText(d.label, d.x, d.y + 28)
    ctx.textAlign = 'left'
  }

  // Tooltip
  if (hoveredDot) {
    const d = hoveredDot
    let tx = d.x + 20
    let ty = d.y - d.tipHeight - 10

    // Keep in bounds
    if (tx + d.tipWidth > W - 10) tx = d.x - d.tipWidth - 20
    if (ty < 10) ty = d.y + 30

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetY = 4

    // Background
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.roundRect(tx, ty, d.tipWidth, d.tipHeight, 8)
    ctx.fill()

    ctx.shadowBlur = 0

    // Border
    ctx.strokeStyle = d.color
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(tx, ty, d.tipWidth, d.tipHeight, 8)
    ctx.stroke()
    ctx.globalAlpha = 1

    // Text
    ctx.font = tipFont
    ctx.fillStyle = '#e2e8f0'
    for (let i = 0; i < d.tipLines.length; i++) {
      ctx.fillText(d.tipLines[i].text, tx + tipPad, ty + tipPad + i * lineHeight + 13)
    }

    // Size badge
    ctx.font = "10px 'Helvetica Neue'"
    ctx.fillStyle = d.color
    ctx.globalAlpha = 0.5
    ctx.fillText(`${d.tipWidth}×${d.tipHeight}px (pre-sized)`, tx + tipPad, ty + d.tipHeight + 14)
    ctx.globalAlpha = 1
  }

  requestAnimationFrame(draw)
}

draw()
