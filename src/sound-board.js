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
const ts = () => +(new Date())
const toSeconds = tsp => tsp * 0.001
const currentTime = tsp => toSeconds(ts()) - toSeconds(tsp)

class SoundBoard extends EventEmitter2 {
  constructor (options = {}) {
    super()
    this.localSoundBuffers = {}
    this.downloadSound = this.downloadSound.bind(this)
    this.getFrequencyData = this.getFrequencyData.bind(this)
    this.freqDurationTimeout = options.freqDurationTimeout || 0
    this.isSupported = !!AudioContext || !!options.AudioContext

    const Context = AudioContext || options.AudioContext

    try {
      this.audioContext = this.isSupported ? new Context() : null
    } catch (e) {
      this.isSupported = false
      this.audioContext = null
    }
  }

  getFrequencyData (soundMeta, audioAnalyser) {
    return () => {
      if (!soundMeta.playing) return
      soundMeta.timeout = setTimeout(() => requestAnimationFrame(
        this.getFrequencyData(soundMeta, audioAnalyser)
      ), this.freqDurationTimeout)
      const bufferLength = audioAnalyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      audioAnalyser.getByteTimeDomainData(dataArray)
      this.emit('frequencyData', soundMeta.key, bufferLength, dataArray)
    }
  }

  play (sound, currentTime, ...audioPref) {
    if (!this.isSupported) return

    const soundMeta = this.localSoundBuffers[sound]
    if (!soundMeta) return

    const source = this.audioContext.createBufferSource()
    const audioAnalyser = this.audioContext.createAnalyser()
    const {buffer} = soundMeta
    soundMeta.playTS = ts()
    soundMeta.source = source
    soundMeta.currentTime = currentTime || soundMeta.currentTime || 0
    soundMeta.playing = true
    soundMeta.audioAnalyser = audioAnalyser
    source.buffer = buffer
    source.connect(audioAnalyser)
    audioAnalyser.connect(this.audioContext.destination)
    source.onended = () => this.stop(sound)
    this.emit('play', sound, source)
    source.start(0, soundMeta.currentTime, ...audioPref)
    this.getFrequencyData(soundMeta, audioAnalyser)()
  }

  pause (sound) {
    const soundMeta = this.localSoundBuffers[sound]
    const {source, audioAnalyser} = soundMeta
    soundMeta.currentTime = soundMeta.currentTime + currentTime(soundMeta.playTS)
    soundMeta.playing = false
    source.stop()
    audioAnalyser.disconnect()
    this.emit('pause', sound, source)
  }

  stop (sound) {
    const soundMeta = this.localSoundBuffers[sound]
    const {audioAnalyser} = soundMeta
    clearTimeout(soundMeta.timeout)
    soundMeta.currentTime = 0 // reset time
    soundMeta.playing = false
    audioAnalyser.disconnect()
    setTimeout(() => this.emit('end', sound), 0)
  }

  getCurrentTime (sound) {
    const soundMeta = this.localSoundBuffers[sound]
    if (!soundMeta.playing) {
      return soundMeta.currentTime
    }
    return soundMeta.currentTime + currentTime(soundMeta.playTS)
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
            this.localSoundBuffers[assignment] = {buffer, key: assignment}
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
