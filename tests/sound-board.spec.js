import test from 'ava'
import soundBoard, {SoundBoard} from '../dist/sound-board'
import AudioContext from './fixtures/audio-context'

const MAX_TIMEOUT = 9999999

test(
  'exported values',
  t => {
    t.plan(3)
    t.is(typeof soundBoard, 'object', 'soundBoard is an object')
    t.is(typeof SoundBoard, 'function', 'SoundBoard is a function')
    t.true(soundBoard instanceof SoundBoard, 'soundBoard (main export) is an instance of SoundBoard')
  }
)

test(
  'initizing Soundboard',
  t => {
    t.false(soundBoard.isSupported, 'soundBoard is not supported on a node env')
    t.is(soundBoard.freqDurationTimeout, 0, 'default for freqDurationTimeout is 0')
    t.deepEqual(soundBoard.localSoundBuffers, {}, 'a localSoundBuffers object is created')
    const sb = new SoundBoard({AudioContext})
    t.true(sb.isSupported, 'soundBoard is supported when passed a shim for AudioContext')
    t.true(sb.audioContext instanceof AudioContext, 'new instance of AudioContext is created')
  }
)

test(
  'SoundBoard::getFrequencyData',
  t => {
    t.plan(7)
    // freqDurationTimeout is long so we can easily cancel it
    const sb = new SoundBoard({AudioContext, freqDurationTimeout: MAX_TIMEOUT})
    sb.on('frequencyData', (key, frequencyBinCount, dataArray) => {
      t.is(key, 'bar')
      t.is(frequencyBinCount, 0)
      t.true(dataArray instanceof Uint8Array)
    })

    t.is(typeof sb.getFrequencyData, 'function', 'getFrequencyData is a function')
    t.is(typeof sb.getFrequencyData(), 'function', 'getFrequencyData returns a function')

    const foo = sb.getFrequencyData({playing: false})
    t.is(foo(), undefined, 'getFrequencyData return function returns undefined when playing false is passed as the first param')

    const analyser = (new AudioContext()).createAnalyser()
    const soundMeta = {playing: true, key: 'bar'}
    const bar = sb.getFrequencyData(soundMeta, analyser)
    // now should trigger event binding to 'frequencyData'
    t.is(bar(), undefined, 'getFrequencyData return function returns undefined when playing true is passed as the first param')
    clearTimeout(soundMeta.timeout)
  }
)

// TODO: split apart
test(
  'SoundBoard::play',
  t => {
    t.plan(16)
    // start mocking audioContext
    const sbUnsupported = new SoundBoard()
    const sb = new SoundBoard({
      AudioContext: AudioContext.of({
        connectCA: () => t.pass('connect from the analyser is called'),
        connectCBS: () => t.pass('connect from the buffer source is called'),
        start: () => t.pass('start from the buffer source is called'),
        getByteTimeDomainData: () => t.pass('getByteTimeDomainData from the analyser is called')
      }),
      freqDurationTimeout: MAX_TIMEOUT
    })
    // mock up a loaded sound
    const soundMeta = {
      currentTime: 10,
      buffer: 'baz'
    }
    sb.localSoundBuffers['foo'] = soundMeta
    sb.on('play', (key, source) => {
      t.is(key, 'foo', 'the correct sound key is emitted to the play event')
      t.true(source.isMock, 'a mock source is emitted to the play event')
      // pull out more info from source
    })

    // unsupported
    t.false(sbUnsupported.isSupported, false)
    t.is(sbUnsupported.play('foo'), undefined, 'an unsupported instance of SoundBoard when played does nothing')

    // bad sound
    t.is(sb.play('bar'), undefined, 'calling play with a unload sound returns undefined')

    // happy path
    t.is(sb.play('foo'), undefined, 'calling play with valid sound will return undefined')
    t.truthy(soundMeta.source, 'the soundMeta for the sound "foo" now has a source attached')
    t.is(soundMeta.source.buffer, 'baz', 'the correct buffer is applied to the source')
    t.is(soundMeta.currentTime, 10, 'the correct current time is set on the soundMeta')
    t.true(soundMeta.playing, 'the playing key is set to true on the sound meta to indicate it has started playing')
    t.truthy(soundMeta.audioAnalyser, 'the soundMeta for the sound "foo" now has an audioAnalyser attached to it')
    t.true(soundMeta.audioAnalyser.isMock, 'the soundMeta audioAnalyser is the mocked analyser')
  }
)

test(
  'SoundBoard::pause',
  t => {
    t.plan(5)
    const sb = new SoundBoard({
      AudioContext: AudioContext.of({
        disconnect: () => t.pass('disconnect from the analyser is called'),
        stop: () => t.pass('stop from the buffer source is called')
      })
    })
    // mock up a loaded sound
    const soundMeta = {
      currentTime: 10,
      audioAnalyser: sb.audioContext.createAnalyser(),
      source: sb.audioContext.createBufferSource()
    }
    sb.localSoundBuffers['foo'] = soundMeta
    sb.on('pause', (key) => {
      t.is(key, 'foo', 'the correct sound key is emitted to the end event')
    })
    t.is(sb.pause('foo'), undefined, 'calling pause will return undefined')
    t.is(soundMeta.playing, false, 'the playing key on the sounds meta data is set to false')
  }
)

test(
  'SoundBoard::setCurrentTime',
  t => {
    const sb = new SoundBoard()
    sb.localSoundBuffers.foo = {}
    sb.setCurrentTime('foo', 2)
    t.is(sb.getCurrentTime('foo'), 2, 'The correct time is set in the meta data')

    // playing test
    sb.localSoundBuffers.bar = {playing: true}
    sb.setCurrentTime('bar', 2)
    sb.localSoundBuffers.bar = false // to get back clean value
    t.is(sb.getCurrentTime('bar'), undefined, 'The correct time is not set in the meta data when sound is playing')
  }
)
