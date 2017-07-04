import { EventEmitter2 } from 'eventemitter2'

const browserWindow = typeof window === 'object' ? window : {}
const { AudioContext, XMLHttpRequest, requestAnimationFrame } = browserWindow
const NOT_SUPPORTED = methodName =>
  new Error(
    `Soundboard cannot call ${methodName} because your current enviroment does not support web audio`
  )
const ts = () => +new Date()
const toSeconds = tsp => tsp * 0.001
const currentTime = tsp => toSeconds(ts()) - toSeconds(tsp)

class SoundBoard extends EventEmitter2 {
  constructor(options = {}) {
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

  getFrequencyData(soundMeta, audioAnalyser) {
    return () => {
      if (!soundMeta.playing) return
      soundMeta.timeout = setTimeout(
        () =>
          requestAnimationFrame(
            this.getFrequencyData(soundMeta, audioAnalyser)
          ),
        this.freqDurationTimeout
      )
      const bufferLength = audioAnalyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      audioAnalyser.getByteTimeDomainData(dataArray)
      this.emit('frequencyData', soundMeta.key, bufferLength, dataArray)
    }
  }

  playBuffer(sound, soundMeta, currentTime, ...audioPref) {
    const source = this.audioContext.createBufferSource()
    const audioAnalyser = this.audioContext.createAnalyser()
    const { buffer } = soundMeta
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

  playStream(sound, soundMeta, shouldOutput = true) {
    const { stream } = soundMeta
    const source = this.audioContext.createMediaStreamSource(stream)
    const audioAnalyser = this.audioContext.createAnalyser()
    audioAnalyser.smoothingTimeConstant = 0.2
    audioAnalyser.fftSize = 1024
    soundMeta.playTS = ts()
    soundMeta.source = source
    soundMeta.currentTime = currentTime || soundMeta.currentTime || 0
    soundMeta.playing = true
    soundMeta.audioAnalyser = audioAnalyser
    source.connect(audioAnalyser)
    if (shouldOutput) {
      audioAnalyser.connect(this.audioContext.destination)
    }
    source.onended = () => this.stop(sound)
    this.emit('play', sound, source)
    this.getFrequencyData(soundMeta, audioAnalyser)()
  }

  play(sound, ...args) {
    if (!this.isSupported) return
    const soundMeta = this.localSoundBuffers[sound]
    if (!soundMeta) return
    const hasBuffer = !!soundMeta.buffer
    const isStream = !!soundMeta.stream
    if (hasBuffer) {
      return this.playBuffer(sound, soundMeta, ...args)
    }
    if (isStream) {
      return this.playStream(sound, soundMeta, ...args)
    }
  }

  pause(sound) {
    const soundMeta = this.localSoundBuffers[sound]
    const { source, audioAnalyser } = soundMeta
    soundMeta.currentTime =
      soundMeta.currentTime + currentTime(soundMeta.playTS)
    soundMeta.playing = false
    source.stop()
    audioAnalyser.disconnect()
    this.emit('pause', sound, source)
  }

  stop(sound) {
    const soundMeta = this.localSoundBuffers[sound]
    const { audioAnalyser } = soundMeta
    clearTimeout(soundMeta.timeout)
    soundMeta.currentTime = 0 // reset time
    soundMeta.playing = false
    audioAnalyser.disconnect()
    setTimeout(() => this.emit('end', sound), 0)
  }

  getCurrentTime(sound) {
    const soundMeta = this.localSoundBuffers[sound]
    if (!soundMeta.playing) {
      return soundMeta.currentTime
    }
    return soundMeta.currentTime + currentTime(soundMeta.playTS)
  }

  setCurrentTime(sound, time) {
    const soundMeta = this.localSoundBuffers[sound]
    if (!soundMeta || soundMeta.playing) return // do not set running time
    soundMeta.currentTime = time
  }

  downloadSound(assignment, url) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) return reject(NOT_SUPPORTED('downloadSound'))

      const request = new XMLHttpRequest()
      request.open('GET', url, true)
      request.responseType = 'arraybuffer'

      // TODO: add in progress to send back rich
      // meta about audio file loading
      request.onload = () => {
        if (request.status < 399) {
          this.audioContext.decodeAudioData(
            request.response,
            buffer => {
              this.localSoundBuffers[assignment] = { buffer, key: assignment }
              resolve(buffer)
            },
            reject
          )
        } else {
          reject(request.response)
        }
      }
      request.onerror = reject
      request.send()
    })
  }

  loadSounds(sounds) {
    const downloadSound = this.downloadSound
    const downloadingSounds = Object.keys(sounds).map(assignment =>
      downloadSound(assignment, sounds[assignment])
    )
    return Promise.all(downloadingSounds)
  }

  loadBuffer(key, arrbuffer) {
    return new Promise((resolve, reject) => {
      this.audioContext.decodeAudioData(
        arrbuffer,
        buffer => {
          this.localSoundBuffers[key] = { buffer, key }
          resolve(buffer)
        },
        reject
      )
    })
  }

  loadStream(key, stream) {
    return new Promise((resolve, reject) => {
      this.localSoundBuffers[key] = { stream, key }
      resolve(stream)
    })
  }
}

module.exports = new SoundBoard()
module.exports.SoundBoard = SoundBoard
