import { prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const spinBtn = document.getElementById('spin-btn')!
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

const fontFamilies = [
  'Georgia', 'Times New Roman', 'Courier New', 'Arial',
  'Helvetica Neue', 'Impact', 'Trebuchet MS', 'Verdana',
  'Palatino', 'Garamond',
]

const text = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!"
const fontSize = 24
const lineHeight = 36
const maxWidth = Math.min(550, W - 80)
const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8', '#ff922b', '#20c997', '#38bdf8']

await document.fonts.ready

let currentFontIdx = 0
let spinning = false
let spinSpeed = 0
let spinAngle = 0

spinBtn.addEventListener('click', () => {
  if (spinning) return
  spinning = true
  spinSpeed = 15 + Math.random() * 10
})

function getCurrentFont(): string {
  return fontFamilies[currentFontIdx % fontFamilies.length]
}

function draw() {
  if (spinning) {
    spinAngle += spinSpeed
    spinSpeed *= 0.97
    currentFontIdx = Math.floor(spinAngle / 36) % fontFamilies.length
    if (spinSpeed < 0.5) {
      spinning = false
      spinSpeed = 0
    }
  }

  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  const fontFamily = getCurrentFont()
  const font = `${fontSize}px '${fontFamily}'`

  // Roulette wheel at top
  const wheelY = 80
  const wheelW = 120
  ctx.save()
  ctx.translate(W / 2, wheelY)

  for (let i = -3; i <= 3; i++) {
    const idx = (currentFontIdx + i + fontFamilies.length) % fontFamilies.length
    const isCenter = i === 0
    ctx.font = `${isCenter ? 'bold ' : ''}16px sans-serif`
    ctx.fillStyle = isCenter ? colors[idx % colors.length] : 'rgba(255,255,255,0.2)'
    ctx.textAlign = 'center'
    ctx.fillText(fontFamilies[idx], 0, i * 28)
  }

  // Selection indicator
  ctx.strokeStyle = '#7c8aff'
  ctx.lineWidth = 2
  ctx.strokeRect(-wheelW / 2, -14, wheelW, 28)

  ctx.restore()

  // Render text with current font
  const prepared = prepareWithSegments(text, font)
  const result = layoutWithLines(prepared, maxWidth, lineHeight)
  const startX = (W - maxWidth) / 2
  const startY = 180

  // Font name display
  ctx.font = "bold 14px sans-serif"
  ctx.fillStyle = colors[currentFontIdx % colors.length]
  ctx.textAlign = 'center'
  ctx.fillText(`${fontFamily} · ${result.lineCount} lines · ${result.height}px`, W / 2, startY - 20)
  ctx.textAlign = 'left'

  ctx.font = font
  const color = colors[currentFontIdx % colors.length]
  for (let i = 0; i < result.lines.length; i++) {
    ctx.fillStyle = color
    ctx.globalAlpha = spinning ? 0.5 + Math.random() * 0.5 : 0.9
    ctx.fillText(result.lines[i].text, startX, startY + i * lineHeight + fontSize * 0.85)
  }
  ctx.globalAlpha = 1

  requestAnimationFrame(draw)
}

draw()
