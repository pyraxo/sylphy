const path = require('path')
const fs = require('fs')

const { readdirRecursive, isDir, unload } = require('../util')

/**
 * Middleware manager for commands.
 * @prop {Array} tasks - Array of middleware
 * @prop {Array} collectors - Array of message collectors
 */
class Bridge {
  /**
   * Creates a new Bridge instance.
   * @arg {Client} client - Client instance
   */
  constructor (bot) {
    this.tasks = []
    this.collectors = []

    this.cached = []
    this.bot = bot
  }

  /**
   * Registers middleware.
   * @arg {string|Middleware|Middleware[]} middleware - Path to file/folder of middleware
   * OR the Middleware object(s)
   * @returns {Client}
   */
  register (arg) {
    if (typeof arg === 'string') {
      const filepath = getAbsolute(arg)
      if (!fs.existsSync(arg)) {
        this.bot.throwOrEmit(new Error(`File/folder ${arg} does not exist`))
      }
      this.cached.push(arg)
      return this.register(isDir(arg) ? readdirRecursive(arg, require) : require(arg))
    } else if (typeof arg === 'object') {
      if (arg instanceof Array) return this.push(...arg)
      Object.values(arg).forEach(this.push.bind(this))
    } else {
      this.bot.throwOrEmit(new TypeError('Filepath or object needed to register middleware'))
    }
    return this
  }

  /**
   * Methods that parses messages and adds properties to a context container.
   * @typedef {Object} Middleware
   * @prop {string} name - Name of middleware
   * @prop {number} priority - Priority level of the middleware
   * @prop {Promise(Container)} process - Middleware process
   */

  /**
   * Inserts new middleware to the task queue according to ascending priority (lower numbers are earlier in queue)
   * @arg {Middleware} middleware - Middleware object
   */
  push (Middleware) {
    const middleware = typeof Middleware === 'function' ? new Middleware(this) : Middleware
    this.tasks.push(middleware)
    this.tasks.sort((a, b) => a.priority - b.priority)

    /**
     * Fires when a middleware is registered.
     *
     * @event Client#bridge:registered
     * @type {Object}
     * @prop {string} name - Middleware name
     * @prop {number} index - Location of middleware in the tasks chain
     * @prop {number} count - Number of loaded middleware tasks
     */
    this.bot.emit('bridge:registered', {
      name: middleware.name,
      index: this.tasks.indexOf(middleware),
      count: this.tasks.length
    })
    return this
  }

  /**
   * Creates a message collector
   * @arg {Object} options Collector options
   * @arg {string} options.filter The filter function to pass all messages through
   * @arg {string} [options.channel] The channel ID to filter messages from
   * @arg {string} [options.author] The author ID to filter messages from
   * @arg {number} [options.tries=10] Max number of attempts to filter a message
   * @arg {number} [options.time=60] Max length of time to wait for messages, in seconds
   * @arg {number} [options.matches=10] Max number of successful filtered messages
   * @returns {Collector} Message collector object
   */
  collect (options = {}) {
    this.collectors.push(new MessageCollector(options))
    return collector
  }

  // Destroy all tasks and collectors.
  destroy () {
    this.tasks = []
    this.collectors = []
  }

  /**
   * Remove middleware by name and returns it if found.
   * @arg {string|boolean} name - Middleware name, will remove all if `true`
   * @returns {?Middleware}
   */
  unregister (name) {
    if (name === true) {
      return this.tasks.splice(0)
    }

    const middleware = this.tasks.find(mw => mw.name === name)
    if (!middleware) return null
    this.tasks.splice(this.tasks.indexOf(middleware, 1))
    return middleware
  }

  // Reloads middleware files (only those that have been added by file path).
  reload () {
    this.cached.splice(0, this.cached.length).forEach(filepath => {
      unload(filepath)
      this.register(filepath)
    })
    return this
  }

  _createListener () {
    return msg => {
      if (this.bot.selfbot) {
        if (msg.author.id !== this.bot.user.id) return
      } else {
        if (msg.author.id === this.bot.user.id) return
      }

      this.handle({ msg, client: this.bot }).then(
        container => this.bot.commander && this.bot.commander.handle(container),
        err => err && this.bot.logger && this.bot.logger.error('Error in Bridge handle', err)
      )
    }
  }

  // Starts running the bridge.
  run () {
    this.bot.on('messageCreate', this._createListener())
  }

  // Stops running the bridge.
  stop () {
    this.bot.removeListener('messageCreate', this._createListener)
  }

  /**
   * Context container holding a message object, with added properties and objects.
   * @typedef {Object} Container
   * @prop {external:"Eris.Message"} msg - Message object
   * @prop {Client} client - Client object
   * @prop {string} trigger - Command trigger<br />
   * At least one middleware should add this into the container; default middleware does it for you
   */

  /**
   * Collects and executes messages after running them through middleware.
   * @arg {Container} container - Message container
   * @returns {Promise<Container>}
   */
  async handle (container) {
    const { msg } = container
    const collected = this.collectors.filter(collector => !collector.passMessage(msg))
    if (collected.length) return Promise.reject()

    for (const task of this.tasks) {
      const result = await task.process(container)
      if (!result) return Promise.reject()
      container = { ...container, ...result }
    }
    if (!container.trigger) return Promise.reject()

    return container
  }
}

module.exports = Bridge
