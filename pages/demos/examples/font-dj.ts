import { prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const sizeSlider = document.getElementById('size-slider') as HTMLInputElement
const sizeLabel = document.getElementById('size-label')!
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

const text = `The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! Sphinx of black quartz, judge my vow. Two driven jocks help fax my big quiz. The five boxing wizards jump quickly. AGI 春天到了 🚀 بدأت الرحلة`

let currentFont = 'Georgia'
let fontSize = 20

await document.fonts.ready

function render() {
  const font = `${fontSize}px '${currentFont}', serif`
  const lineHeight = Math.round(fontSize * 1.5)
  const maxWidth = Math.min(600, W - 80)

  const prepared = prepareWithSegments(text, font)
  const result = layoutWithLines(prepared, maxWidth, lineHeight)

  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  const startX = (W - maxWidth) / 2
  const startY = (H - result.height) / 2

  // Font name display
  ctx.font = "bold 48px 'Helvetica Neue', sans-serif"
  ctx.fillStyle = 'rgba(124, 138, 255, 0.08)'
  ctx.textAlign = 'center'
  ctx.fillText(currentFont, W / 2, startY - 30)
  ctx.textAlign = 'left'

  // Width bounds
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  ctx.strokeRect(startX, startY - 5, maxWidth, result.height + 10)

  // Stats
  ctx.font = "11px 'Helvetica Neue', sans-serif"
  ctx.fillStyle = 'rgba(124, 138, 255, 0.4)'
  ctx.fillText(`${result.lineCount} lines · ${result.height}px height · ${fontSize}px ${currentFont}`, startX, startY + result.height + 24)

  // Render lines
  ctx.font = font
  const colors = ['#e2e8f0', '#cbd5e1', '#94a3b8']
  for (let i = 0; i < result.lines.length; i++) {
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillText(result.lines[i].text, startX, startY + i * lineHeight + fontSize * 0.85)
  }
}

// Font buttons
document.querySelectorAll('.font-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentFont = (btn as HTMLElement).dataset.font!
    render()
  })
})

sizeSlider.addEventListener('input', () => {
  fontSize = parseInt(sizeSlider.value)
  sizeLabel.textContent = fontSize + 'px'
  render()
})

render()
