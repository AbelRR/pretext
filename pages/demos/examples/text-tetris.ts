import { prepare, layout, prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const scoreEl = document.getElementById('score')!
const linesClearedEl = document.getElementById('lines-cleared')!
const dpr = window.devicePixelRatio || 1

const COLS = 10
const CELL = 36
const ROWS = 18
const BOARD_W = COLS * CELL
const BOARD_H = ROWS * CELL
const MARGIN = 40

canvas.width = (BOARD_W + MARGIN * 2) * dpr
canvas.height = (BOARD_H + MARGIN * 2) * dpr
canvas.style.width = (BOARD_W + MARGIN * 2) + 'px'
canvas.style.height = (BOARD_H + MARGIN * 2) + 'px'
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

const snippets = [
  'fn()', 'let x', 'if', '==', '{}', '[]', 'async', 'null', 'true', 'for',
  'map', '=>', '42', 'npm', 'git', 'div', 'css', 'dom', 'api', 'jsx',
  'ref', 'key', 'use', 'var', 'new', 'try', 'err', 'log', 'run', 'end',
  '0.0', 'src', 'pkg', 'mod', 'pub', 'get', 'set', 'del', 'put', 'sum',
  '🚀', '✨', '🎉', '💻', '⚡', 'OK', 'go', 'io', 'rx', 'ts',
]

const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#cc5de8', '#ff922b', '#20c997']
const font = "bold 11px 'Helvetica Neue', Helvetica, Arial, sans-serif"

await document.fonts.ready

type Block = {
  text: string; color: string
  colSpan: number // how many grid columns wide
  prepared: ReturnType<typeof prepare>
}

type PlacedBlock = Block & { col: number; row: number }

const board: (PlacedBlock | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
let score = 0
let linesCleared = 0

function createBlock(): Block {
  const text = snippets[Math.floor(Math.random() * snippets.length)]
  const color = colors[Math.floor(Math.random() * colors.length)]
  const prepared = prepare(text, font)
  const result = layout(prepared, 9999, 14)
  // Width determines column span (1-3)
  const measuredWidth = (() => {
    const p = prepareWithSegments(text, font)
    const r = layoutWithLines(p, 9999, 14)
    return r.lines.length > 0 ? r.lines[0].width : 20
  })()
  const colSpan = Math.max(1, Math.min(3, Math.ceil(measuredWidth / CELL + 0.3)))
  return { text, color, colSpan, prepared }
}

let falling: { block: Block; col: number; row: number; dropTimer: number } | null = null
let dropInterval = 500
let lastTime = 0
let gameOver = false

function canPlace(col: number, row: number, span: number): boolean {
  if (col < 0 || col + span > COLS || row >= ROWS) return false
  if (row < 0) return true
  for (let c = col; c < col + span; c++) {
    if (board[row][c] !== null) return false
  }
  return true
}

function placeFalling() {
  if (!falling) return
  const { block, col, row } = falling
  const placed: PlacedBlock = { ...block, col, row }
  for (let c = col; c < col + block.colSpan; c++) {
    if (row >= 0 && row < ROWS) board[row][c] = placed
  }
  checkLines()
  falling = null
}

function checkLines() {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== null)) {
      // Clear line
      board.splice(r, 1)
      board.unshift(Array(COLS).fill(null))
      score += 100
      linesCleared++
      scoreEl.textContent = String(score)
      linesClearedEl.textContent = String(linesCleared)
      r++ // recheck this row
    }
  }
}

function spawnBlock() {
  const block = createBlock()
  const col = Math.floor(Math.random() * (COLS - block.colSpan + 1))
  falling = { block, col, row: -1, dropTimer: 0 }

  if (!canPlace(col, 0, block.colSpan)) {
    gameOver = true
  }
}

document.addEventListener('keydown', e => {
  if (!falling || gameOver) return
  if (e.key === 'ArrowLeft') {
    if (canPlace(falling.col - 1, falling.row, falling.block.colSpan)) falling.col--
  } else if (e.key === 'ArrowRight') {
    if (canPlace(falling.col + 1, falling.row, falling.block.colSpan)) falling.col++
  } else if (e.key === 'ArrowDown') {
    // Hard drop
    while (canPlace(falling.col, falling.row + 1, falling.block.colSpan)) falling.row++
    placeFalling()
    score += 10
    scoreEl.textContent = String(score)
  }
})

function update(time: number) {
  if (gameOver) return
  if (!falling) spawnBlock()
  if (!falling) return

  falling.dropTimer += time - lastTime
  if (falling.dropTimer >= dropInterval) {
    falling.dropTimer = 0
    if (canPlace(falling.col, falling.row + 1, falling.block.colSpan)) {
      falling.row++
    } else {
      placeFalling()
      score += 5
      scoreEl.textContent = String(score)
    }
  }
}

function draw() {
  ctx.fillStyle = '#0a0a1a'
  ctx.fillRect(0, 0, BOARD_W + MARGIN * 2, BOARD_H + MARGIN * 2)

  // Board outline
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 2
  ctx.strokeRect(MARGIN, MARGIN, BOARD_W, BOARD_H)

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath()
    ctx.moveTo(MARGIN + c * CELL, MARGIN)
    ctx.lineTo(MARGIN + c * CELL, MARGIN + BOARD_H)
    ctx.stroke()
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath()
    ctx.moveTo(MARGIN, MARGIN + r * CELL)
    ctx.lineTo(MARGIN + BOARD_W, MARGIN + r * CELL)
    ctx.stroke()
  }

  // Placed blocks
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c]
      if (cell && cell.col === c) { // only draw from the leftmost cell
        drawBlock(cell.col, r, cell)
      }
    }
  }

  // Falling block
  if (falling && falling.row >= 0) {
    drawBlock(falling.col, falling.row, falling.block)
  }

  // Game over
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, BOARD_W + MARGIN * 2, BOARD_H + MARGIN * 2)
    ctx.font = "bold 32px 'Helvetica Neue'"
    ctx.fillStyle = '#ff6b6b'
    ctx.textAlign = 'center'
    ctx.fillText('GAME OVER', MARGIN + BOARD_W / 2, MARGIN + BOARD_H / 2)
    ctx.font = "14px 'Helvetica Neue'"
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('Refresh to play again', MARGIN + BOARD_W / 2, MARGIN + BOARD_H / 2 + 30)
    ctx.textAlign = 'left'
  }
}

function drawBlock(col: number, row: number, block: Block | PlacedBlock) {
  const x = MARGIN + col * CELL
  const y = MARGIN + row * CELL
  const w = block.colSpan * CELL

  ctx.fillStyle = block.color
  ctx.globalAlpha = 0.2
  ctx.fillRect(x + 1, y + 1, w - 2, CELL - 2)
  ctx.globalAlpha = 1

  ctx.strokeStyle = block.color
  ctx.lineWidth = 1.5
  ctx.strokeRect(x + 1, y + 1, w - 2, CELL - 2)

  ctx.font = font
  ctx.fillStyle = block.color
  ctx.textAlign = 'center'
  ctx.fillText(block.text, x + w / 2, y + CELL / 2 + 4)
  ctx.textAlign = 'left'
}

function frame(time: number) {
  update(time)
  draw()
  lastTime = time
  requestAnimationFrame(frame)
}

spawnBlock()
requestAnimationFrame(frame)
