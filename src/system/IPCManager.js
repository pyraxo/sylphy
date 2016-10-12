const EventEmitter = require('eventemitter3')
const logger = require('winston')

class IPCManager extends EventEmitter {
  constructor (shardID = 0) {
    super()

    this.id = shardID
    this.pid = process.pid

    process.on('message', this.onMessage.bind(this))
  }

  send (event, data) {
    process.send({
      op: event,
      d: data
    })
  }

  onMessage (message) {
    if (!message.op) {
      return logger.warn('Received IPC message with no op.')
    }

    if (['resp', 'broadcast'].includes(message.op)) return

    if (this[message.op]) {
      return this[message.op](message)
    }

    this.emit(message.op, message.d)
  }

  awaitResponse (op, d) {
    return new Promise((resolve, reject) => {
      const awaitListener = (msg) => {
        if (!['resp', 'error'].includes(msg.op)) return
        if (msg.op === 'resp') return resolve(msg.d)
        if (msg.op === 'error') return reject(msg.d)
      }

      const payload = { op: op }
      if (d) payload.d = d

      process.once('message', awaitListener)
      process.send(payload)

      setTimeout(() => {
        process.removeListener('message', awaitListener)
        return reject('IPC Timed out.')
      }, 1000)
    })
  }
}

module.exports = IPCManager
