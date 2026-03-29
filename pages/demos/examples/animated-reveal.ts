import { prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const replayBtn = document.getElementById('replay-btn')!
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

const quotes = [
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
  { text: "The web has a dirty secret: it can't measure text without rendering it.", author: "Pretext README" },
  { text: "Layout is pure arithmetic. No DOM, no reflow, no jank. Just math.", author: "0.0002ms" },
]

const titleFont = "bold 28px 'Georgia', serif"
const authorFont = "italic 16px 'Georgia', serif"
const lineHeight = 40
const maxWidth = Math.min(600, W - 80)

await document.fonts.ready

let quoteIdx = 0
let startTime = 0
let lines: { text: string; width: number }[] = []
let authorText = ''

function setupQuote() {
  const q = quotes[quoteIdx % quotes.length]
  const prepared = prepareWithSegments(q.text, titleFont)
  const result = layoutWithLines(prepared, maxWidth, lineHeight)
  lines = result.lines
  authorText = `— ${q.author}`
  startTime = performance.now()
}

setupQuote()

replayBtn.addEventListener('click', () => {
  quoteIdx++
  setupQuote()
})

function draw() {
  const elapsed = (performance.now() - startTime) / 1000

  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  const totalHeight = lines.length * lineHeight + 40
  const startX = (W - maxWidth) / 2
  const startY = (H - totalHeight) / 2

  // Reveal line by line
  const lineDelay = 0.4
  const charSpeed = 30 // chars per second

  ctx.font = titleFont

  for (let i = 0; i < lines.length; i++) {
    const lineStart = i * lineDelay
    const lineElapsed = elapsed - lineStart
    if (lineElapsed < 0) continue

    const text = lines[i].text
    const charsVisible = Math.min(text.length, Math.floor(lineElapsed * charSpeed))
    const visibleText = text.slice(0, charsVisible)

    const y = startY + i * lineHeight + 28

    // Fade in
    const alpha = Math.min(1, lineElapsed * 2)

    // Glow on new chars
    if (charsVisible < text.length) {
      ctx.shadowColor = '#7c8aff'
      ctx.shadowBlur = 20
    }

    ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`
    ctx.fillText(visibleText, startX, y)
    ctx.shadowBlur = 0

    // Cursor
    if (charsVisible < text.length && charsVisible > 0) {
      const cursorX = startX + ctx.measureText(visibleText).width
      ctx.fillStyle = '#7c8aff'
      ctx.globalAlpha = Math.sin(performance.now() / 100) > 0 ? 1 : 0
      ctx.fillRect(cursorX + 2, y - 22, 2, 28)
      ctx.globalAlpha = 1
    }
  }

  // Author line
  const authorDelay = lines.length * lineDelay + 0.5
  const authorElapsed = elapsed - authorDelay
  if (authorElapsed > 0) {
    ctx.font = authorFont
    ctx.fillStyle = `rgba(148, 163, 184, ${Math.min(1, authorElapsed)})`
    ctx.fillText(authorText, startX, startY + lines.length * lineHeight + 50)
  }

  requestAnimationFrame(draw)
}

draw()
