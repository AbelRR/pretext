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

const text = `In the beginning was the word, and the word needed to be measured. For decades, the web's answer was to render text into the DOM and ask the browser how tall it was. This worked, but at a terrible cost: every measurement forced a synchronous reflow — the browser had to lay out the entire document just to answer a simple question about one paragraph. Pretext changes this. By measuring text segments on canvas and caching the results, it reduces layout to pure arithmetic. The prepare step runs once. After that, computing height at any width costs about 0.0002 milliseconds. That's fast enough to run hundreds of times per frame, smooth enough for animation, cheap enough to make text layout feel like it was never the bottleneck it always was.`

const font = "18px 'Georgia', 'Times New Roman', serif"
const lineHeight = 28

await document.fonts.ready

const prepared = prepareWithSegments(text, font)
let time = 0
let layoutCount = 0
let lastSecond = performance.now()
let fps = 0

function frame() {
  time += 0.015

  // Breathing: oscillate width between 200 and 700
  const minW = 200, maxW = Math.min(700, W - 80)
  const breathe = (Math.sin(time * 0.8) + 1) / 2
  const currentWidth = minW + breathe * (maxW - minW)

  const result = layoutWithLines(prepared, currentWidth, lineHeight)
  layoutCount++

  const now = performance.now()
  if (now - lastSecond > 1000) {
    fps = layoutCount
    layoutCount = 0
    lastSecond = now
  }

  // Draw
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  const startX = (W - currentWidth) / 2
  const startY = (H - result.height) / 2

  // Width indicator
  ctx.strokeStyle = 'rgba(124, 138, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(startX, startY - 10, currentWidth, result.height + 20)
  ctx.setLineDash([])

  // Width label
  ctx.font = "12px 'Helvetica Neue', sans-serif"
  ctx.fillStyle = 'rgba(124, 138, 255, 0.4)'
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.round(currentWidth)}px — ${result.lineCount} lines — ${fps} layouts/sec`, W / 2, startY - 20)
  ctx.textAlign = 'left'

  // Text with color gradient
  ctx.font = font
  for (let i = 0; i < result.lines.length; i++) {
    const t = i / result.lines.length
    const r = Math.round(120 + t * 80)
    const g = Math.round(140 + t * 60)
    const b = Math.round(200 + t * 55)
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    ctx.globalAlpha = 0.8 + Math.sin(time * 2 + i * 0.3) * 0.2
    ctx.fillText(result.lines[i].text, startX, startY + i * lineHeight + 20)
  }
  ctx.globalAlpha = 1

  requestAnimationFrame(frame)
}

frame()
