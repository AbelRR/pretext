import { prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
const input = document.getElementById('input') as HTMLInputElement
const dpr = window.devicePixelRatio || 1
let W = window.innerWidth, H = window.innerHeight

function resize() {
  W = window.innerWidth; H = window.innerHeight
  canvas.width = W * dpr; canvas.height = H * dpr
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
resize()
window.addEventListener('resize', () => { resize(); render() })

const fonts = ['Georgia', 'Courier New', 'Times New Roman', 'Arial', 'Helvetica Neue', 'Impact']
const bgColors = ['#fef3c7', '#fce7f3', '#d1fae5', '#dbeafe', '#ede9fe', '#fee2e2', '#ffedd5', '#e0e7ff']
const textColors = ['#92400e', '#9d174d', '#065f46', '#1e40af', '#5b21b6', '#991b1b', '#9a3412', '#3730a3']

await document.fonts.ready

type WordTile = {
  word: string; font: string; fontSize: number
  width: number; height: number
  bgColor: string; textColor: string
  rotation: number
}

function measureWord(word: string, font: string): { width: number; height: number } {
  const prepared = prepareWithSegments(word, font)
  const result = layoutWithLines(prepared, 9999, 10)
  const w = result.lines.length > 0 ? result.lines[0].width : 20
  return { width: Math.ceil(w) + 20, height: Math.ceil(result.height) + 16 }
}

function render() {
  ctx.fillStyle = '#f5f0e8'
  ctx.fillRect(0, 0, W, H)

  // Paper texture
  ctx.fillStyle = 'rgba(0,0,0,0.02)'
  for (let i = 0; i < 200; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
  }

  const words = input.value.split(/\s+/).filter(w => w.length > 0)
  if (words.length === 0) return

  const tiles: WordTile[] = words.map(word => {
    const fontFamily = fonts[Math.floor(Math.random() * fonts.length)]
    const fontSize = 20 + Math.floor(Math.random() * 32)
    const font = `bold ${fontSize}px '${fontFamily}'`
    const { width, height } = measureWord(word, font)
    const idx = Math.floor(Math.random() * bgColors.length)
    return {
      word, font, fontSize, width, height,
      bgColor: bgColors[idx], textColor: textColors[idx],
      rotation: (Math.random() - 0.5) * 8,
    }
  })

  // Lay them out in a rough grid centered on screen
  let x = (W - Math.min(W - 80, 600)) / 2
  let y = 100
  const maxX = W - x
  let rowHeight = 0

  for (const tile of tiles) {
    if (x + tile.width > maxX && x > (W - 600) / 2 + 10) {
      x = (W - Math.min(W - 80, 600)) / 2 + Math.random() * 20
      y += rowHeight + 8
      rowHeight = 0
    }

    ctx.save()
    ctx.translate(x + tile.width / 2, y + tile.height / 2)
    ctx.rotate(tile.rotation * Math.PI / 180)

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.15)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 2

    // Background
    ctx.fillStyle = tile.bgColor
    ctx.fillRect(-tile.width / 2, -tile.height / 2, tile.width, tile.height)
    ctx.shadowColor = 'transparent'

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1
    ctx.strokeRect(-tile.width / 2, -tile.height / 2, tile.width, tile.height)

    // Text
    ctx.font = tile.font
    ctx.fillStyle = tile.textColor
    ctx.textAlign = 'center'
    ctx.fillText(tile.word, 0, tile.fontSize * 0.35)
    ctx.textAlign = 'left'

    ctx.restore()

    x += tile.width + 6 + Math.random() * 8
    rowHeight = Math.max(rowHeight, tile.height)
  }
}

input.addEventListener('input', render)
render()
