import { prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'

const wordEl = document.getElementById('word')!
const contextEl = document.getElementById('context')!
const progressEl = document.getElementById('progress')!
const playBtn = document.getElementById('play-btn')!
const wpmSlider = document.getElementById('wpm-slider') as HTMLInputElement
const wpmLabel = document.getElementById('wpm-label')!

const text = `The web has a dirty secret. It cannot measure text without rendering it. Every time you call getBoundingClientRect or read offsetHeight, the browser must lay out the entire document. This is called a reflow, and it is one of the most expensive operations a browser performs. For most of the web's history, this was an acceptable cost. Pages were simple. Text was static. But modern web applications are different. A chat app might display thousands of messages. A virtualized list needs to know the height of every item before it is rendered. A design tool needs to predict where text will wrap at any width, in any language, in real time. The conventional approach is to guess. Virtual list libraries estimate item heights, then correct them after rendering. This causes layout shift. The content jumps as the browser discovers the estimates were wrong. Users notice. It feels broken. What if you could know the exact height of a paragraph, in any font, at any width, without touching the DOM at all? What if text measurement took microseconds instead of milliseconds? This is what Pretext does. It uses the browser's own canvas measureText API to measure individual word segments, caches the results, then does pure arithmetic to compute line breaks and heights. The prepare step is a one-time cost. After that, layout is essentially free.`

const font = "16px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 24

await document.fonts.ready

// Use pretext to split into line-aware chunks
const prepared = prepareWithSegments(text, font)
const result = layoutWithLines(prepared, 500, lineHeight)
const lineTexts = result.lines.map(l => l.text.trim())

// Split lines into words
const allWords: { word: string; lineIdx: number }[] = []
lineTexts.forEach((line, lineIdx) => {
  line.split(/\s+/).forEach(word => {
    if (word) allWords.push({ word, lineIdx })
  })
})

let playing = false
let currentIdx = 0
let wpm = 300
let timer: ReturnType<typeof setTimeout> | null = null

function showWord() {
  if (currentIdx >= allWords.length) {
    playing = false
    playBtn.textContent = 'Restart'
    playBtn.classList.remove('active')
    wordEl.textContent = '✓'
    return
  }

  const entry = allWords[currentIdx]
  wordEl.textContent = entry.word

  // Show surrounding context (the line this word belongs to)
  contextEl.textContent = lineTexts[entry.lineIdx]

  // Progress
  const pct = (currentIdx / allWords.length) * 100
  progressEl.style.width = pct + '%'

  // Highlight the focus letter (slightly left of center for better RSVP)
  const focusIdx = Math.min(Math.floor(entry.word.length * 0.35), entry.word.length - 1)
  const before = entry.word.slice(0, focusIdx)
  const focus = entry.word[focusIdx]
  const after = entry.word.slice(focusIdx + 1)
  wordEl.innerHTML = `<span style="color:#64748b">${before}</span><span style="color:#ff6b6b">${focus}</span><span style="color:#64748b">${after}</span>`

  currentIdx++

  if (playing) {
    const delay = 60000 / wpm
    timer = setTimeout(showWord, delay)
  }
}

playBtn.addEventListener('click', () => {
  if (currentIdx >= allWords.length) {
    currentIdx = 0
    progressEl.style.width = '0%'
  }
  playing = !playing
  playBtn.textContent = playing ? 'Pause' : 'Play'
  playBtn.classList.toggle('active', playing)
  if (playing) showWord()
  else if (timer) clearTimeout(timer)
})

wpmSlider.addEventListener('input', () => {
  wpm = parseInt(wpmSlider.value)
  wpmLabel.textContent = wpm + ' WPM'
})

wordEl.textContent = 'Press Play'
contextEl.textContent = `${allWords.length} words · ${lineTexts.length} lines (pretext-measured)`
