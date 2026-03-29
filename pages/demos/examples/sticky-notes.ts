import { prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const addBtn = document.getElementById('add-btn')!

const dpr = window.devicePixelRatio || 1
let W = window.innerWidth, H = window.innerHeight

function resize() {
  W = window.innerWidth; H = window.innerHeight
  canvas.width = W * dpr; canvas.height = H * dpr
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
window.addEventListener('resize', () => { resize(); draw() })

const noteColors = ['#fff9c4', '#f8bbd0', '#c8e6c9', '#bbdefb', '#ffe0b2', '#e1bee7', '#b2dfdb', '#ffccbc']
const font = "14px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 20
const pad = 14
const pinRadius = 5

type Note = {
  x: number; y: number; w: number
  text: string; color: string; rotation: number
  prepared: ReturnType<typeof prepareWithSegments>
  lines: { text: string; width: number }[]
  height: number
}

const defaultTexts = [
  "Remember to check pretext's shrinkwrap — it binary-searches for the tightest bubble width!",
  "TODO: Layout is pure arithmetic after prepare(). ~0.0002ms per text block.",
  "Meeting notes:\n- CJK line breaking works\n- Arabic RTL supported\n- Emoji correction auto-detected",
  "Idea: Use layoutNextLine() to flow text around obstacles like a magazine engine",
  "Bug fix: The token was expiring between preflight and the actual request 🐛",
  "Pretext supports Thai, Khmer, Myanmar — languages with no spaces between words!",
]

await document.fonts.ready

function createNote(x: number, y: number, text: string): Note {
  const color = noteColors[Math.floor(Math.random() * noteColors.length)]
  const rotation = (Math.random() - 0.5) * 8
  const w = 180 + Math.random() * 60
  const prepared = prepareWithSegments(text, font)
  const result = layoutWithLines(prepared, w - pad * 2, lineHeight)
  return {
    x, y, w, text, color, rotation, prepared,
    lines: result.lines, height: result.height + pad * 2 + 16,
  }
}

const notes: Note[] = defaultTexts.map((t, i) => {
  const col = i % 3, row = Math.floor(i / 3)
  return createNote(60 + col * 260 + (Math.random() - 0.5) * 40, 60 + row * 220 + (Math.random() - 0.5) * 30, t)
})

let dragging: Note | null = null
let dragOff = { x: 0, y: 0 }
let editing: Note | null = null

function noteAt(mx: number, my: number): Note | null {
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i]
    if (mx >= n.x && mx <= n.x + n.w && my >= n.y && my <= n.y + n.height) return n
  }
  return null
}

canvas.addEventListener('mousedown', e => {
  if (editing) { editing = null; draw(); return }
  const n = noteAt(e.clientX, e.clientY)
  if (n) {
    dragging = n
    dragOff = { x: e.clientX - n.x, y: e.clientY - n.y }
    notes.splice(notes.indexOf(n), 1)
    notes.push(n) // bring to front
    draw()
  }
})

canvas.addEventListener('mousemove', e => {
  if (dragging) {
    dragging.x = e.clientX - dragOff.x
    dragging.y = e.clientY - dragOff.y
    draw()
  }
})

canvas.addEventListener('mouseup', () => { dragging = null })

canvas.addEventListener('dblclick', e => {
  const n = noteAt(e.clientX, e.clientY)
  if (n) {
    editing = n
    const newText = prompt('Edit note:', n.text)
    if (newText !== null && newText !== n.text) {
      n.text = newText
      n.prepared = prepareWithSegments(newText, font)
      const result = layoutWithLines(n.prepared, n.w - pad * 2, lineHeight)
      n.lines = result.lines
      n.height = result.height + pad * 2 + 16
    }
    editing = null
    draw()
  }
})

addBtn.addEventListener('click', () => {
  const text = prompt('New note:', 'Type something here...')
  if (text) {
    notes.push(createNote(100 + Math.random() * 300, 100 + Math.random() * 200, text))
    draw()
  }
})

function draw() {
  ctx.clearRect(0, 0, W, H)

  for (const n of notes) {
    ctx.save()
    const cx = n.x + n.w / 2, cy = n.y + n.height / 2
    ctx.translate(cx, cy)
    ctx.rotate(n.rotation * Math.PI / 180)
    ctx.translate(-cx, -cy)

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 4

    // Note body
    ctx.fillStyle = n.color
    ctx.fillRect(n.x, n.y, n.w, n.height)
    ctx.shadowColor = 'transparent'

    // Subtle fold
    ctx.fillStyle = 'rgba(0,0,0,0.04)'
    ctx.beginPath()
    ctx.moveTo(n.x + n.w - 20, n.y)
    ctx.lineTo(n.x + n.w, n.y)
    ctx.lineTo(n.x + n.w, n.y + 20)
    ctx.closePath()
    ctx.fill()

    // Pin
    ctx.beginPath()
    ctx.arc(n.x + n.w / 2, n.y + 6, pinRadius, 0, Math.PI * 2)
    ctx.fillStyle = '#e53e3e'
    ctx.fill()
    ctx.strokeStyle = '#c53030'
    ctx.lineWidth = 1
    ctx.stroke()

    // Text
    ctx.font = font
    ctx.fillStyle = '#333'
    for (let i = 0; i < n.lines.length; i++) {
      ctx.fillText(n.lines[i].text, n.x + pad, n.y + pad + 14 + i * lineHeight)
    }

    ctx.restore()
  }
}

draw()
