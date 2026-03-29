import { prepareWithSegments, layoutNextLine } from '../../../src/layout.ts'

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
window.addEventListener('resize', () => { resize(); render() })

const poem = `The art of typography is the art of constraint. Every line must break somewhere, and where it breaks changes everything. A word at the end of a line carries different weight than a word at the beginning. The shape of text is not just decoration — it is meaning itself. When words fill a circle they suggest wholeness, completeness, the eternal return. When they trace a heart they pulse with emotion. A wave carries rhythm and motion. A diamond cuts sharp and precise. And a spiral draws the eye inward, toward the center, toward the secret that all text layout begins with measurement and ends with beauty. Pretext makes this possible in the browser for the first time: every line can have a different width, computed in microseconds, rendered anywhere. The text flows like water into whatever vessel you provide. This is concrete poetry powered by pure arithmetic — no DOM measurement, no layout reflow, just words finding their shape in the digital void.`

const font = "15px 'Georgia', 'Times New Roman', serif"
const lineHeight = 21
const colors = ['#a78bfa', '#818cf8', '#6366f1', '#7c3aed', '#8b5cf6']

await document.fonts.ready

const prepared = prepareWithSegments(poem, font)

type Shape = 'circle' | 'heart' | 'wave' | 'diamond' | 'spiral'
let currentShape: Shape = 'circle'

function getWidthForLine(shape: Shape, lineIndex: number, totalLines: number, maxWidth: number): number {
  const t = lineIndex / totalLines // 0 to 1

  switch (shape) {
    case 'circle': {
      const r = 0.5
      const y = t - 0.5
      if (Math.abs(y) >= r) return 20
      return Math.sqrt(r * r - y * y) * 2 * maxWidth
    }
    case 'heart': {
      const y = 1 - t * 2 // 1 to -1
      if (y > 0.6) {
        // Top lobes
        const w = Math.sqrt(1 - (y - 0.3) * (y - 0.3) * 4) * maxWidth * 0.9
        return Math.max(20, w)
      }
      // Bottom taper
      const w = (1 + y) * 0.5 * maxWidth
      return Math.max(20, w)
    }
    case 'wave': {
      const base = 0.5
      const amp = 0.3
      return (base + Math.sin(t * Math.PI * 4) * amp) * maxWidth
    }
    case 'diamond': {
      const mid = 0.5
      const dist = Math.abs(t - mid)
      return (1 - dist * 2) * maxWidth * 0.9
    }
    case 'spiral': {
      const angle = t * Math.PI * 3
      const r = 0.2 + t * 0.4
      return (0.3 + Math.abs(Math.sin(angle)) * r) * maxWidth
    }
  }
}

function getXOffset(shape: Shape, lineIndex: number, totalLines: number, lineWidth: number, maxWidth: number): number {
  // Center all shapes
  return (maxWidth - lineWidth) / 2
}

function render() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  const maxWidth = Math.min(500, W - 80)
  const estimatedLines = 35
  const totalHeight = estimatedLines * lineHeight
  const startY = (H - totalHeight) / 2

  // First pass: collect all lines
  const lines: { text: string; width: number; maxW: number }[] = []
  let cursor = { segmentIndex: 0, graphemeIndex: 0 }
  let lineIdx = 0

  while (true) {
    const w = Math.max(30, getWidthForLine(currentShape, lineIdx, estimatedLines, maxWidth))
    const line = layoutNextLine(prepared, cursor, w)
    if (line === null) break
    lines.push({ text: line.text, width: line.width, maxW: w })
    cursor = line.end
    lineIdx++
    if (lineIdx > 80) break
  }

  // Draw
  const actualStartY = (H - lines.length * lineHeight) / 2
  ctx.font = font

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const xOff = getXOffset(currentShape, i, lines.length, line.maxW, maxWidth)
    const x = (W - maxWidth) / 2 + xOff
    const y = actualStartY + i * lineHeight

    const colorIdx = i % colors.length
    ctx.fillStyle = colors[colorIdx]
    ctx.globalAlpha = 0.6 + (i / lines.length) * 0.4
    ctx.fillText(line.text, x, y + 15)
  }

  ctx.globalAlpha = 1
}

// Shape buttons
document.querySelectorAll('.shape-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentShape = (btn as HTMLElement).dataset.shape as Shape
    render()
  })
})

render()
