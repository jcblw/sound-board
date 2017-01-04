import browserWindow from './window'
const {XMLHttpRequest} = browserWindow

export default url => {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('GET', url, true)
    request.responseType = 'arraybuffer'

    // TODO: add in progress
    request.onload = () => {
      if (request.status < 399) {
        resolve(request.response)
      } else {
        reject(request.response)
      }
    }
    request.onerror = reject
    request.send()
  })
}
