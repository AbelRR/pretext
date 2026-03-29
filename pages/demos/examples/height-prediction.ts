import { prepare, layout } from '../../../src/layout.ts'

const messages = [
  "Hey, are you coming to the meeting?",
  "I just pushed a fix for the login bug. It was a race condition in the session refresh — the token was expiring between the preflight check and the actual request.",
  "lol",
  "The quarterly report is due by Friday. Can you review the revenue section and make sure the YoY comparisons match what finance sent over? I think there might be a discrepancy in Q2.",
  "Sure, I'll take a look this afternoon and ping you if anything looks off.",
  "AGI 春天到了. بدأت الرحلة 🚀",
  "Did you see the new design mockups? The header is way too tall on mobile — it takes up half the viewport. We should cap it at 64px and move the nav into a hamburger menu.",
  "k",
  "The CI pipeline is failing on the arm64 builds again. I think it's the same OpenSSL linking issue we hit last month. The workaround was to pin openssl@1.1 but that got removed from the Dockerfile during the cleanup.",
  "Can you pair on this tomorrow? I'm stuck on the recursive CTE query for the org hierarchy. It works for 3 levels but blows up at 4+ because of the circular reference detection.",
  "npm install",
  "I've been thinking about the architecture for the real-time features. WebSocket connections per tab are expensive — maybe we should look at SSE with a shared worker, or even long-polling with smart reconnection. The current setup won't scale past 10k concurrent users.",
  "Sounds good 👍",
  "The client wants the dashboard to load in under 2 seconds on 3G. Right now we're at 4.7s because of the chart library. We could lazy-load the charts below the fold and use skeleton screens, or switch to a lighter charting solution entirely.",
  "Meeting in 5",
  "Remember that edge case with Unicode normalization we discussed? Turns out it affects more than just search — the notification dedup logic was also comparing raw bytes instead of normalized forms, which is why some users were getting duplicate alerts.",
  "🎉🎉🎉",
  "The migration script needs to handle the case where a user has both a legacy account and a new OAuth account. We need to merge their data without losing any saved preferences, and the conflict resolution for overlapping settings is non-trivial.",
  "On my way",
  "Just a heads up — the staging environment is down for maintenance until 3pm EST. The database migration for the new permissions model takes about 2 hours and we can't run it without exclusive access.",
]

const font = "15px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 22
const paddingV = 24 // 12px top + 12px bottom
const borderBottom = 1

// Wait for fonts to load
await document.fonts.ready

// Prepare all texts with pretext
const prepared = messages.map(msg => prepare(msg, font))

function renderPanel(viewportId: string, statsId: string, getHeight: (i: number, containerWidth: number) => number) {
  const viewport = document.getElementById(viewportId)!
  const statsEl = document.getElementById(statsId)!

  // Measure actual DOM heights for comparison
  const actualHeights: number[] = []
  const predictedHeights: number[] = []

  messages.forEach((msg, i) => {
    const div = document.createElement('div')
    div.className = 'item'
    div.textContent = msg
    viewport.appendChild(div)
  })

  // After render, measure actual heights
  requestAnimationFrame(() => {
    let totalError = 0
    const items = viewport.querySelectorAll('.item')
    items.forEach((item, i) => {
      const actual = item.getBoundingClientRect().height
      actualHeights.push(actual)
      const predicted = getHeight(i, viewport.clientWidth)
      predictedHeights.push(predicted)
      totalError += Math.abs(actual - predicted)
    })

    const totalPredicted = predictedHeights.reduce((a, b) => a + b, 0)
    const totalActual = actualHeights.reduce((a, b) => a + b, 0)

    statsEl.innerHTML = `
      <span class="label">Total predicted:</span> <span class="value">${totalPredicted.toFixed(0)}px</span> &nbsp;
      <span class="label">Total actual:</span> <span class="value">${totalActual.toFixed(0)}px</span><br>
      <span class="label">Total error:</span> <span class="${totalError < 5 ? 'value' : 'highlight'}">${totalError.toFixed(1)}px</span> &nbsp;
      <span class="label">Avg error/item:</span> <span class="${totalError/messages.length < 1 ? 'value' : 'highlight'}">${(totalError / messages.length).toFixed(2)}px</span>
    `
  })
}

// Naive: assume 44px per item
renderPanel('naive-viewport', 'naive-stats', (i, containerWidth) => 44)

// Pretext: predict exact height
renderPanel('pretext-viewport', 'pretext-stats', (i, containerWidth) => {
  const textWidth = containerWidth - 32 // subtract horizontal padding
  const result = layout(prepared[i], textWidth, lineHeight)
  return result.height + paddingV + borderBottom
})
