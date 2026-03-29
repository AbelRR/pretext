import { prepareWithSegments, walkLineRanges, layout } from '../../../src/layout.ts'

const conversations = [
  { text: "Hey, did you see the new pretext library?", sent: true },
  { text: "Yeah! The shrinkwrap feature is incredible. It finally solves the chat bubble width problem that's been bugging frontend devs for years.", sent: false },
  { text: "Right? No more wasted space on the last line.", sent: true },
  { text: "The best part is it works with any language — CJK, Arabic, emoji, everything. AGI 春天到了 🚀", sent: false },
  { text: "And it's pure arithmetic, no DOM reads. So you can do it on resize without jank.", sent: true },
  { text: "I'm definitely using this in our next project. The perf numbers are insane — 0.0002ms per layout call.", sent: false },
]

const font = "15px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 22
const hPad = 24 // 12px left + 12px right

await document.fonts.ready

const prepared = conversations.map(c => prepareWithSegments(c.text, font))

function shrinkwrapWidth(prep: ReturnType<typeof prepareWithSegments>, maxWidth: number) {
  const textMax = maxWidth - hPad
  if (textMax <= 0) return maxWidth

  // Get line count at max width
  let baseLineCount = 0
  walkLineRanges(prep, textMax, () => { baseLineCount++ })

  if (baseLineCount <= 1) {
    // Single line: just use the actual width
    let w = 0
    walkLineRanges(prep, textMax, line => { w = line.width })
    return Math.ceil(w) + hPad
  }

  // Binary search for the narrowest width that keeps the same line count
  let lo = 1, hi = textMax
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    let count = 0
    walkLineRanges(prep, mid, () => { count++ })
    if (count <= baseLineCount) {
      hi = mid
    } else {
      lo = mid + 1
    }
  }

  // Get the actual widest line at the found width
  let widest = 0
  walkLineRanges(prep, lo, line => { if (line.width > widest) widest = line.width })
  return Math.ceil(widest) + hPad
}

function render(maxBubbleWidth: number) {
  const cssChat = document.getElementById('css-chat')!
  const shrinkChat = document.getElementById('shrink-chat')!
  cssChat.innerHTML = ''
  shrinkChat.innerHTML = ''

  let totalCssWaste = 0
  let totalShrinkWaste = 0

  conversations.forEach((conv, i) => {
    const prep = prepared[i]

    // CSS version
    const cssRow = document.createElement('div')
    cssRow.className = `message-row ${conv.sent ? 'sent' : 'received'}`
    const cssBubble = document.createElement('div')
    cssBubble.className = 'bubble css-width'
    cssBubble.style.setProperty('--max-bubble-width', maxBubbleWidth + 'px')
    cssBubble.textContent = conv.text
    cssRow.appendChild(cssBubble)
    cssChat.appendChild(cssRow)

    // Shrinkwrap version
    const shrinkRow = document.createElement('div')
    shrinkRow.className = `message-row ${conv.sent ? 'sent' : 'received'}`
    const shrinkBubble = document.createElement('div')
    shrinkBubble.className = 'bubble shrinkwrap'
    const optimalWidth = shrinkwrapWidth(prep, maxBubbleWidth)
    shrinkBubble.style.width = Math.min(optimalWidth, maxBubbleWidth) + 'px'
    shrinkBubble.textContent = conv.text
    shrinkRow.appendChild(shrinkBubble)
    shrinkChat.appendChild(shrinkRow)
  })
}

const slider = document.getElementById('width-slider') as HTMLInputElement
const valLabel = document.getElementById('width-val')!

slider.addEventListener('input', () => {
  const w = parseInt(slider.value)
  valLabel.textContent = w + 'px'
  render(w)
})

render(300)
