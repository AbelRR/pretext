import { prepare, layout } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const resetBtn = document.getElementById('reset-btn')!
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

const blockTexts = [
  "layout()", "prepare()", "DOM reflow", "measureText", "Intl.Segmenter",
  "shrinkwrap", "0.0002ms", "CJK 春天", "emoji 🚀", "walkLineRanges",
  "layoutNextLine", "pure arithmetic", "no DOM reads", "canvas API",
  "grapheme split", "kinsoku rules", "segment cache", "overflow-wrap",
  "line-break", "prepareWithSegments",
]

const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8', '#ff922b', '#20c997', '#38bdf8', '#f472b6', '#a78bfa']
const font = "bold 13px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const blockW = 180
const lineHeight = 16

await document.fonts.ready

type Block = {
  text: string; color: string; h: number
  x: number; y: number; vy: number; vx: number
  rotation: number; vr: number; removed: boolean
}

let blocks: Block[] = []

function buildTower() {
  blocks = []
  const towerX = W / 2 - blockW / 2
  let y = H - 20

  for (let i = 0; i < blockTexts.length; i++) {
    const text = blockTexts[i]
    const p = prepare(text, font)
    const result = layout(p, blockW - 16, lineHeight)
    const h = result.height + 12

    y -= h
    blocks.push({
      text, color: colors[i % colors.length], h,
      x: towerX + (Math.random() - 0.5) * 4,
      y, vy: 0, vx: 0,
      rotation: (Math.random() - 0.5) * 2,
      vr: 0, removed: false,
    })
  }
}

buildTower()
resetBtn.addEventListener('click', buildTower)

canvas.addEventListener('click', e => {
  const mx = e.clientX, my = e.clientY
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i]
    if (!b.removed && mx >= b.x && mx <= b.x + blockW && my >= b.y && my <= b.y + b.h) {
      b.removed = true
      b.vx = (Math.random() - 0.5) * 15
      b.vy = -5
      b.vr = (Math.random() - 0.5) * 10
      break
    }
  }
})

function update() {
  for (const b of blocks) {
    if (b.removed) {
      b.vy += 0.5
      b.x += b.vx
      b.y += b.vy
      b.rotation += b.vr
      b.vr *= 0.98
    } else {
      // Gravity: check if supported
      let supported = false
      if (b.y + b.h >= H - 20) {
        supported = true
        b.y = H - 20 - b.h
      } else {
        for (const other of blocks) {
          if (other === b || other.removed) continue
          if (other.y > b.y && Math.abs(other.x - b.x) < blockW * 0.7 && other.y - (b.y + b.h) < 2) {
            supported = true
            b.y = other.y - b.h
            break
          }
        }
      }
      if (!supported) {
        b.vy += 0.3
        b.y += b.vy
        b.vx += (Math.random() - 0.5) * 0.5
        b.x += b.vx
      } else {
        b.vy = 0
        b.vx *= 0.9
        b.x += b.vx
      }
    }
  }
}

function draw() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  // Floor
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(0, H - 20, W, 20)

  for (const b of blocks) {
    ctx.save()
    ctx.translate(b.x + blockW / 2, b.y + b.h / 2)
    ctx.rotate(b.rotation * Math.PI / 180)

    ctx.fillStyle = b.color
    ctx.globalAlpha = b.removed ? 0.4 : 0.2
    ctx.fillRect(-blockW / 2, -b.h / 2, blockW, b.h)

    ctx.strokeStyle = b.color
    ctx.globalAlpha = b.removed ? 0.3 : 0.7
    ctx.lineWidth = 1.5
    ctx.strokeRect(-blockW / 2, -b.h / 2, blockW, b.h)

    ctx.font = font
    ctx.fillStyle = b.color
    ctx.globalAlpha = b.removed ? 0.3 : 0.9
    ctx.textAlign = 'center'
    ctx.fillText(b.text, 0, 4)
    ctx.textAlign = 'left'

    ctx.restore()
  }
}

function frame() {
  update()
  draw()
  requestAnimationFrame(frame)
}

frame()
