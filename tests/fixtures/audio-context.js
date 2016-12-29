
const bubble = (context = {}) => (method) => (...args) => {
  if (context[method]) context[method](...args)
}

class AudioContext {
  constructor (options) {
    this.options = options
    // consider a way to use Object.assign rather then monkey patch
    this.mock = bubble(this.options)
  }

  createBufferSource () {
    return {
      isMock: true,
      start: this.mock('start'),
      stop: this.mock('stop'),
      connect: this.mock('connectCBS')
    }
  }
  createAnalyser () {
    return {
      isMock: true,
      frequencyBinCount: 0,
      disconnect: this.mock('disconnect'),
      connect: this.mock('connectCA'),
      getByteTimeDomainData: this.mock('getByteTimeDomainData')
    }
  }
}

module.exports = AudioContext
module.exports.of = options => {
  return function () {
    return new AudioContext(options)
  }
}
