import { prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const cardsEl = document.getElementById('cards')!
const linesSlider = document.getElementById('lines-slider') as HTMLInputElement
const widthSlider = document.getElementById('width-slider') as HTMLInputElement
const linesVal = document.getElementById('lines-val')!
const widthVal = document.getElementById('width-val')!

const texts = [
  "The web has a dirty secret: it can't measure text without rendering it. Every call to getBoundingClientRect forces a synchronous layout reflow of the entire document. This is one of the most expensive operations a browser performs.",
  "AGI 春天到了 🚀 The future of text layout is here. Arabic, CJK, Thai, emoji — all measured perfectly. بدأت الرحلة. Pretext makes it trivial to predict text height at any width.",
  "Pretext uses canvas measureText for word segments, caches results, then does pure arithmetic. The prepare step runs once. After that, layout is 0.0002ms per text — fast enough for animation.",
  "Chat bubbles can shrink-wrap to their content by binary-searching for the optimal width. Magazine-style layouts can flow text around obstacles. Virtualized lists predict heights perfectly.",
  "The lesson is that the right abstraction changes everything. Text measurement felt inherently DOM-bound until someone realized it wasn't. Now it's just math.",
  "Imagine: 100,000 items in a virtual list, each with a different height, zero layout shift, pixel-perfect scroll position. That's what pretext enables.",
]

const font = "14px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 20

await document.fonts.ready

const prepared = texts.map(t => prepareWithSegments(t, font))

function truncateAtLine(prep: ReturnType<typeof prepareWithSegments>, maxWidth: number, maxLines: number): { text: string; truncated: boolean; totalLines: number } {
  const result = layoutWithLines(prep, maxWidth, lineHeight)
  if (result.lines.length <= maxLines) {
    return { text: result.lines.map(l => l.text).join(' '), truncated: false, totalLines: result.lines.length }
  }
  const visibleText = result.lines.slice(0, maxLines).map(l => l.text).join(' ').trimEnd()
  return { text: visibleText + '…', truncated: true, totalLines: result.lines.length }
}

function render() {
  const maxLines = parseInt(linesSlider.value)
  const maxWidth = parseInt(widthSlider.value)
  linesVal.textContent = String(maxLines)
  widthVal.textContent = String(maxWidth)

  cardsEl.innerHTML = ''
  const textWidth = maxWidth - 32 // padding

  texts.forEach((_, i) => {
    const { text, truncated, totalLines } = truncateAtLine(prepared[i], textWidth, maxLines)

    const card = document.createElement('div')
    card.className = 'card'
    card.style.maxWidth = maxWidth + 'px'

    const title = document.createElement('div')
    title.className = 'card-title'
    title.textContent = truncated ? `Truncated at line ${maxLines}` : 'Full text'
    card.appendChild(title)

    const textEl = document.createElement('div')
    textEl.className = 'card-text'
    if (truncated) {
      const mainText = text.slice(0, -1)
      textEl.innerHTML = mainText + '<span class="ellipsis">…</span>'
    } else {
      textEl.textContent = text
    }
    card.appendChild(textEl)

    const meta = document.createElement('div')
    meta.className = 'card-meta'
    meta.textContent = `${totalLines} total lines · ${truncated ? 'showing ' + maxLines : 'all shown'}`
    card.appendChild(meta)

    cardsEl.appendChild(card)
  })
}

linesSlider.addEventListener('input', render)
widthSlider.addEventListener('input', render)
render()
