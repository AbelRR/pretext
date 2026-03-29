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
window.addEventListener('resize', resize)

const verses = [
  "Hello from the other side of text layout",
  "I must have called a thousand times",
  "To tell you I'm sorry for every reflow",
  "But when I call pretext it don't matter",
  "Because the layout is pure arithmetic",
  "No DOM no reflow no jank at all",
  "Just cached widths and simple math",
  "Computing heights in microseconds",
  "While the browser takes milliseconds",
  "For the same simple measurement",
  "Pretext changed everything we know",
  "About how text wraps in the browser",
]

const font = "bold 28px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const dimFont = "bold 28px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 40
const maxWidth = Math.min(700, W - 60)
const linesVisible = 5

await document.fonts.ready

// Prepare each verse
const prepared = verses.map(v => {
  const p = prepareWithSegments(v, font)
  const result = layoutWithLines(p, maxWidth, lineHeight)
  return { text: v, lines: result.lines, height: result.height }
})

let startTime = performance.now()
const msPerVerse = 3000

function draw() {
  const elapsed = performance.now() - startTime
  const currentVerseFloat = elapsed / msPerVerse
  const currentVerse = Math.floor(currentVerseFloat) % verses.length
  const verseProgress = currentVerseFloat % 1

  ctx.fillStyle = '#0f0520'
  ctx.fillRect(0, 0, W, H)

  // Particles
  for (let i = 0; i < 30; i++) {
    const t = (elapsed / 5000 + i * 0.1) % 1
    const x = (Math.sin(i * 7.3 + elapsed / 2000) + 1) / 2 * W
    const y = H * (1 - t)
    ctx.beginPath()
    ctx.arc(x, y, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(124, 138, 255, ${(1 - t) * 0.3})`
    ctx.fill()
  }

  const centerY = H / 2
  const startIdx = Math.max(0, currentVerse - 2)
  const endIdx = Math.min(verses.length, currentVerse + linesVisible)

  for (let i = startIdx; i < endIdx; i++) {
    const offset = i - currentVerse
    const y = centerY + offset * 50 - verseProgress * 50
    const text = verses[i % verses.length]

    const isCurrent = i === currentVerse
    const isPast = i < currentVerse

    ctx.font = font
    ctx.textAlign = 'center'

    if (isCurrent) {
      // Highlight word by word
      const words = text.split(' ')
      const wordProgress = Math.floor(verseProgress * words.length)
      let x = W / 2 - ctx.measureText(text).width / 2

      ctx.textAlign = 'left'
      for (let w = 0; w < words.length; w++) {
        const word = words[w] + (w < words.length - 1 ? ' ' : '')
        if (w <= wordProgress) {
          ctx.fillStyle = '#7c8aff'
          ctx.shadowColor = '#7c8aff'
          ctx.shadowBlur = 20
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.4)'
          ctx.shadowBlur = 0
        }
        ctx.fillText(word, x, y)
        x += ctx.measureText(word).width
      }
      ctx.shadowBlur = 0
    } else {
      ctx.textAlign = 'center'
      const alpha = isPast ? 0.15 : Math.max(0.1, 0.5 - Math.abs(offset) * 0.15)
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.fillText(text, W / 2, y)
    }
  }

  ctx.textAlign = 'left'
  requestAnimationFrame(draw)
}

draw()
