
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
      disconnect () {},
      connect () {},
      getByteTimeDomainData () {}
    }
  }
}

module.exports = AudioContext
