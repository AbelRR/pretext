import { prepare, layout } from '../../../src/layout.ts'

const sampleTexts = [
  "Quick status update on the deployment",
  "I just pushed a fix for the login bug. It was a race condition in the session refresh — the token was expiring between the preflight check and the actual request. Should be good now.",
  "lol",
  "The quarterly report is due by Friday. Can you review the revenue section and make sure the YoY comparisons match what finance sent over?",
  "AGI 春天到了. بدأت الرحلة 🚀",
  "Did you see the new design mockups? The header is way too tall on mobile — it takes up half the viewport. We should cap it at 64px and move the nav into a hamburger menu. Also the color contrast on the secondary buttons doesn't meet WCAG AA.",
  "k",
  "The CI pipeline is failing again. I think it's the same OpenSSL linking issue.",
  "Meeting in 5",
  "Remember that edge case with Unicode normalization we discussed? Turns out it affects more than just search — the notification dedup logic was also comparing raw bytes instead of normalized forms.",
]

// Generate 500 texts by cycling through samples
const texts: string[] = []
for (let i = 0; i < 500; i++) {
  texts.push(sampleTexts[i % sampleTexts.length])
}

const font = "15px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 22
const widths = [250, 300, 350, 400, 450] // simulate 5 resize widths

await document.fonts.ready

const statusEl = document.getElementById('status')!
const resultsEl = document.getElementById('results')!

// Prepare texts with pretext (one-time cost)
statusEl.textContent = 'Preparing texts...'
const prepareStart = performance.now()
const prepared = texts.map(t => prepare(t, font))
const prepareTime = performance.now() - prepareStart

// Create hidden DOM elements for DOM measurement
const hiddenBench = document.getElementById('hidden-bench')!
const domItems = texts.map(t => {
  const div = document.createElement('div')
  div.className = 'item'
  div.textContent = t
  hiddenBench.appendChild(div)
  return div
})

statusEl.textContent = 'Ready. Click a button to benchmark.'

function benchPretext() {
  const heights = new Float64Array(texts.length)
  const start = performance.now()
  for (const w of widths) {
    for (let i = 0; i < prepared.length; i++) {
      heights[i] = layout(prepared[i], w, lineHeight).height
    }
  }
  const elapsed = performance.now() - start
  return { elapsed, resizes: widths.length, perResize: elapsed / widths.length, total: texts.length * widths.length }
}

function benchDOM() {
  const heights = new Float64Array(texts.length)
  const start = performance.now()
  for (const w of widths) {
    ;(hiddenBench as HTMLElement).style.width = w + 'px'
    for (let i = 0; i < domItems.length; i++) {
      domItems[i].style.width = w + 'px'
      heights[i] = domItems[i].offsetHeight
    }
  }
  const elapsed = performance.now() - start
  return { elapsed, resizes: widths.length, perResize: elapsed / widths.length, total: texts.length * widths.length }
}

type BenchResult = { elapsed: number; resizes: number; perResize: number; total: number }

function showResults(pretextResult: BenchResult | null, domResult: BenchResult | null) {
  let html = ''

  if (pretextResult) {
    html += `
      <div class="result-card">
        <div class="result-title pretext">Pretext layout()</div>
        <div class="metric"><span class="label">Total (${pretextResult.resizes} widths x ${texts.length} texts):</span><span class="value fast">${pretextResult.elapsed.toFixed(2)}ms</span></div>
        <div class="metric"><span class="label">Per resize (${texts.length} texts):</span><span class="value fast">${pretextResult.perResize.toFixed(2)}ms</span></div>
        <div class="metric"><span class="label">Per text per resize:</span><span class="value fast">${(pretextResult.elapsed / pretextResult.total * 1000).toFixed(1)}us</span></div>
        <div class="metric"><span class="label">One-time prepare() cost:</span><span class="value">${prepareTime.toFixed(1)}ms</span></div>
      </div>
    `
  }

  if (domResult) {
    html += `
      <div class="result-card">
        <div class="result-title dom">DOM offsetHeight</div>
        <div class="metric"><span class="label">Total (${domResult.resizes} widths x ${texts.length} texts):</span><span class="value slow">${domResult.elapsed.toFixed(2)}ms</span></div>
        <div class="metric"><span class="label">Per resize (${texts.length} texts):</span><span class="value slow">${domResult.perResize.toFixed(2)}ms</span></div>
        <div class="metric"><span class="label">Per text per resize:</span><span class="value slow">${(domResult.elapsed / domResult.total * 1000).toFixed(1)}us</span></div>
      </div>
    `
  }

  if (pretextResult && domResult) {
    const speedup = domResult.elapsed / pretextResult.elapsed
    const maxBar = Math.max(pretextResult.elapsed, domResult.elapsed)
    html += `
      <div class="speedup">Pretext is ${speedup.toFixed(0)}x faster per resize</div>
      <div class="bar-container">
        <div class="bar-row">
          <span class="bar-label">Pretext</span>
          <div class="bar pretext" style="width: ${Math.max(2, pretextResult.elapsed / maxBar * 500)}px">${pretextResult.elapsed.toFixed(1)}ms</div>
        </div>
        <div class="bar-row">
          <span class="bar-label">DOM</span>
          <div class="bar dom" style="width: ${Math.max(2, domResult.elapsed / maxBar * 500)}px">${domResult.elapsed.toFixed(1)}ms</div>
        </div>
      </div>
    `
  }

  resultsEl.innerHTML = html
}

document.getElementById('run-pretext')!.addEventListener('click', () => {
  statusEl.textContent = 'Running pretext benchmark...'
  requestAnimationFrame(() => {
    const result = benchPretext()
    showResults(result, null)
    statusEl.textContent = 'Done.'
  })
})

document.getElementById('run-dom')!.addEventListener('click', () => {
  statusEl.textContent = 'Running DOM benchmark...'
  requestAnimationFrame(() => {
    const result = benchDOM()
    showResults(null, result)
    statusEl.textContent = 'Done.'
  })
})

document.getElementById('run-both')!.addEventListener('click', () => {
  statusEl.textContent = 'Running both benchmarks...'
  requestAnimationFrame(() => {
    const pretextResult = benchPretext()
    const domResult = benchDOM()
    showResults(pretextResult, domResult)
    statusEl.textContent = 'Done.'
  })
})
