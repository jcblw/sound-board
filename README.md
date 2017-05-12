# Sound board

[![Greenkeeper badge](https://badges.greenkeeper.io/jcblw/sound-board.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/jcblw/sound-board.svg?branch=master)](https://travis-ci.org/jcblw/sound-board)

A simple abstraction around web audio apis to make interactions easier for loading files and playing them.

### Install

```shell
npm i sound-board --save
```

### Usage

#### Loading sound

```javascript
import soundBoard from 'sound-board'

soundBoard.downloadSound('waterbowl', 'http://example.com/waterbowl.mp3')
  .then(() => soundBoard.play('waterbowl'))
  .catch(err => console.error(err)) // if something happens on download

// or
soundBoard.loadSounds({
  waterbowl: 'http://example.com/waterbowl.mp3',
  gong: 'http://example.com/gong.mp3'
})
  .then(() => /* do stuff with sounds */)
  .catch(err => console.error(err)) // if something happens on a download

// or a local buffer
soundBoard.loadBuffer('chime', arrbuffer)
  .then(() => /* do stuff with sounds */)
  .catch(err => console.error(err)) // if something happens on a download
```

#### Playing sound

```javascript
// to play a sound at a certain time
soundBoard.play('waterbowl', 1.337) // starts at 1.337 seconds

// to pause the sound
soundBoard.pause('waterbowl')

// to stop the sound
soundBoard.stop('waterbowl')
```

#### Events

```javascript
soundBoard.on('play', (soundName) => {}) // when starting to play the sound
soundBoard.on('pause', (soundName) => {}) // when pausing the sound
soundBoard.on('end', (soundName) => {}) // when the sound ends
soundBoard.on('frequencyData', (soundName, bufferLength, dataArray) => {}) // some data when song is playing
```
