const Base = require('./Base')

/**
 * Built-in module class
 * @extends {Base}
 * @abstract
 */
class Module extends Base {
  constructor (client, options) {
    super(client)
    if (this.constructor === Module) {
      throw new Error('Must extend abstract Module')
    }

    this.options = options
  }

  /** Initialises the module */
  init () {}

  /** Unloads the module */
  unload () {}

  /**
   * Verifies the options passed to the constructor
   * @arg {Object} args Options passed to the Command constructor
   * @private
   */
  set options ({ name, events = {}, localeKey } = {}) {
    if (typeof name === 'undefined') throw new Error(`${this.constructor.name} is not named`)
    if (typeof events !== 'object') throw new Error('Module event must be an object')

    for (const event in events) {
      if (typeof event !== 'string') {
        throw new TypeError(`Module ${name} has an invalid event`)
      }

      if (typeof this[events[event]] !== 'function') {
        throw new TypeError(`Module ${name} has an invalid handler`)
      }
    }

    this.name = name
    this.events = events
    this.localeKey = localeKey
  }
}

module.exports = Module
