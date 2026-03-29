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
window.addEventListener('resize', resize)

const streamText = `Water flows downward, always finding the path of least resistance. Text, too, flows — from left to right, from line to line, wrapping at boundaries, breaking at words. In the digital world, text is a stream. It pours from servers through wires into browsers where it must find its shape. The width of a column determines how the stream flows. Narrow columns create many short lines, like a thin waterfall cascading over rocks. Wide columns create fewer lines, the text spreading like a river delta. Pretext makes this visible. With layoutNextLine(), you can feed text through columns of varying widths, watching it adapt and flow in real time. Each line is a discrete measurement — a quantum of typography — computed in microseconds without ever touching the DOM. The text falls like rain, gathers in pools, and overflows into the next column. It is both computation and poetry. 春天到了, the spring has come, and the text flows like meltwater from the mountains, carrying meaning in every line break, every wrap, every carefully measured width. بدأت الرحلة — the journey begins, in every language, in every script, in every direction the words might flow. 🌊`

const font = "14px 'Georgia', 'Times New Roman', serif"
const lineHeight = 20
const colors = ['#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9']

await document.fonts.ready

const prepared = prepareWithSegments(streamText, font)

type FallingLine = { text: string; x: number; y: number; width: number; speed: number; color: string; alpha: number }

const lines: FallingLine[] = []
let spawnY = -20
let colIndex = 0

const numCols = Math.max(3, Math.floor(W / 200))
const colGap = 16
const totalGap = colGap * (numCols - 1)
const colWidth = (W - 40 - totalGap) / numCols

function spawnColumn() {
  const col = colIndex % numCols
  const x = 20 + col * (colWidth + colGap)
  const w = colWidth + (Math.random() - 0.5) * 40 // slight variation

  let cursor = { segmentIndex: Math.floor(Math.random() * 10) % 20, graphemeIndex: 0 }
  // Just get a few lines
  let linesSpawned = 0
  let y = -Math.random() * 200

  while (linesSpawned < 8 + Math.random() * 12) {
    const line = layoutNextLine(prepared, cursor, Math.max(60, w))
    if (line === null) break
    lines.push({
      text: line.text, x, y,
      width: line.width,
      speed: 0.3 + Math.random() * 0.8,
      color: colors[linesSpawned % colors.length],
      alpha: 0.5 + Math.random() * 0.5,
    })
    cursor = line.end
    y += lineHeight
    linesSpawned++
  }

  colIndex++
}

// Initial spawn
for (let i = 0; i < numCols * 2; i++) spawnColumn()

let spawnTimer = 0

function update() {
  spawnTimer++
  if (spawnTimer % 120 === 0) spawnColumn()

  for (let i = lines.length - 1; i >= 0; i--) {
    lines[i].y += lines[i].speed
    if (lines[i].y > H + 50) {
      lines.splice(i, 1)
    }
  }
}

function draw() {
  ctx.fillStyle = 'rgba(10, 10, 26, 0.08)'
  ctx.fillRect(0, 0, W, H)

  ctx.font = font
  for (const line of lines) {
    ctx.fillStyle = line.color
    ctx.globalAlpha = line.alpha * Math.min(1, (H - line.y) / 200)
    ctx.fillText(line.text, line.x, line.y)
  }
  ctx.globalAlpha = 1
}

function frame() {
  update()
  draw()
  requestAnimationFrame(frame)
}

frame()
