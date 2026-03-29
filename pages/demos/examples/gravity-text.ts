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
window.addEventListener('resize', () => { resize(); resetWords() })

const words = [
  'pretext', 'layout', 'measure', 'canvas', 'reflow', 'prepare', 'segments',
  'shrinkwrap', 'typography', 'render', 'height', 'width', 'lines', 'break',
  'unicode', 'emoji', '🚀', 'CJK', '春天', 'Arabic', 'bidi', 'RTL',
  'cache', 'resize', 'fast', '0.0002ms', 'DOM-free', 'arithmetic', 'pure',
  'pixel', 'font', 'glyph', 'wrap', 'flow', 'column', 'Thai', '日本語',
  '한국어', 'grapheme', 'kinsoku', 'virtual', 'scroll', 'shrink', 'balance',
  'editorial', 'magazine', 'obstacle', '✨', '🎉', 'whoa', 'wow',
]

const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8', '#ff922b', '#20c997', '#a855f7', '#38bdf8', '#fb923c']
const sizes = [16, 20, 24, 28, 32, 40]

type FallingWord = {
  text: string; font: string; fontSize: number; color: string
  x: number; y: number; vy: number; vx: number
  width: number; height: number; grounded: boolean; rotation: number
}

await document.fonts.ready

const fallingWords: FallingWord[] = []
const groundedRects: { x: number; y: number; w: number; h: number }[] = []
let spawnTimer = 0

function measureWord(text: string, font: string, fontSize: number): { width: number; height: number } {
  const prepared = prepareWithSegments(text, font)
  const result = layoutWithLines(prepared, 9999, fontSize * 1.3)
  const lineW = result.lines.length > 0 ? result.lines[0].width : 0
  return { width: Math.ceil(lineW) + 4, height: Math.ceil(result.height) }
}

function spawnWord() {
  const text = words[Math.floor(Math.random() * words.length)]
  const fontSize = sizes[Math.floor(Math.random() * sizes.length)]
  const font = `bold ${fontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`
  const color = colors[Math.floor(Math.random() * colors.length)]
  const { width, height } = measureWord(text, font, fontSize)

  fallingWords.push({
    text, font, fontSize, color,
    x: Math.random() * (W - width),
    y: -height - Math.random() * 100,
    vy: 1 + Math.random() * 2,
    vx: (Math.random() - 0.5) * 0.5,
    width, height,
    grounded: false,
    rotation: (Math.random() - 0.5) * 10,
  })
}

function resetWords() {
  fallingWords.length = 0
  groundedRects.length = 0
}

function findGround(word: FallingWord): number {
  let ground = H - word.height
  for (const r of groundedRects) {
    if (word.x + word.width > r.x && word.x < r.x + r.w) {
      const top = r.y - word.height
      if (top < ground) ground = top
    }
  }
  return ground
}

function update() {
  spawnTimer++
  if (spawnTimer % 8 === 0 && fallingWords.filter(w => !w.grounded).length < 15) {
    spawnWord()
  }

  for (const w of fallingWords) {
    if (w.grounded) continue
    w.vy += 0.15 // gravity
    w.y += w.vy
    w.x += w.vx

    // bounce off walls
    if (w.x < 0) { w.x = 0; w.vx = Math.abs(w.vx) }
    if (w.x + w.width > W) { w.x = W - w.width; w.vx = -Math.abs(w.vx) }

    const ground = findGround(w)
    if (w.y >= ground) {
      w.y = ground
      w.grounded = true
      w.vy = 0
      groundedRects.push({ x: w.x, y: w.y, w: w.width, h: w.height })
    }
  }

  // Remove words that stack too high (reset if pile reaches top)
  if (groundedRects.length > 0 && groundedRects.some(r => r.y < 50)) {
    // Dramatic collapse
    for (const w of fallingWords) {
      if (w.grounded) {
        w.grounded = false
        w.vy = -3 - Math.random() * 5
        w.vx = (Math.random() - 0.5) * 8
      }
    }
    groundedRects.length = 0
  }
}

function draw() {
  ctx.fillStyle = 'rgba(10, 10, 26, 0.15)'
  ctx.fillRect(0, 0, W, H)

  for (const w of fallingWords) {
    ctx.save()
    ctx.translate(w.x + w.width / 2, w.y + w.height / 2)
    ctx.rotate(w.rotation * Math.PI / 180)
    ctx.font = w.font
    ctx.fillStyle = w.color
    ctx.globalAlpha = w.grounded ? 0.9 : 0.7
    ctx.shadowColor = w.color
    ctx.shadowBlur = w.grounded ? 0 : 8
    ctx.fillText(w.text, -w.width / 2 + 2, w.height / 2 - w.fontSize * 0.25)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // floor line
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, H - 1)
  ctx.lineTo(W, H - 1)
  ctx.stroke()
}

function frame() {
  update()
  draw()
  requestAnimationFrame(frame)
}

frame()
