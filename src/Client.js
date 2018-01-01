const path = require('path')
const Eris = require('eris')

const { Commander, Router, Bridge, Interpreter, Logger } = require('./core')
const { Collection } = require('./util')

/**
 * Interface between the Eris client and plugins.
 * @version 1.0.0
 * @extends Eris.Client
 * @prop {Collection} plugins - Collection of plugins
 * @see {@link https://abal.moe/Eris/docs/Client|Eris.Client}
 */
class Client extends Eris.Client {
  /**
   * Creates a new Client instance.
   * @arg {Object} options - An object containing Sylphy's and Eris client options
   * @arg {string} options.token - Discord bot token
   * @arg {string} [options.prefix='!'] - Default prefix for commands
   * @arg {string} [options.admins=[]] - Array of admin IDs
   * @arg {boolean} [options.selfbot=false] - Array of admin IDs
   */
  constructor (options = {}) {
    super(options.token, options)
    this.options = options

    this.plugins = new Collection()
  }

  set options ({
    prefix,
    admins = [],
    selfbot = false
  }) {
    if (!this.token) throw new Error('Bot token not supplied')
    if (!prefix) throw new Error('Missing prefix option')
    this.prefix = prefix
    this.admins = admins
    this.selfbot = selfbot
  }

  get logger () {
    return this.plugins.get('logger')
  }

  get commander () {
    return this.plugins.get('commands')
  }

  /**
   * Loads and instantiates a plugin.
   * @arg {string} name - Name of plugin
   * @arg {Class} Plugin - Plugin class
   * @arg {Object} [options] - Additional plugin options
   * @returns {Client}
   */
  createPlugin (name, plugin, options) {
    const plugin = new Plugin(this, options)
    this.plugins.set(name, plugin)
    return this
  }

  /**
   * Removes a plugin.
   * @arg {string} name - Name of plugin
   * @returns {Client}
   */
  removePlugin (name) {
    this.plugins.delete(name)
    return this
  }

  /**
   * Calls the `register()` function in a plugin.
   * @arg {string} name - Name of plugin
   * @arg {...*} [args] - Arguments supplied to `register()`
   * @returns {Client}
   */
  register (name, ...args) {
    if (typeof name !== 'string') {
      throw new TypeError('Plugin name must be a string')
    }

    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin '${name}' not found`)
    }

    if (typeof plugin.register === 'function') plugin.register(...args)
    return this
  }

  /**
   * Calls the `unregister()` function in a plugin.
   * @arg {string} name - Name of plugin
   * @arg {...*} [args] - Arguments supplied to `unregister()`
   * @returns {Client}
   */
  unregister (name, ...args) {
    if (typeof name !== 'string') {
      throw new TypeError('Plugin name must be a string')
    }

    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin type ${name} not found`)
    }

    if (typeof plugin.unregister === 'function') plugin.unregister(...args)
    return this
  }

  /**
   * Starts the bot and its plugins running.
   * @returns {Promise}
   */
  run () {
    this.plugins.forEach(plugin => {
      if (typeof plugin.run === 'function') plugin.run()
    })
    return this.connect()
  }

  /**
   * Emits an error or throws when there are no listeners.
   * @arg {string} event - Event name
   * @arg {Error} error - Thrown or emitted error
   * @private
   */
  throwOrEmit (event, error) {
    if (!this.listeners(event).length) {
      throw error
    }
    this.emit(event, error)
  }
}

module.exports = Client

/**
 * The Eris client
 * @external "Eris.Client"
 * @see {@link https://abal.moe/Eris/docs/Client|Eris.Client}
 */

/**
 * The Eris message object
 * @external "Eris.Message"
 * @see {@link https://abal.moe/Eris/docs/Message|Eris.Message}
 */

/**
 * The Eris guild object
 * @external "Eris.Guild"
 * @see {@link https://abal.moe/Eris/docs/Guild|Eris.Guild}
 */

/**
 * The Eris role object
 * @external "Eris.Role"
 * @see {@link https://abal.moe/Eris/docs/Role|Eris.Role}
 */

/**
 * The Eris member object
 * @external "Eris.Member"
 * @see {@link https://abal.moe/Eris/docs/Member|Eris.Member}
 */

/**
 * The Eris user object
 * @external "Eris.User"
 * @see {@link https://abal.moe/Eris/docs/User|Eris.User}
 */

/**
 * The Eris channel object
 * @external "Eris.GuildChannel"
 * @see {@link https://abal.moe/Eris/docs/GuildChannel|Eris.GuildChannel}
 */
