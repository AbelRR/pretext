import { prepare, layout } from '../../../src/layout.ts'

const viewport = document.getElementById('viewport')!
const scrollContent = document.getElementById('scroll-content')!
const statsEl = document.getElementById('stats')!

const messages = [
  "Hey, are you coming to the meeting?",
  "I just pushed a fix for the login bug. It was a race condition in the session refresh.",
  "lol",
  "The quarterly report is due by Friday. Can you review the revenue section?",
  "Sure, I'll take a look this afternoon.",
  "AGI 春天到了. بدأت الرحلة 🚀",
  "Did you see the new design mockups? Header is too tall on mobile.",
  "k",
  "CI pipeline failing on arm64 again. Same OpenSSL issue.",
  "Can you pair on the recursive CTE query tomorrow?",
  "npm install",
  "WebSocket connections per tab are expensive — we should look at SSE.",
  "Sounds good 👍",
  "Dashboard needs to load under 2s on 3G. Chart library is the bottleneck.",
  "Meeting in 5",
  "Unicode normalization edge case affects notification dedup too.",
  "🎉🎉🎉",
  "Migration script needs to merge legacy and OAuth accounts.",
  "On my way",
  "Staging is down until 3pm EST for the permissions migration.",
]

const TOTAL_ITEMS = 100_000
const font = "14px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 20
const paddingV = 24
const borderBottom = 1

await document.fonts.ready

// Generate all item texts
const itemTexts: string[] = []
for (let i = 0; i < TOTAL_ITEMS; i++) {
  itemTexts.push(messages[i % messages.length])
}

// Pre-compute all heights with pretext
const startTime = performance.now()
const containerWidth = Math.min(600, window.innerWidth) - 64 // padding
const prepared = messages.map(m => prepare(m, font))
const heightCache = new Float32Array(TOTAL_ITEMS)
const offsets = new Float64Array(TOTAL_ITEMS + 1)

offsets[0] = 0
for (let i = 0; i < TOTAL_ITEMS; i++) {
  const p = prepared[i % messages.length]
  const result = layout(p, containerWidth, lineHeight)
  heightCache[i] = result.height + paddingV + borderBottom
  offsets[i + 1] = offsets[i] + heightCache[i]
}

const totalHeight = offsets[TOTAL_ITEMS]
const computeTime = performance.now() - startTime
statsEl.textContent = `${TOTAL_ITEMS.toLocaleString()} heights computed in ${computeTime.toFixed(0)}ms (${(computeTime / TOTAL_ITEMS * 1000).toFixed(1)}μs each) — Total: ${Math.round(totalHeight).toLocaleString()}px`

scrollContent.style.height = totalHeight + 'px'

// Virtual rendering
const BUFFER = 200
const itemPool: HTMLDivElement[] = []

function getItem(): HTMLDivElement {
  if (itemPool.length > 0) return itemPool.pop()!
  const div = document.createElement('div')
  div.className = 'item'
  scrollContent.appendChild(div)
  return div
}

let renderedItems = new Map<number, HTMLDivElement>()

function renderVisible() {
  const scrollTop = viewport.scrollTop
  const viewHeight = viewport.clientHeight

  // Binary search for first visible item
  let lo = 0, hi = TOTAL_ITEMS - 1
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (offsets[mid + 1] < scrollTop - BUFFER) lo = mid + 1
    else hi = mid
  }
  const firstVisible = lo

  // Find last visible
  let lastVisible = firstVisible
  while (lastVisible < TOTAL_ITEMS && offsets[lastVisible] < scrollTop + viewHeight + BUFFER) {
    lastVisible++
  }

  // Recycle items outside range
  for (const [idx, el] of renderedItems) {
    if (idx < firstVisible || idx >= lastVisible) {
      el.style.display = 'none'
      itemPool.push(el)
      renderedItems.delete(idx)
    }
  }

  // Render visible items
  for (let i = firstVisible; i < lastVisible; i++) {
    if (!renderedItems.has(i)) {
      const el = getItem()
      el.style.display = ''
      el.style.top = offsets[i] + 'px'
      el.style.height = heightCache[i] + 'px'
      el.innerHTML = `<div class="idx">#${i + 1}</div>${itemTexts[i]}`
      renderedItems.set(i, el)
    }
  }
}

viewport.addEventListener('scroll', renderVisible)
renderVisible()
