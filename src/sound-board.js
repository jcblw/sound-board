import {EventEmitter2} from 'eventemitter2'

const browserWindow = typeof window === 'object'
  ? window
  : {}
const {
  AudioContext,
  XMLHttpRequest,
  requestAnimationFrame
} = browserWindow
const NOT_SUPPORTED = methodName =>
  new Error(`Soundboard cannot call ${methodName} because your current enviroment does not support web audio`)

class SoundBoard extends EventEmitter2 {
  constructor (options = {}) {
    super()
    this.localSoundBuffers = {}
    this.downloadSound = this.downloadSound.bind(this)
    this.getFrequencyData = this.getFrequencyData.bind(this)
    this.freqDurationTimeout = options.freqDurationTimeout || 0
    this.isSupported = !!AudioContext
    try {
      this.audioContext = this.isSupported ? new AudioContext() : null
      this.audioAnalyser = this.audioContext.createAnalyser()
    } catch (e) {
      this.isSupported = false
      this.audioContext = null
    }
  }

  getFrequencyData () {
    this.frequencyTimeout = setTimeout(
      () => requestAnimationFrame(this.getFrequencyData)
    , this.freqDurationTimeout)
    const bufferLength = this.audioAnalyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.audioAnalyser.getByteTimeDomainData(dataArray)
    this.emit('frequencyData', bufferLength, dataArray)
  }

  play (sound, ...audioPref) {
    if (!this.isSupported) return

    const buffer = this.localSoundBuffers[sound]
    if (!buffer) return

    const source = this.audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(this.audioContext.destination)
    source.connect(this.audioAnalyser)
    source.onended = () => {
      clearTimeout(this.frequencyTimeout)
      setTimeout(() => {
        this.emit('end', sound)
      }, 0)
    }
    this.emit('start', sound, source)
    source.start(...audioPref)
    this.getFrequencyData()
  }

  downloadSound (assignment, url) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) return reject(NOT_SUPPORTED('downloadSound'))

      const request = new XMLHttpRequest()
      request.open('GET', url, true)
      request.responseType = 'arraybuffer'

      // TODO: add in progress to send back rich
      // meta about audio file loading
      request.onload = () => {
        if (request.status < 399) {
          this.audioContext.decodeAudioData(request.response, (buffer) => {
            this.localSoundBuffers[assignment] = buffer
            resolve(buffer)
          }, reject)
        } else {
          reject(request.response)
        }
      }
      request.onerror = reject
      request.send()
    })
  }

  loadSounds (sounds) {
    const downloadSound = this.downloadSound
    const downloadingSounds = Object.keys(sounds)
      .map(assignment => downloadSound(assignment, sounds[assignment]))
    return Promise.all(downloadingSounds)
  }

}

module.exports = new SoundBoard()
module.exports.SoundBoard = SoundBoard
