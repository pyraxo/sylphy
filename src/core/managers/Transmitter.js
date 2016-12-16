const EventEmitter = require('eventemitter3')
const logger = require('winston')
const crypto = require('crypto')

class Transmitter extends EventEmitter {
  constructor (shardID = 0, bot) {
    super()

    this.ids = Array.isArray(shardID) ? shardID : [shardID]
    this.pid = process.pid
    this.commands = new Map()
    this._bot = bot

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
      return logger.warn('Received IPC message with no op')
    }

    if (['resp', 'broadcast'].includes(message.op)) return

    if (this[message.op]) {
      return this[message.op](message)
    }

    const command = this.commands.get(message.op)
    if (command) {
      return command(message, this._bot)
    }

    this.emit(message.op, message.d)
  }

  async awaitResponse (op, d) {
    const code = crypto.randomBytes(64).toString('hex')
    return new Promise((resolve, reject) => {
      const awaitListener = (msg) => {
        if (!['resp', 'error'].includes(msg.op)) return
        process.removeListener('message', awaitListener)
        if (msg.op === 'resp' && msg.code === code) return resolve(msg.d)
        if (msg.op === 'error') return reject(msg.d)
      }

      const payload = { op, code }
      if (d) payload.d = d

      process.on('message', awaitListener)
      process.send(payload)

      setTimeout(() => {
        process.removeListener('message', awaitListener)
        return reject('IPC timed out after 2000ms')
      }, 2000)
    })
  }

  register (command) {
    if (!command || !command.name) return logger.error('Invalid command')
    this.commands.set(command.name, command)
    this.emit('registered', command.name)
  }
}

module.exports = Transmitter
