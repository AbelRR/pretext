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
  const noteW = Math.min(180 + Math.random() * 60, W - 40)
  const prepared = prepareWithSegments(text, font)
  const result = layoutWithLines(prepared, noteW - pad * 2, lineHeight)
  return {
    x, y, w: noteW, text, color, rotation, prepared,
    lines: result.lines, height: result.height + pad * 2 + 16,
  }
}

function initialLayout(): Note[] {
  const cols = W < 500 ? 2 : 3
  const noteW = W < 500 ? (W - 60) / 2 : undefined
  return defaultTexts.map((t, i) => {
    const col = i % cols, row = Math.floor(i / cols)
    const spacing = W < 500 ? (W - 20) / cols : 260
    const x = 10 + col * spacing + (Math.random() - 0.5) * 10
    const y = 60 + row * 200 + (Math.random() - 0.5) * 20
    return createNote(x, y, t)
  })
}

const notes: Note[] = initialLayout()

let dragging: Note | null = null
let dragOff = { x: 0, y: 0 }
let lastTap = 0

function noteAt(mx: number, my: number): Note | null {
  for (let i = notes.length - 1; i >= 0; i--) {
    const n = notes[i]
    if (mx >= n.x && mx <= n.x + n.w && my >= n.y && my <= n.y + n.height) return n
  }
  return null
}

function startDrag(x: number, y: number) {
  const n = noteAt(x, y)
  if (n) {
    dragging = n
    dragOff = { x: x - n.x, y: y - n.y }
    notes.splice(notes.indexOf(n), 1)
    notes.push(n)
    draw()
  }
}

function moveDrag(x: number, y: number) {
  if (dragging) {
    dragging.x = x - dragOff.x
    dragging.y = y - dragOff.y
    draw()
  }
}

function endDrag() { dragging = null }

function editNote(x: number, y: number) {
  const n = noteAt(x, y)
  if (n) {
    const newText = prompt('Edit note:', n.text)
    if (newText !== null && newText !== n.text) {
      n.text = newText
      n.prepared = prepareWithSegments(newText, font)
      const result = layoutWithLines(n.prepared, n.w - pad * 2, lineHeight)
      n.lines = result.lines
      n.height = result.height + pad * 2 + 16
    }
    draw()
  }
}

// Mouse events
canvas.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY))
canvas.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY))
canvas.addEventListener('mouseup', endDrag)
canvas.addEventListener('dblclick', e => editNote(e.clientX, e.clientY))

// Touch events
canvas.addEventListener('touchstart', e => {
  e.preventDefault()
  const t = e.touches[0]
  const now = Date.now()
  if (now - lastTap < 300) {
    editNote(t.clientX, t.clientY)
    lastTap = 0
    return
  }
  lastTap = now
  startDrag(t.clientX, t.clientY)
}, { passive: false })

canvas.addEventListener('touchmove', e => {
  e.preventDefault()
  const t = e.touches[0]
  moveDrag(t.clientX, t.clientY)
}, { passive: false })

canvas.addEventListener('touchend', e => {
  e.preventDefault()
  endDrag()
}, { passive: false })

addBtn.addEventListener('click', () => {
  const text = prompt('New note:', 'Type something here...')
  if (text) {
    const x = 20 + Math.random() * Math.max(50, W - 250)
    const y = 60 + Math.random() * Math.max(50, H - 300)
    notes.push(createNote(x, y, text))
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
