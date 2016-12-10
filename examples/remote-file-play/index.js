const soundBoard = require('../../dist/sound-board')
const fullWave = []

soundBoard.downloadSound(
  'coin',
  './coin.mp3'
)
  .then(() =>
    soundBoard.play('coin')
  )

soundBoard.on('start', (name, source) => {
  console.log(`started ${name}`)
  setTimeout(() => {
    source.stop()
  }, 5000)
})

soundBoard.on('frequencyData', (bufferLength, dataArray) => {
  const data = []
  const sliceWidth = 100 * 1.0 / bufferLength
  let x = 0
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0
    const y = v * 100 / 2
    data.push([x, y])
    x += sliceWidth
  }
  fullWave.push(data)
  const el = document.getElementById('freq')
  el.innerHTML = ''
  data.forEach(point => createElement(point, el))
})

soundBoard.on('end', (name) => {
  console.log(`ended ${name}`)
  const el = document.getElementById('freq')
  el.innerHTML = ''
  fullWave.map((data, i) => {
    const offset = i * 100
    const offsetData = data.map(([x, y]) => [x + offset, y])
    offsetData.forEach(point => createElement(point, el))
  })
})

function createElement ([x, y], container) {
  const el = document.createElement('div')
  el.style.position = 'absolute'
  el.style.top = `${y}px`
  el.style.left = `${x}px`
  el.style.width = '1px'
  el.style.height = '1px'
  el.style.backgroundColor = '#000'
  container.appendChild(el)
}
