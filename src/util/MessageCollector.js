let EventEmitter
try {
  EventEmitter = require('eventemitter3')
} catch (err) {
  EventEmitter = require('events')
}

/**
 * Utility class to capture messages.
 * @prop {Array} collected - Array of collected messages
 */
class MessageCollector extends EventEmitter {
  constructor (options) {
    super()
    this.options = options
    this.collected = []

    this.tries = 0
    this.matches = 0
    this.hasEnded = true
  }

  set options ({
    tries = 10,
    time = 60,
    matches = 1,
    channel,
    author,
    filter
  }) {
    this.maxTries = tries
    this.maxTime = time
    this.maxMatches = matches

    this.channel = channel
    this.author = author
    this.filter = filter
  }

  // Starts collecting messages.
  start () {
    this.hasEnded = false
    this.collected = []
    if (!this.timer) {
      this.timer = this.time ? setTimeout(() => this.stop('timeout'), this.time * 1000) : null
      this.emit('start')
    }
  }

  /**
   * Stops collecting messages.
   * @param {string} reason - Reason for stopping.
   */
  stop (reason) {
    clearTimeout(this.timer)
    this.timer = null
    this.hasEnded = true
    this.emit('end', { reason, collected: this.collected })
  }

  /**
   * Collects a message.
   * @param {external:"Eris.Message"} msg - Message to be collected.
   */
  collect (msg) {
    this.collected.push(msg)

    if (this.collected.size >= this.maxMatches) {
      this.stop('maxMatches')
    } else if (this.maxTries && this.collected.size >= this.maxTries) {
      this.stop('maxTries')
    }

    this.emit('collected', msg)
  }

  /**
   * Pass a message object to be filtered and/or collected.
   * @returns {boolean} Whethe the mesage was collected.
   */
  passMessage (msg) {
    if (this.hasEnded) return false

    if (this.author && this.author !== msg.author.id) return false
    if (this.channel && this.channel !== msg.channel.id) return false
    if (typeof this.filter === 'function' && !this.filter(msg)) return false

    this.collect(msg)
    return true
  }
}

module.exports = MessageCollector
