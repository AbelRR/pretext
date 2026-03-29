import { prepareWithSegments, layoutWithLines, layout } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const dpr = window.devicePixelRatio || 1
let W = window.innerWidth, H = window.innerHeight
let mouseX = W / 2

function resize() {
  W = window.innerWidth; H = window.innerHeight
  canvas.width = W * dpr; canvas.height = H * dpr
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
window.addEventListener('resize', resize)
canvas.addEventListener('mousemove', e => { mouseX = e.clientX })

const samples = [
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
  "🚀🎉✨💻⚡🌍🔥🎯🎨🎭🎪🎡🎢🎠🎰🎲🎮🕹️🎯🎳🎹🎸🎺🎷",
  "天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏闰余成岁律吕调阳",
  "في البدء كانت الكلمة والكلمة كانت عند الله وفي نهاية المطاف كل شيء يعود",
  "AGI 春天到了 🚀 The journey begins بدأت الرحلة 한국어 テスト ✨ Mixed scripts!",
]

let currentIdx = 0
const font = "24px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 36

await document.fonts.ready

document.querySelectorAll('.text-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.text-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentIdx = parseInt((btn as HTMLElement).dataset.idx!)
  })
})

function draw() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  const text = samples[currentIdx]
  const maxWidth = W - 80
  const prepared = prepareWithSegments(text, font)

  // Full width layout
  const fullResult = layoutWithLines(prepared, maxWidth, lineHeight)
  const startX = 40
  const startY = (H - fullResult.height) / 2

  // Draw text
  ctx.font = font
  ctx.fillStyle = '#e2e8f0'
  for (let i = 0; i < fullResult.lines.length; i++) {
    ctx.fillText(fullResult.lines[i].text, startX, startY + i * lineHeight + 28)
  }

  // Ruler at mouse position
  const rulerX = mouseX
  const measuredWidth = Math.max(10, rulerX - startX)

  // Measure at ruler width
  const rulerResult = layout(prepared as any, measuredWidth, lineHeight)
  const rulerLines = layoutWithLines(prepared, measuredWidth, lineHeight)

  // Ruler line
  ctx.strokeStyle = '#ff6b6b'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(rulerX, 60)
  ctx.lineTo(rulerX, H - 60)
  ctx.stroke()

  // Left boundary
  ctx.strokeStyle = 'rgba(255,107,107,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(startX, 60)
  ctx.lineTo(startX, H - 60)
  ctx.stroke()

  // Width measurement
  ctx.fillStyle = '#ff6b6b'
  ctx.font = "bold 14px 'Helvetica Neue', sans-serif"
  ctx.textAlign = 'center'
  ctx.fillText(`${measuredWidth.toFixed(1)}px`, startX + measuredWidth / 2, startY - 30)

  // Arrow
  ctx.strokeStyle = '#ff6b6b'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(startX, startY - 26)
  ctx.lineTo(rulerX, startY - 26)
  ctx.stroke()

  // Stats panel
  const statsX = Math.min(rulerX + 20, W - 200)
  const statsY = startY + fullResult.height + 40
  ctx.font = "13px 'Helvetica Neue', sans-serif"
  ctx.textAlign = 'left'
  ctx.fillStyle = '#7c8aff'
  ctx.fillText(`Width: ${measuredWidth.toFixed(1)}px`, statsX, statsY)
  ctx.fillText(`Lines: ${rulerResult.lineCount}`, statsX, statsY + 20)
  ctx.fillText(`Height: ${rulerResult.height}px`, statsX, statsY + 40)
  ctx.fillStyle = '#475569'
  ctx.fillText(`(pretext computed in ~0.0002ms)`, statsX, statsY + 60)

  // Show rewrapped text faintly
  ctx.font = font
  ctx.fillStyle = 'rgba(124, 138, 255, 0.2)'
  for (let i = 0; i < rulerLines.lines.length; i++) {
    const lineY = startY + i * lineHeight + 28
    // Clip to ruler width
    ctx.save()
    ctx.beginPath()
    ctx.rect(startX, lineY - lineHeight, measuredWidth, lineHeight + 5)
    ctx.clip()
    ctx.fillText(rulerLines.lines[i].text, startX, lineY)
    ctx.restore()
  }

  requestAnimationFrame(draw)
}

draw()
