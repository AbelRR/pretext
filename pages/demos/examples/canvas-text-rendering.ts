import { prepareWithSegments, layoutWithLines, layout, prepare } from '../../../src/layout.ts'

const texts = [
  {
    label: 'English',
    text: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!',
    color: '#60a5fa',
  },
  {
    label: 'Chinese (Simplified)',
    text: '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。闰余成岁，律吕调阳。云腾致雨，露结为霜。',
    color: '#f472b6',
  },
  {
    label: 'Japanese',
    text: '吾輩は猫である。名前はまだ無い。どこで生れたかとんと見当がつかぬ。何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。',
    color: '#fb923c',
  },
  {
    label: 'Korean',
    text: '나는 나비로소이다. 청산이 그리워 왔더니, 푸른 하늘에 구름만 둥둥. 바람이 불어도 꽃잎은 떨어지지 않고, 세상은 아름답다.',
    color: '#a78bfa',
  },
  {
    label: 'Arabic (RTL)',
    text: 'في البدء كانت الكلمة، والكلمة كانت عند الله. وفي نهاية المطاف، كل شيء يعود إلى حيث بدأ. الحكمة ليست في المعرفة بل في فهم ما لا نعرفه.',
    color: '#34d399',
  },
  {
    label: 'Mixed + Emoji',
    text: 'AGI 春天到了 🌸 The journey begins بدأت الرحلة 🚀 AI가 세상을 바꾸다 🤖 テクノロジーの未来 ✨ Zukunft der Technologie 🌍',
    color: '#fbbf24',
  },
  {
    label: 'Thai',
    text: 'สวัสดีครับ ภาษาไทยเป็นภาษาที่สวยงามและมีเอกลักษณ์เฉพาะตัว การตัดคำในภาษาไทยเป็นเรื่องที่ซับซ้อน เพราะไม่มีช่องว่างระหว่างคำ',
    color: '#2dd4bf',
  },
  {
    label: 'Hindi (Devanagari)',
    text: 'भारत एक विशाल देश है जहाँ विविध भाषाएँ और संस्कृतियाँ एक साथ फलती-फूलती हैं। यहाँ की परंपराएँ सदियों पुरानी हैं और आधुनिकता के साथ चलती हैं।',
    color: '#fb7185',
  },
]

const font = "15px 'Helvetica Neue', Helvetica, Arial, sans-serif"
const lineHeight = 22
const padding = 14
const dpr = window.devicePixelRatio || 1

await document.fonts.ready

const prepared = texts.map(t => prepareWithSegments(t.text, font))
const preparedFast = texts.map(t => prepare(t.text, font))

function renderAll(containerWidth: number) {
  const grid = document.getElementById('grid')!
  grid.innerHTML = ''

  texts.forEach((t, i) => {
    const textWidth = containerWidth - padding * 2
    const result = layoutWithLines(prepared[i], textWidth, lineHeight)
    const canvasHeight = result.height + padding * 2

    const card = document.createElement('div')
    card.className = 'card'

    const header = document.createElement('div')
    header.className = 'card-header'
    header.innerHTML = `<span class="lang">${t.label}</span><span class="stats">${result.lineCount} lines, ${result.height}px height</span>`
    card.appendChild(header)

    const canvas = document.createElement('canvas')
    canvas.width = containerWidth * dpr
    canvas.height = canvasHeight * dpr
    canvas.style.width = containerWidth + 'px'
    canvas.style.height = canvasHeight + 'px'

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = '#0f1729'
    ctx.fillRect(0, 0, containerWidth, canvasHeight)

    // Render each line
    ctx.font = font
    ctx.fillStyle = t.color
    for (let j = 0; j < result.lines.length; j++) {
      const line = result.lines[j]
      ctx.fillText(line.text, padding, padding + j * lineHeight + 16)
    }

    // Subtle width indicator
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(padding + textWidth, padding)
    ctx.lineTo(padding + textWidth, canvasHeight - padding)
    ctx.stroke()
    ctx.setLineDash([])

    card.appendChild(canvas)
    grid.appendChild(card)
  })
}

const slider = document.getElementById('w-slider') as HTMLInputElement
const valEl = document.getElementById('w-val')!
slider.addEventListener('input', () => {
  const w = parseInt(slider.value)
  valEl.textContent = String(w)
  renderAll(w)
})

renderAll(340)
