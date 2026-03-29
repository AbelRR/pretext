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

const wordFreqs: [string, number][] = [
  ['pretext', 50], ['layout', 40], ['measure', 35], ['canvas', 30], ['DOM', 28],
  ['reflow', 26], ['height', 24], ['width', 22], ['lines', 20], ['fast', 35],
  ['prepare', 18], ['segments', 16], ['shrinkwrap', 25], ['arithmetic', 15],
  ['unicode', 14], ['emoji', 22], ['CJK', 18], ['Arabic', 16], ['Thai', 14],
  ['cache', 13], ['resize', 15], ['render', 17], ['font', 20], ['text', 45],
  ['browser', 14], ['pixel', 12], ['grapheme', 11], ['kinsoku', 10],
  ['virtual', 13], ['scroll', 12], ['balance', 11], ['editorial', 10],
  ['bidi', 9], ['RTL', 10], ['wrap', 14], ['break', 12],
  ['春天', 15], ['🚀', 18], ['typography', 13], ['column', 11],
]

const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8', '#ff922b', '#20c997', '#38bdf8', '#f472b6', '#a78bfa']

await document.fonts.ready

type PlacedWord = {
  text: string; font: string; x: number; y: number; w: number; h: number; color: string
  targetAlpha: number; alpha: number
}

const placed: PlacedWord[] = []

function placeWords() {
  placed.length = 0
  const sorted = [...wordFreqs].sort((a, b) => b[1] - a[1])
  const occupied: { x: number; y: number; w: number; h: number }[] = []

  for (const [word, freq] of sorted) {
    const fontSize = Math.max(12, Math.min(64, freq * 1.3))
    const font = `bold ${fontSize}px 'Helvetica Neue', Helvetica, Arial, sans-serif`
    const prepared = prepareWithSegments(word, font)
    const result = layoutWithLines(prepared, 9999, fontSize * 1.2)
    const w = (result.lines[0]?.width ?? 20) + 8
    const h = result.height + 4

    // Try to place near center, spiral outward
    let bestX = 0, bestY = 0, found = false
    const cx = W / 2 - w / 2, cy = H / 2 - h / 2

    for (let r = 0; r < 300 && !found; r++) {
      const angle = r * 0.5
      const radius = r * 2
      const tx = cx + Math.cos(angle) * radius
      const ty = cy + Math.sin(angle) * radius * 0.6

      if (tx < 10 || tx + w > W - 10 || ty < 10 || ty + h > H - 10) continue

      let overlaps = false
      for (const o of occupied) {
        if (tx < o.x + o.w + 4 && tx + w + 4 > o.x && ty < o.y + o.h + 2 && ty + h + 2 > o.y) {
          overlaps = true; break
        }
      }
      if (!overlaps) { bestX = tx; bestY = ty; found = true }
    }

    if (found) {
      occupied.push({ x: bestX, y: bestY, w, h })
      placed.push({
        text: word, font, x: bestX, y: bestY, w, h,
        color: colors[placed.length % colors.length],
        targetAlpha: 1, alpha: 0,
      })
    }
  }
}

placeWords()

let time = 0
function draw() {
  time += 0.016
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  for (let i = 0; i < placed.length; i++) {
    const p = placed[i]
    // Staggered fade in
    const fadeStart = i * 0.05
    p.alpha = Math.min(1, Math.max(0, (time - fadeStart) * 2))

    ctx.font = p.font
    ctx.fillStyle = p.color
    ctx.globalAlpha = p.alpha

    // Subtle hover effect via sine
    const yOff = Math.sin(time * 0.5 + i) * 2
    ctx.fillText(p.text, p.x, p.y + p.h * 0.8 + yOff)
  }
  ctx.globalAlpha = 1

  requestAnimationFrame(draw)
}

draw()
window.addEventListener('resize', () => { resize(); placeWords(); time = 0 })
