const Base = require('./Base')

class Module extends Base {
  constructor (bot, options) {
    super(bot)
    if (this.constructor === Module) {
      throw new Error('Must extend abstract Module')
    }

    this._verify(options)
  }

  init () {}

  unload () {}

  _verify ({ name, events = {}, localeKey } = {}) {
    if (typeof name === 'undefined') throw new Error(`${this.constructor.name} is not named`)
    if (typeof events !== 'object') throw new Error('Module event must be an object')

    for (let event in events) {
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
