class Module {
  constructor (client, options) {
    if (this.constructor === Module) {
      throw new Error('Must extend abstract Handler')
    }

    this._verify(options)
    this.client = client
  }

  _verify ({ name, events = {} }) {
    if (typeof name === 'undefined') throw new Error(`${this.constructor.name} is not named`)
    if (typeof events !== 'object') throw new Error('Handler event must be an object')
    if (Object.keys(events).length === 0) throw new Error('Handler must have registered events')

    for (let event in events) {
      if (typeof event !== 'string' || events[event] !== 'function') {
        throw new Error(`Handler ${name} has an incompatible event/function`)
      }
    }

    this.name = name
    this.events = events
  }
}

module.exports = Module
