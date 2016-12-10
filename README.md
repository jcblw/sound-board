# Sound board

A simple abstraction around web audio apis to make interactions easier for loading files and playing them.

### Install

```shell
npm i sound-board
```

### Usage

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
```
