import { prepareWithSegments, walkLineRanges, layout, prepare } from '../../../src/layout.ts'

const headlines = [
  "Breaking: New Discovery Changes Everything We Know About Deep Sea Life",
  "The Art of Building Software That Lasts for Decades",
  "Why the Best Engineers Write Less Code, Not More",
  "A Journey Through the Mountains of Patagonia at Sunset",
  "Scientists Discover New Method for Carbon Capture Using Modified Algae in Coastal Regions",
]

const font = "18px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 28
const maxWidth = 420
const padding = 32

await document.fonts.ready

const unbalancedEl = document.getElementById('unbalanced')!
const balancedEl = document.getElementById('balanced')!

headlines.forEach(text => {
  const prep = prepareWithSegments(text, font)
  const textWidth = maxWidth - padding

  // Get baseline line count
  let baseLineCount = 0
  walkLineRanges(prep, textWidth, () => { baseLineCount++ })

  // Binary search for balanced width
  let lo = 1, hi = textWidth
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

  // Get actual widest line at balanced width
  let balancedWidest = 0
  walkLineRanges(prep, lo, line => { if (line.width > balancedWidest) balancedWidest = line.width })
  const balancedWidth = Math.ceil(balancedWidest) + padding

  // Unbalanced card
  const unCard = document.createElement('div')
  unCard.className = 'text-card'
  unCard.style.maxWidth = maxWidth + 'px'
  unCard.innerHTML = `<p>${text}</p><div class="width-badge">${maxWidth}px</div>`

  // Show line width bars
  walkLineRanges(prep, textWidth, line => {
    const bar = document.createElement('div')
    bar.className = 'visual-bar unbalanced'
    bar.style.width = (line.width / textWidth * 100) + '%'
    unCard.appendChild(bar)
  })
  unbalancedEl.appendChild(unCard)

  // Balanced card
  const balCard = document.createElement('div')
  balCard.className = 'text-card'
  balCard.style.maxWidth = balancedWidth + 'px'
  balCard.innerHTML = `<p>${text}</p><div class="width-badge">${balancedWidth}px</div>`

  walkLineRanges(prep, lo, line => {
    const bar = document.createElement('div')
    bar.className = 'visual-bar balanced'
    bar.style.width = (line.width / lo * 100) + '%'
    balCard.appendChild(bar)
  })
  balancedEl.appendChild(balCard)
})
