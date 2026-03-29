import { prepare, layout } from '../../../src/layout.ts'

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

const texts = [
  "Hello world",
  "The quick brown fox jumps over the lazy dog",
  "AGI 春天到了 🚀 بدأت الرحلة",
  "A longer piece of text that wraps differently at different widths, showing how layout changes",
  "Pretext measures text height without DOM. Pure arithmetic. 0.0002ms per call.",
  "The implications stretch from chat apps to e-readers, from game UIs to data visualization.",
  "When you can predict exactly how text wraps at any width in microseconds, design space explodes.",
  "Short",
  "CJK: 天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏",
  "Mixed: Hello 你好 مرحبا こんにちは 안녕하세요 สวัสดี 🌍✨",
]

const font = "14px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 20
const minWidth = 50
const maxWidth = 800
const step = 2

await document.fonts.ready

const prepared = texts.map(t => prepare(t, font))

function render() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  const widths = Math.floor((maxWidth - minWidth) / step)
  const cellW = Math.max(1, (W - 120) / widths)
  const cellH = Math.max(20, (H - 100) / texts.length)
  const startX = 100
  const startY = 50

  // Title
  ctx.font = "bold 16px 'Helvetica Neue'"
  ctx.fillStyle = '#e2e8f0'
  ctx.fillText('Line Count Heatmap: width × text', startX, 30)

  // Compute all layouts and find max line count
  let maxLines = 1
  const grid: number[][] = []
  const start = performance.now()

  for (let t = 0; t < texts.length; t++) {
    grid[t] = []
    for (let w = 0; w < widths; w++) {
      const width = minWidth + w * step
      const result = layout(prepared[t], width, lineHeight)
      grid[t][w] = result.lineCount
      if (result.lineCount > maxLines) maxLines = result.lineCount
    }
  }

  const elapsed = performance.now() - start
  const totalCalls = texts.length * widths

  // Draw heatmap
  for (let t = 0; t < texts.length; t++) {
    for (let w = 0; w < widths; w++) {
      const lines = grid[t][w]
      const intensity = lines / maxLines

      // Color: blue (few lines) → red (many lines)
      const r = Math.round(intensity * 255)
      const g = Math.round((1 - intensity) * 40)
      const b = Math.round((1 - intensity) * 255)
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      ctx.fillRect(startX + w * cellW, startY + t * cellH, Math.ceil(cellW), cellH - 1)
    }

    // Text label
    ctx.font = "11px 'Helvetica Neue'"
    ctx.fillStyle = '#64748b'
    ctx.textAlign = 'right'
    const label = texts[t].length > 12 ? texts[t].slice(0, 12) + '…' : texts[t]
    ctx.fillText(label, startX - 8, startY + t * cellH + cellH / 2 + 4)
    ctx.textAlign = 'left'
  }

  // X axis labels
  ctx.font = "10px 'Helvetica Neue'"
  ctx.fillStyle = '#475569'
  for (let w = 0; w <= widths; w += Math.floor(widths / 8)) {
    const px = minWidth + w * step
    ctx.fillText(px + 'px', startX + w * cellW, startY + texts.length * cellH + 14)
  }

  // Stats
  ctx.font = "13px 'Helvetica Neue'"
  ctx.fillStyle = '#4ade80'
  ctx.fillText(`${totalCalls.toLocaleString()} layout() calls in ${elapsed.toFixed(1)}ms (${(elapsed / totalCalls * 1000).toFixed(1)}μs each)`, startX, startY + texts.length * cellH + 40)

  // Legend
  const legendX = startX, legendY = startY + texts.length * cellH + 60
  ctx.fillStyle = '#64748b'
  ctx.font = "11px 'Helvetica Neue'"
  ctx.fillText('1 line', legendX, legendY + 12)
  for (let i = 0; i < 100; i++) {
    const t = i / 100
    const r = Math.round(t * 255)
    const g = Math.round((1 - t) * 40)
    const b = Math.round((1 - t) * 255)
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    ctx.fillRect(legendX + 50 + i * 2, legendY, 2, 14)
  }
  ctx.fillStyle = '#64748b'
  ctx.fillText(`${maxLines} lines`, legendX + 260, legendY + 12)
}

render()
window.addEventListener('resize', () => { resize(); render() })
