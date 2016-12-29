
class AudioContext {
  createBufferSource () {
    return {
      start () {},
      stop () {},
      connect () {}
    }
  }
  createAnalyser () {
    return {
      frequencyBinCount: 0,
      disconnect () {},
      connect () {},
      getByteTimeDomainData () {}
    }
  }
}

module.exports = AudioContext
