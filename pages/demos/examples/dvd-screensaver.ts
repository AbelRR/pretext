import { prepareWithSegments, layoutWithLines, walkLineRanges } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const cornerCount = document.getElementById('corner-count')!

const dpr = window.devicePixelRatio || 1
let W = window.innerWidth
let H = window.innerHeight

function resize() {
  W = window.innerWidth
  H = window.innerHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
window.addEventListener('resize', resize)

// PG-style essay
const title = 'How to Measure Text'
const subtitle = 'March 2026'

const essay = `The web has a dirty secret: it can't measure text without rendering it. Every time you call getBoundingClientRect or read offsetHeight, the browser must lay out the entire document. This is called a "reflow," and it is one of the most expensive operations a browser performs.

For most of the web's history, this was an acceptable cost. Pages were simple. Text was static. But modern web applications are different. A chat app might display thousands of messages. A virtualized list needs to know the height of every item before it's rendered. A design tool needs to predict where text will wrap at any width, in any language, in real time.

The conventional approach is to guess. Virtual list libraries estimate item heights, then correct them after rendering. This causes layout shift — the content jumps as the browser discovers the estimates were wrong. Users notice. It feels broken.

What if you could know the exact height of a paragraph, in any font, at any width, without touching the DOM at all? What if text measurement took microseconds instead of milliseconds? What if it worked for Chinese, Arabic, Thai, and emoji, not just English?

This is what Pretext does. It uses the browser's own canvas measureText API to measure individual word segments, caches the results, then does pure arithmetic to compute line breaks and heights. The prepare step is a one-time cost. After that, layout is essentially free — about 0.0002ms per text block.

The implications are surprisingly broad. Chat bubbles can shrink-wrap to their content by binary-searching for the optimal width. Magazine-style layouts can flow text around obstacles, giving each line a different width. Virtualized lists can predict heights perfectly, eliminating layout shift entirely. Text can be rendered to canvas, SVG, or WebGL instead of the DOM.

Perhaps most interesting is what this enables for AI-generated UIs. When an AI builds a component, it currently has no way to verify that labels don't overflow buttons or that text fits within cards. With Pretext, these checks become trivial arithmetic — no browser needed.

The lesson, as usual, is that the right abstraction changes everything. Text measurement felt like an inherently DOM-bound problem until someone realized it wasn't.`

const titleFont = "bold 20px 'Georgia', 'Times New Roman', serif"
const subtitleFont = "14px 'Georgia', 'Times New Roman', serif"
const bodyFont = "15px/22px 'Georgia', 'Times New Roman', serif"
const bodyFontCanvas = "15px 'Georgia', 'Times New Roman', serif"
const lineHeight = 22
const essayWidth = 380
const padding = 28
const titleLineHeight = 28
const subtitleLineHeight = 20

await document.fonts.ready

const preparedTitle = prepareWithSegments(title, titleFont)
const preparedSubtitle = prepareWithSegments(subtitle, subtitleFont)
const preparedBody = prepareWithSegments(essay, bodyFontCanvas)

// Measure total block height
const titleResult = layoutWithLines(preparedTitle, essayWidth, titleLineHeight)
const subtitleResult = layoutWithLines(preparedSubtitle, essayWidth, subtitleLineHeight)
const bodyResult = layoutWithLines(preparedBody, essayWidth, lineHeight)

const blockWidth = essayWidth + padding * 2
const blockHeight = padding + titleResult.height + 8 + subtitleResult.height + 16 + bodyResult.height + padding

const colors = [
  '#e8e0d0', '#ffd4a3', '#a3d9ff', '#c4ffc4',
  '#ffa3a3', '#d4a3ff', '#a3ffea', '#ffe6a3',
  '#ffb3d9', '#b3e0ff', '#d4ffb3', '#ffc4b3',
]

let x = Math.random() * Math.max(1, W - blockWidth)
let y = Math.random() * Math.max(1, H - blockHeight)
let vx = 1.2
let vy = 0.8
let color = colors[0]
let corners = 0
let flashAlpha = 0

function pickNewColor(current: string): string {
  let next: string
  do { next = colors[Math.floor(Math.random() * colors.length)] } while (next === current)
  return next
}

function update() {
  x += vx
  y += vy

  let hitX = false, hitY = false

  if (x <= 0) { x = 0; vx = Math.abs(vx); hitX = true }
  else if (x + blockWidth >= W) { x = W - blockWidth; vx = -Math.abs(vx); hitX = true }

  if (y <= 0) { y = 0; vy = Math.abs(vy); hitY = true }
  else if (y + blockHeight >= H) { y = H - blockHeight; vy = -Math.abs(vy); hitY = true }

  if (hitX || hitY) color = pickNewColor(color)
  if (hitX && hitY) {
    corners++
    cornerCount.textContent = String(corners)
    flashAlpha = 1
  }
}

function draw() {
  ctx.fillStyle = '#111'
  ctx.fillRect(0, 0, W, H)

  if (flashAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.2})`
    ctx.fillRect(0, 0, W, H)
    flashAlpha *= 0.9
    if (flashAlpha < 0.01) flashAlpha = 0
  }

  // Essay background — PG style: warm, plain
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.beginPath()
  ctx.roundRect(x, y, blockWidth, blockHeight, 4)
  ctx.fill()

  const cx = x + padding
  let cy = y + padding

  // Title
  ctx.font = titleFont
  ctx.fillStyle = color
  for (const line of titleResult.lines) {
    ctx.fillText(line.text, cx, cy + 16)
    cy += titleLineHeight
  }
  cy += 8

  // Subtitle
  ctx.font = subtitleFont
  ctx.fillStyle = color
  ctx.globalAlpha = 0.5
  for (const line of subtitleResult.lines) {
    ctx.fillText(line.text, cx, cy + 12)
    cy += subtitleLineHeight
  }
  ctx.globalAlpha = 1
  cy += 16

  // Body
  ctx.font = bodyFontCanvas
  ctx.fillStyle = color
  ctx.globalAlpha = 0.85
  for (const line of bodyResult.lines) {
    ctx.fillText(line.text, cx, cy + 16)
    cy += lineHeight
  }
  ctx.globalAlpha = 1
}

function frame() {
  update()
  draw()
  requestAnimationFrame(frame)
}

frame()
