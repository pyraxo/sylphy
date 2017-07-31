const path = require('path')
const fs = require('fs')

const { requireRecursive, isDir, Collection } = require('../util')

/**
 * Router class for event routing
 * @prop {Object} events Event map
 */
class Router extends Collection {
  /**
   * Creates a new Router instance
   * @arg {Client} client Client instance
   */
  constructor (client) {
    super()
    this._client = client
    this._cached = []
    this.events = {}
  }

  /**
   * Class, object or function that can be utilised as a module
   * @typedef {(Object|function)} AbstractModule
   * @prop {String} name Module name
   * @prop {Object} events Object mapping Eris event name to a function name
   * @example
   * // in constructor
   * events: {
   *   messageCreate: 'onMessage'
   * }
   *
   * // in class or object
   * onMessage (msg) {
   *   // handle message
   * }
   */

   /**
    * Registers modules
    * @arg {String|Object|Array} modules An object, array or relative path to a folder or file to load modules from
    * @returns {Client}
    */
  register (modules) {
    switch (typeof modules) {
      case 'string': {
        const filepath = path.join(process.cwd(), modules)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        const mods = isDir(filepath) ? requireRecursive(filepath) : require(filepath)
        this._cached.push(filepath)
        return this.register(mods)
      }
      case 'object': {
        if (Array.isArray(modules)) {
          for (const module of modules) {
            this.attach(module)
          }
          return this
        }
        for (const key in modules) {
          this.attach(modules[key])
        }
        return this
      }
      default: {
        throw new Error('Path supplied is not an object or string')
      }
    }
  }

  /**
   * Attaches a module
   * @arg {AbstractModule} Module Module class, object or function
   * @returns {Router}
   */
  attach (Module) {
    const module = typeof Module === 'function' ? new Module(this._client) : Module
    if (!module._client) module._client = this._client
    this.set(module.name, module)
    for (const event in module.events) {
      if (typeof this.events[event] === 'undefined') {
        this.record(event)
      }

      const listener = module.events[event]
      if (typeof module[listener] !== 'function') {
        this._client.throwOrEmit('router:error', new TypeError(`${listener} in ${module.name} is not a function`))
        return this
      }

      this.events[event] = Object.assign(this.events[event] || {}, { [module.name]: listener })
    }

    /**
     * Fires when a module is registered
     *
     * @event Client#router:registered
     * @type {Object}
     * @prop {String} name Module name
     * @prop {Number} events Number of events in the module
     * @prop {Number} count Number of loaded modules
     */
    this._client.emit('router:registered', {
      name: module.name,
      events: Object.keys(module.events),
      count: this.size
    })
    return this
  }

  /**
   * Registers an event
   * @arg {String} event Event name
   * @returns {Router}
   */
  record (event) {
    this._client.on(event, (...args) => {
      const events = this.events[event] || {}
      for (const name in events) {
        const module = this.get(name)
        if (!module) continue
        try {
          module[events[name]](...args)
        } catch (err) {
          this._client.throwOrEmit('router:runError', err)
        }
      }
    })
    return this
  }

  /**
   * Initialises all modules
   * @returns {Router}
   */
  initAll () {
    this.forEach(module => {
      if (typeof module.init === 'function') {
        module.init()
      }
    })
    return this
  }

  /**
   * Unregisters all modules
   * @returns {Router}
   */
  unregister () {
    return this.destroy()
  }

  /**
   * Destroys all modules and unloads them
   * @returns {Router}
   */
  destroy () {
    for (const event in this.events) {
      this.events[event] = {}
    }
    this.forEach(module => {
      if (typeof module.unload === 'function') {
        module.unload()
      }
    })
    this.clear()
    return this
  }

  /**
   * Reloads module files (only those that have been added from by file path)
   * @returns {Client}
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
   * Fires when an error occurs in Router
   *
   * @event Client#router:error
   * @type {Error}
   */

  /**
   * Fires when an error occurs in Router's event handling
   *
   * @event Client#router:runError
   * @type {Error}
   */
}

module.exports = Router
