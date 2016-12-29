const Eris = require('eris').client

const { Commander, Router, Bridge } = require('./core/engine')
const { Collection } = require('./util')

/**
 * Interface between the Discord client and plugins
 * @version 3.0.0
 * @extends Eris.Client
 * @prop {Collection} plugins A Collection of plugins
 * @see {@link https://abal.moe/Eris/docs/Client|Eris.Client}
 */
class Client extends Eris {
  /**
   * Creates a new Client instance
   * @arg {Object} options An object containing iris's and/or Eris client options
   * @arg {String} options.token Discord bot token
   * @arg {String} [options.commands] Relative path to commands folder
   * @arg {String} [options.modules] Relative path to modules folder
   * @arg {String} [options.middleware] Relative path to middleware folder
   * @arg {Boolean} [options.suppressWarnings=false] Option to suppress console warnings
   * @arg {Boolean} [options.noDefaults=false] Option to not use built-in plugins
   */
  constructor (options = {}) {
    super(options.token, options)
    this.suppressWarnings = options.suppressWarnings
    this.noDefaults = options.noDefaults

    this.plugins = new Collection()

    this
    .createPlugin('commands', Commander)
    .createPlugin('modules', Router)
    .createPlugin('middleware', Bridge)

    if (options.commands) this.register('commands', options.commands)
    if (options.modules) this.register('modules', options.modules)
    if (options.middleware) this.register('middleware', options.middleware)
  }

  /**
   * Creates a plugin
   * @arg {String} type The type of plugin
   * @arg {Plugin} Plugin Plugin class
   * @returns {Client}
   */
  createPlugin (type, Plugin) {
    const plugin = new Plugin(this)
    this.plugins.set(type, plugin)
    return this
  }

  /**
   * Registers plugins
   * @arg {String} type The type of plugin<br />
   * Defaults: `commands`, `modules`, `middleware`, `resolvers`, `ipc`
   * @arg {...*} args Arguments supplied to the plugin
   * @returns {Client}
   */
  register (type, ...args) {
    if (typeof type !== 'string') {
      throw new Error('Invalid type supplied to register')
    }
    const plugin = this.plugins.get(type)
    if (!plugin) {
      throw new Error(`Plugin type ${type} not found`)
    }
    plugin.register(...args)
    return this
  }

  /**
   * Unregisters plugins
   * @arg {String} type The type of plugin<br />
   * Defaults: `commands`, `modules`, `middleware`, `resolvers`, `ipc`
   * @arg {...*} args Arguments supplied to the plugin
   * @returns {Client}
   */
  unregister (type, ...args) {
    if (typeof type !== 'string') {
      throw new Error('Invalid type supplied to register')
    }
    const plugin = this.plugins.get(type)
    if (!plugin) {
      throw new Error(`Plugin type ${type} not found`)
    }
    plugin.unregister(...args)
    return this
  }

  /**
   * Runs the bot
   * @returns {Client}
   */
  run () {
    if (typeof this.token !== 'string') {
      throw new TypeError('No bot token supplied')
    }
    this.connect()
    return this
  }

  /**
   * Emits an error or throws when there are no listeners
   * @arg {String} event Event name
   * @arg {Error} error Thrown or emitted error
   * @private
   */
  throwOrEmit (event, error) {
    if (!this.listeners(event, true)) {
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
