const path = require('path')
const fs = require('fs')
const requireAll = require('require-all')

/**
 * Middleware manager for commands
 * @prop {Array} tasks An array of middleware
 * @prop {Array} collectors An array of message collectors
 */
class Bridge {
  /**
   * Creates a new Bridge instance
   * @arg {Commander} commander Commander instance
   */
  constructor (commander) {
    this.tasks = []
    this.collectors = []
    this._commander = commander
  }

  /**
   * Registers middleware
   * @param {String|Object|Array} middleware An object, array or relative path to a folder or file to load middleware from
   * @returns {Client}
   */
  register (middleware) {
    switch (typeof middleware) {
      case 'string': {
        const filepath = path.join(__dirname, middleware)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        const middleware = fs.statSync(filepath).isDirectory() ? requireAll(filepath) : require(filepath)
        return this.register(middleware)
      }
      case 'object': {
        if (Array.isArray(middleware)) {
          for (const mw of middleware) {
            this.push(mw)
          }
          return this
        }
        for (const key in middleware) {
          this.push(middleware[key])
        }
        return this
      }
      default: {
        throw new Error('Path supplied is not an object or string')
      }
    }
  }

  /**
   * Methods that parses messages and adds properties to a context container
   * @typedef {Object} Middleware
   * @prop {String} name Name of middleware
   * @prop {Number} priority Priority level of the middleware
   * @prop {Promise(Container)} Middleware process
   */

  /**
   * Inserts new middleware to the task queue according to ascending priority (lower numbers are earlier in queue)
   * @arg {Middleware} middleware Middleware object
   */
  push (middleware) {
    const priority = middleware.priority || this.tasks.length
    if (!middleware.process || !middleware.process.then) {
      throw new Error('Middleware must be a promise')
    }
    this.tasks.splice(priority, 0, middleware)
  }

  /**
   * Creates a message collector
   * @arg {Object} options Collector options
   * @arg {String} options.filter The filter function to pass all messages through
   * @arg {String} [options.channel] The channel ID to filter messages from
   * @arg {String} [options.author] The author ID to filter messages from
   * @arg {Number} [options.tries=10] Max number of attempts to filter a message
   * @arg {Number} [options.time=60] Max length of time to wait for messages, in seconds
   * @arg {Number} [options.matches=10] Max number of successful filtered messages
   * @returns {Collector} Message collector object
   */
  collect (options = {}) {
    const { tries = 10, time = 60, matches = 10, channel, author, filter } = options

    /**
     * Message collector object, intended for menus
     * @namespace Collector
     * @type {Object}
     */
    const collector = {
      /**
       * An array of collected messages
       * @memberof Collector
       * @type {Array}
       */
      collected: [],
      _tries: 0,
      _matches: 0,
      _listening: false,
      _ended: false,
      _timer: time ? setTimeout(() => {
        collector._ended = {
          reason: 'timeout',
          arg: time,
          collected: collector.collected
        }
      }, time * 1000) : null
    }
    /**
     * Stop collecting messages
     * @memberof Collector
     * @method
     */
    collector.stop = () => {
      collector._listening = false
      this.collectors.splice(this.collectors.indexOf(collector), 1)
    }
    /**
     * Resolves when message is collected, and rejects when collector has ended
     * @memberof Collector
     * @returns {Promise<external:"Eris.Message">}
     */
    collector.next = () => {
      return new Promise((resolve, reject) => {
        collector._resolve = resolve
        if (collector._ended) {
          collector.stop()
          reject(collector._ended)
        }
        collector._listening = true
      })
    }
    /**
     * Pass a message object to be filtered
     * @memberof Collector
     * @method
     * @returns {Boolean}
     */
    collector.passMessage = msg => {
      if (!collector._listening) return false
      if (author && author !== msg.author.id) return false
      if (channel && channel !== msg.channel.id) return false
      if (typeof filter === 'function' && !filter(msg)) return false

      collector.collected.push(msg)
      if (collector.collected.size >= matches) {
        collector._ended = { reason: 'maxMatches', arg: matches }
      } else if (tries && collector.collected.size === tries) {
        collector._ended = { reason: 'max', arg: tries }
      }
      collector._resolve(msg)
      return true
    }
    this.collectors.push(collector)
    return collector
  }

  /**
   * Destroy all tasks and collectors
   */
  destroy () {
    this.tasks = []
    this.collectors = []
  }

  /**
   * Remove middleware by name and returns it if found
   * @arg {String} name Middleware name
   * @returns {?Middleware}
   */
  unregister (name) {
    const middleware = this.tasks.find(mw => mw.name === name)
    if (!middleware) return null
    this.tasks.splice(this.tasks.indexOf(middleware, 1))
    return middleware
  }

  /**
   * Context container holding a message object along with added properties and objects
   * @typedef {Object} Container
   * @prop {external:"Eris.Message"} msg The message object
   * @prop {Client} client The client object
   * @prop {String} trigger The command trigger<br />
   * At least one middleware should add this into the container; default middleware does it for you
   */

  /**
   * Collects and executes messages after running them through middleware
   * @arg {Container} container The message container
   * @returns {Promise<Container>}
   */
  async handle (container) {
    const { msg } = container
    for (let collector of this.collectors) {
      const collected = collector.passMessage(msg)
      if (collected) return Promise.reject()
    }
    for (const task of this.tasks) {
      try {
        const result = await task(container)
        if (!result) return Promise.reject()
        container = result
      } catch (err) {
        throw err
      }
    }
    try {
      if (!container.trigger) return Promise.reject()
      this._commander.execute(container.trigger, container)
    } catch (err) {
      throw err
    }
    return container
  }
}

module.exports = Bridge
