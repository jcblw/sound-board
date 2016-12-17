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
    const sb = new SoundBoard({AudioContext})
    t.is(typeof sb.getFrequencyData, 'function', 'getFrequencyData is a function')
    t.is(typeof sb.getFrequencyData(), 'function', 'getFrequencyData returns a function')
  }
)
