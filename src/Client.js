const path = require('path')
const Eris = require('eris').Client

const { Commander, Router, Bridge, Interpreter, Logger } = require('./core')
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
   * @arg {Object} options An object containing sylphy's and/or Eris client options
   * @arg {String} options.token Discord bot token
   * @arg {String} [options.prefix='!'] Default prefix for commands
   * @arg {String} [options.admins=[]] Array of admin IDs
   * @arg {String} [options.selfbot=false] Option for selfbot mode
   * @arg {String} [options.commands] Relative path to commands folder
   * @arg {String} [options.modules] Relative path to modules folder
   * @arg {String} [options.middleware] Relative path to middleware folder
   * @arg {String} [options.locales] Relative path to locales folder
   * @arg {String} [options.resolvers] Relative path to resolvers folder
   * @arg {Boolean} [options.suppressWarnings=false] Option to suppress console warnings
   * @arg {Boolean} [options.noDefaults=false] Option to not use built-in plugins
   */
  constructor (options = {}) {
    super(options.token, options)
    this.selfbot = options.selfbot
    this.prefix = options.prefix || '!'
    this.suppressWarnings = options.suppressWarnings
    this.noDefaults = options.noDefaults
    this.admins = Array.isArray(options.admins) ? options.admins : []

    this._resolvers = options.resolvers

    this.plugins = new Collection()

    if (!this.noDefaults) {
      this
      .createPlugin('commands', Commander, options)
      .createPlugin('modules', Router, options)
      .createPlugin('middleware', Bridge, options)
      .createPlugin('i18n', Interpreter, options)
      .createPlugin('logger', Logger, options)

      this.register('i18n', path.join(__dirname, '..', 'res/i18n'))
      this.register('middleware', path.join(__dirname, 'middleware'))

      if (options.commands) this.register('commands', options.commands)
      if (options.modules) this.register('modules', options.modules)
      if (options.middleware) this.register('middleware', options.middleware)
      if (options.locales) this.register('i18n', options.locales)
    }
  }

  get logger () {
    return this.plugins.get('logger')
  }

  /**
   * Creates a plugin
   * @arg {String} type The type of plugin
   * @arg {Plugin} Plugin Plugin class
   * @arg {Object} [options] Additional plugin options
   * @returns {Client}
   */
  createPlugin (type, Plugin, options) {
    const plugin = new Plugin(this, options)
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
    if (typeof plugin.register === 'function') plugin.register(...args)
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
    if (typeof plugin.unregister === 'function') plugin.unregister(...args)
    return this
  }

  /**
   * Unloads files from the require cache
   * @arg {String} filepath A relative or absolute directory path, file path or file name
   * @returns {Client}
   */
  unload (filepath) {
    Object.keys(require.cache).forEach(file => {
      const str = path.isAbsolute(filepath) ? filepath : path.join(process.cwd(), filepath)
      if (str === file || file.startsWith(str)) {
        delete require.cache[require.resolve(file)]
      }
    })
    return this
  }

  /**
   * Runs the bot
   * @returns {Promise}
   */
  run () {
    if (typeof this.token !== 'string') {
      throw new TypeError('No bot token supplied')
    }
    this.plugins.forEach(plugin => {
      if (typeof plugin.run === 'function') plugin.run()
    })
    return this.connect()
  }

  /**
   * Emits an error or throws when there are no listeners
   * @arg {String} event Event name
   * @arg {Error} error Thrown or emitted error
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
