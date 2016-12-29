import test from 'ava'
import soundBoard, {SoundBoard} from '../dist/sound-board'
import AudioContext from './fixtures/audio-context'

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
    const sb = new SoundBoard({AudioContext, freqDurationTimeout: 9999999})
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
