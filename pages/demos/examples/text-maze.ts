import { prepare, layout, prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

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

const snippets = [
  "DOM reflow", "getBoundingClientRect", "offsetHeight", "layout()", "prepare()",
  "canvas measureText", "Intl.Segmenter", "shrinkwrap", "0.0002ms", "CJK 日本語",
  "walkLineRanges", "layoutNextLine", "pure arithmetic", "no DOM reads",
  "emoji correction", "kinsoku rules", "bidi metadata", "segment cache",
  "grapheme splitting", "overflow-wrap", "line-break: auto", "word-break",
  "prepareWithSegments", "layoutWithLines", "clearCache()", "setLocale()",
]

const font = "11px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 14
const colors = ['#334155', '#1e3a5f', '#312e81', '#4c1d95', '#831843', '#7f1d1d']

await document.fonts.ready

type Wall = { x: number; y: number; w: number; h: number; text: string; color: string }

const walls: Wall[] = []
const cellSize = 50
const cols = Math.floor(W / cellSize)
const rows = Math.floor(H / cellSize)

// Generate maze-like walls
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    if (Math.random() > 0.45 && !(r === 1 && c === 1)) {
      const text = snippets[Math.floor(Math.random() * snippets.length)]
      const w = cellSize - 4
      const prepared = prepare(text, font)
      const result = layout(prepared, w - 8, lineHeight)
      walls.push({
        x: c * cellSize + 2, y: r * cellSize + 2,
        w, h: Math.max(cellSize - 4, result.height + 8),
        text, color: colors[Math.floor(Math.random() * colors.length)]
      })
    }
  }
}

// Player
let px = cellSize * 1.5, py = cellSize * 1.5
const playerSize = 12
const speed = 3

// Goal
const goalX = (cols - 2) * cellSize + cellSize / 2
const goalY = (rows - 2) * cellSize + cellSize / 2

const keys: Record<string, boolean> = {}
document.addEventListener('keydown', e => { keys[e.key] = true })
document.addEventListener('keyup', e => { keys[e.key] = false })

function collides(x: number, y: number): boolean {
  for (const w of walls) {
    if (x + playerSize > w.x && x - playerSize < w.x + w.w &&
        y + playerSize > w.y && y - playerSize < w.y + w.h) return true
  }
  return false
}

function update() {
  let nx = px, ny = py
  if (keys['ArrowLeft'] || keys['a']) nx -= speed
  if (keys['ArrowRight'] || keys['d']) nx += speed
  if (keys['ArrowUp'] || keys['w']) ny -= speed
  if (keys['ArrowDown'] || keys['s']) ny += speed

  if (!collides(nx, py)) px = nx
  if (!collides(px, ny)) py = ny

  px = Math.max(playerSize, Math.min(W - playerSize, px))
  py = Math.max(playerSize, Math.min(H - playerSize, py))
}

function draw() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  // Walls
  for (const w of walls) {
    ctx.fillStyle = w.color
    ctx.globalAlpha = 0.6
    ctx.fillRect(w.x, w.y, w.w, w.h)
    ctx.globalAlpha = 1

    ctx.font = font
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillText(w.text, w.x + 4, w.y + 12, w.w - 8)
  }

  // Goal
  ctx.beginPath()
  ctx.arc(goalX, goalY, 10, 0, Math.PI * 2)
  ctx.fillStyle = '#4ade80'
  ctx.fill()
  ctx.font = "bold 8px sans-serif"
  ctx.fillStyle = '#0a0a1a'
  ctx.textAlign = 'center'
  ctx.fillText('EXIT', goalX, goalY + 3)
  ctx.textAlign = 'left'

  // Player
  ctx.beginPath()
  ctx.arc(px, py, playerSize, 0, Math.PI * 2)
  ctx.fillStyle = '#7c8aff'
  ctx.shadowColor = '#7c8aff'
  ctx.shadowBlur = 15
  ctx.fill()
  ctx.shadowBlur = 0

  // Win check
  if (Math.hypot(px - goalX, py - goalY) < 20) {
    ctx.font = "bold 32px 'Helvetica Neue'"
    ctx.fillStyle = '#4ade80'
    ctx.textAlign = 'center'
    ctx.fillText('You escaped the text maze!', W / 2, H / 2)
    ctx.textAlign = 'left'
  }
}

function frame() {
  update()
  draw()
  requestAnimationFrame(frame)
}

frame()
