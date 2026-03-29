import { prepare, layout } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const sortBtn = document.getElementById('sort-btn')!
const shuffleBtn = document.getElementById('shuffle-btn')!
const widthBtn = document.getElementById('width-btn')!
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

const texts = [
  "Hi", "Hello there!", "The quick brown fox", "lol",
  "A longer message that will wrap to multiple lines when the width is narrow enough",
  "AGI 春天到了 🚀", "OK", "npm install", "Meeting in 5",
  "The migration script needs to handle the case where a user has both a legacy account",
  "k", "Sounds good 👍", "🎉🎉🎉", "On my way",
  "I just pushed a fix for the login bug. Race condition in session refresh.",
  "Can you review?", "The CI pipeline is failing on arm64 builds again",
  "Did you see the new design mockups? Header is too tall on mobile.",
  "Just a heads up — staging is down until 3pm EST",
  "Remember that Unicode normalization edge case? It affects notifications too.",
  "WebSocket connections per tab are expensive", "Let's pair tomorrow",
  "The quarterly report is due by Friday", "Bug fix deployed ✅",
  "Performance looks good in prod", "Schema migration complete",
  "API rate limits increased to 1000/min", "New feature flag enabled",
  "Hotfix for the auth middleware", "Release notes drafted",
  "Load test results: p99 < 200ms", "Monitoring alert resolved",
  "Database index optimization done", "Cache invalidation fixed",
  "Deployment rollback completed", "Security patch applied",
  "Integration tests passing", "Code review requested",
  "Sprint retrospective notes", "Dependency update PR merged",
  "Feature branch rebased", "Docker image rebuilt",
  "SSL certificate renewed", "Backup verification complete",
  "Log rotation configured", "Memory leak investigation",
  "API documentation updated", "Error handling improved",
  "Unit test coverage at 87%", "Staging environment restored",
  "Production deploy scheduled", "Incident postmortem written",
]

const font = "13px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 18
const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8', '#ff922b', '#20c997', '#38bdf8', '#f472b6', '#a78bfa']

await document.fonts.ready

let blockWidth = 160

type Block = {
  text: string; prepared: ReturnType<typeof prepare>; height: number
  x: number; y: number; targetX: number; targetY: number; color: string
}

let blocks: Block[] = []

function initBlocks() {
  blocks = texts.map((text, i) => {
    const prepared = prepare(text, font)
    const result = layout(prepared, blockWidth - 16, lineHeight)
    const height = result.height + 12
    return {
      text, prepared, height,
      x: 0, y: 0, targetX: 0, targetY: 0,
      color: colors[i % colors.length],
    }
  })
  layoutGrid()
}

function layoutGrid() {
  const gap = 6
  const cols = Math.max(1, Math.floor((W - 40) / (blockWidth + gap)))
  blocks.forEach((b, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    // Calculate y by summing heights in this column
    let y = 50
    for (let r = 0; r < row; r++) {
      const idx = r * cols + col
      if (idx < blocks.length) y += blocks[idx].height + gap
    }
    b.targetX = 20 + col * (blockWidth + gap)
    b.targetY = y
    if (b.x === 0 && b.y === 0) { b.x = b.targetX; b.y = b.targetY }
  })
}

function recalcHeights() {
  for (const b of blocks) {
    const result = layout(b.prepared, blockWidth - 16, lineHeight)
    b.height = result.height + 12
  }
  layoutGrid()
}

sortBtn.addEventListener('click', () => {
  blocks.sort((a, b) => a.height - b.height)
  layoutGrid()
})

shuffleBtn.addEventListener('click', () => {
  for (let i = blocks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]]
  }
  layoutGrid()
})

widthBtn.addEventListener('click', () => {
  blockWidth = blockWidth === 160 ? 100 : blockWidth === 100 ? 220 : 160
  recalcHeights()
})

function update() {
  for (const b of blocks) {
    b.x += (b.targetX - b.x) * 0.12
    b.y += (b.targetY - b.y) * 0.12
  }
}

function draw() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, W, H)

  for (const b of blocks) {
    // Bar representing height
    ctx.fillStyle = b.color
    ctx.globalAlpha = 0.15
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, blockWidth, b.height, 4)
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.strokeStyle = b.color
    ctx.globalAlpha = 0.4
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, blockWidth, b.height, 4)
    ctx.stroke()
    ctx.globalAlpha = 1

    // Truncated text
    ctx.font = "11px 'Helvetica Neue'"
    ctx.fillStyle = b.color
    ctx.globalAlpha = 0.7
    const displayText = b.text.length > 25 ? b.text.slice(0, 25) + '…' : b.text
    ctx.fillText(displayText, b.x + 8, b.y + b.height / 2 + 4)
    ctx.globalAlpha = 1
  }
}

function frame() {
  update()
  draw()
  requestAnimationFrame(frame)
}

initBlocks()
frame()
