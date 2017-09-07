let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const { Collection, requireAll, isDir } = require('../util')

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
    this._cached = []

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
        this._client.logger.warn('Received IPC message with no op')
      }
      return
    }

    if (['resp', 'broadcast'].includes(message.op)) return

    const command = this.get(message.op)
    if (command) {
      return command(message, this._client)
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
   * Registers IPC commands
   * @arg {String|Object|Array} commands An object, array or relative path to a folder or file to load commands from
   */
  register (commands) {
    switch (typeof commands) {
      case 'string': {
        const filepath = path.join(process.cwd(), commands)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        const cmds = isDir(filepath) ? requireAll(filepath) : require(filepath)
        this._cached.push(commands)
        return this.register(cmds)
      }
      case 'object': {
        if (Array.isArray(commands)) {
          for (const command of commands) {
            if (typeof command === 'object') {
              this.register(command)
              continue
            }
            this.attach(command)
          }
          return this
        }
        for (const group in commands) {
          const command = commands[group]
          if (typeof command === 'object') {
            this.register(command)
            continue
          }
          this.attach(command)
        }
        return this
      }
      default: {
        throw new Error('Path supplied is not an object or string')
      }
    }
  }

  /**
   * Reloads IPC command files (only those that have been added from by file path)
   */
  reload () {
    for (const filepath of this._cached) {
      this._client.unload(filepath)
      this._cached.shift()
      this.register(filepath)
    }
    return this
  }

  /**
   * Attaches an IPC command
   * @arg {Function|Object} command IPC command function or object containing the function
   * @arg {String} command.name
   * @arg {Object} [command.command]
   */
  attach (command) {
    if (!command.name && (typeof command.command !== 'function' || typeof command !== 'function')) {
      this._client.throwOrEmit('ipc:error', new TypeError(`Invalid command - ${command}`))
      return
    }
    this.set(command.name, command.command || command)
    return this
  }

  /**
   * Unregisters an IPC command by name
   * @arg {String} name Name of the IPC command
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
