const crypto = require('crypto')

const Collection = require('../util/Collection')

/**
 * Manager class for inter-process communication
 * @prop {String} pid Process ID
 * @prop {Map} commands IPC commands
 */
class Transmitter extends Collection {
  /**
   * Creates a new Transmitter instance
   * @arg {Client} client Client instance
   */
  constructor (client) {
    super()

    this.pid = process.pid
    this._client = client

    process.on('message', this.onMessage.bind(this))
  }

  /**
   * Sends a message to the master IPC process
   * @arg {String} event Event name
   * @arg {*} data Attached data
   */
  send (event, data) {
    process.send({
      op: event,
      d: data
    })
  }

  onMessage (message) {
    if (!message.op) {
      if (!this._client.suppressWarnings) {
        this._logger.warn('Received IPC message with no op')
      }
      return
    }

    if (['resp', 'broadcast'].includes(message.op)) return

    if (this[message.op]) {
      return this[message.op](message)
    }

    const command = this.get(message.op)
    if (command) {
      return command(message, this._bot)
    }
  }

  /**
   * Awaits for a certain response
   * @arg {String} op op code
   * @arg {*} d Attached data
   * @returns {Promise<*>}
   */
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

  /**
   * Registers an IPC command
   * @arg {function} command Command function
   * @arg {String} command.name Name of the IPC command
   * @returns {Transmitter}
   */
  register (command) {
    if (!command || !command.name) {
      this._client.throwOrEmit('ipc:error', new TypeError(`Invalid command - ${command}`))
      return
    }
    this.set(command.name, command)
    return this
  }

  /**
   * Unregisters an IPC command by name
   * @arg {String} name Name of the IPC command
   * @returns {Transmitter}
   */
  unregister (name) {
    this.delete(name)
    return this
  }

  /**
   * Fires when an error occurs in Transmitter
   * @event Client#ipc:error
   * @type {Error}
   */
}

module.exports = Transmitter
