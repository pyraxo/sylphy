const EventEmitter = require('eventemitter3')
const Collection = require('./Collection')

class MessageCollector extends EventEmitter {
  constructor (channel, filter, options = {}) {
    super()
    this.channel = channel
    this.filter = filter
    this.options = options
    this.ended = false
    this.collected = new Collection()

    this.listener = message => this.verify(message)
    if (options.time) setTimeout(() => this.stop(`Timeout after ${options.time}s`), options.time * 1000)
  }

  passMessage (message) {
    if (this.ended) return false
    return this.listener(message)
  }

  verify (message) {
    if (this.channel && this.channel !== message.channel.id) return false
    if (this.filter(message, this)) {
      this.collected.set(message.id, message)
      this.emit('message', message, this)
      if (this.collected.size >= (this.options.maxMatches || Infinity)) {
        this.stop(`Exceeded ${this.options.maxMatches} matches`)
      } else if (this.options.max && this.collected.size === (this.options.max || Infinity)) {
        this.stop(`Exceeded ${this.options.max} tries`)
      }
      return true
    }
    return false
  }

  get next () {
    return new Promise((resolve, reject) => {
      if (this.ended) {
        reject({ collected: this.collected, reason: this.ended })
        return
      }

      const cleanup = () => {
        this.removeListener('message', onMessage)
        this.removeListener('end', onEnd)
      }

      const onMessage = (...args) => {
        cleanup()
        resolve(...args)
      }

      const onEnd = (...args) => {
        cleanup()
        reject(...args)
      }

      this.once('message', onMessage)
      this.once('end', onEnd)
    })
  }

  stop (reason = 'user') {
    if (this.ended) return
    this.ended = reason
    this.emit('end', { collected: this.collected, reason })
  }
}

module.exports = MessageCollector
