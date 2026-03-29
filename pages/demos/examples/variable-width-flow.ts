import { prepareWithSegments, layoutNextLine } from '../../../src/layout.ts'

const articleText = `The history of typography is a story of constraint and invention. From Gutenberg's movable type to phototypesetting to the digital revolution, each era found new ways to arrange words on a surface. But the web introduced a peculiar regression: for all its dynamism, browser text layout remained a black box. Developers could set a width and hope for the best, but they could never truly control where lines broke or how text flowed around obstacles without heavy DOM interaction. Pretext changes this equation entirely. By moving text measurement to canvas and making layout pure arithmetic, it gives developers the tools that print designers have had for centuries — but in real-time, at 60fps, in any language. The implications stretch from chat applications to e-readers, from game UIs to data visualization. When you can predict exactly how text will wrap at any width in microseconds, the design space explodes open. Suddenly, magazine-style layouts with text flowing around irregular shapes aren't just possible — they're trivial. Variable-width columns, balanced text, optimal line breaking — all become accessible primitives rather than impossible dreams.`

const font = "16px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 24
const margin = 24
const canvasWidth = 700
const columnWidth = canvasWidth - margin * 2

await document.fonts.ready

const prepared = prepareWithSegments(articleText, font)
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

// High-DPI support
const dpr = window.devicePixelRatio || 1
canvas.width = 700 * dpr
canvas.height = 520 * dpr
canvas.style.width = '700px'
canvas.style.height = '520px'
ctx.scale(dpr, dpr)

let obstacle = { x: 60, y: 40, size: 160 }

function render() {
  ctx.clearRect(0, 0, 700, 520)

  // Draw obstacle
  const ox = margin + obstacle.x
  const oy = margin + obstacle.y
  const os = obstacle.size

  // Rounded rect with gradient
  const grad = ctx.createLinearGradient(ox, oy, ox + os, oy + os)
  grad.addColorStop(0, '#6366f1')
  grad.addColorStop(1, '#8b5cf6')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(ox, oy, os, os, 12)
  ctx.fill()

  // Image placeholder text
  ctx.fillStyle = '#fff'
  ctx.font = "bold 14px 'Helvetica Neue'"
  ctx.textAlign = 'center'
  ctx.fillText('IMAGE', ox + os / 2, oy + os / 2 - 6)
  ctx.font = "11px 'Helvetica Neue'"
  ctx.fillStyle = '#c4b5fd'
  ctx.fillText('(drag sliders)', ox + os / 2, oy + os / 2 + 12)
  ctx.textAlign = 'left'

  // Flow text around obstacle using layoutNextLine
  ctx.font = font
  ctx.fillStyle = '#cbd5e1'

  let cursor = { segmentIndex: 0, graphemeIndex: 0 }
  let y = margin

  const obstacleLeft = obstacle.x
  const obstacleRight = obstacle.x + os
  const obstacleTop = obstacle.y
  const obstacleBottom = obstacle.y + os
  const gap = 12 // gap between text and obstacle

  while (true) {
    // Determine available width for this line based on obstacle position
    let lineX = margin
    let lineWidth = columnWidth

    const lineTop = y - margin
    const lineBottom = lineTop + lineHeight

    if (lineBottom > obstacleTop && lineTop < obstacleBottom) {
      // This line overlaps with the obstacle vertically
      if (obstacleLeft < columnWidth / 2) {
        // Obstacle is on the left side — text goes right
        lineX = margin + obstacleRight + gap
        lineWidth = columnWidth - obstacleRight - gap
      } else {
        // Obstacle is on the right side — text goes left
        lineWidth = obstacleLeft - gap
      }
    }

    if (lineWidth < 30) {
      // Too narrow, skip this line
      y += lineHeight
      if (y > 500) break
      continue
    }

    const line = layoutNextLine(prepared, cursor, lineWidth)
    if (line === null) break

    ctx.fillText(line.text, lineX, y + 17) // baseline offset
    cursor = line.end
    y += lineHeight

    if (y > 500) break
  }

  // Draw subtle column guides
  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.strokeRect(margin, margin, columnWidth, 520 - margin * 2)
  ctx.setLineDash([])
}

// Slider controls
function setupSlider(id: string, prop: keyof typeof obstacle, valId: string) {
  const slider = document.getElementById(id) as HTMLInputElement
  const valEl = document.getElementById(valId)!
  slider.addEventListener('input', () => {
    obstacle[prop] = parseInt(slider.value)
    valEl.textContent = slider.value
    render()
  })
}

setupSlider('ox', 'x', 'ox-val')
setupSlider('oy', 'y', 'oy-val')
setupSlider('os', 'size', 'os-val')

render()
