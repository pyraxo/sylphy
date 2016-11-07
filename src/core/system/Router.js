const logger = require('winston')
const { Collection } = require('../util')

class Router extends Collection {
  constructor (client, context) {
    super()
    this._context = context
    this.client = client
  }

  attach (group, Module) {
    const module = new Module(this._context)
    for (let event in module.events) {
      const events = this.get(event) || []
      const listen = module[module.events[event]]
      if (typeof listen !== 'function') throw new TypeError('Invalid handler')
      events.push({ listen, event })
      this.set(event, events)
    }
  }

  setup () {
    Object.keys(this).forEach(event => {
      this.client.removeListener(event, this._listen(event))
      this.client.on(event, this._listen(event))
    })
  }

  _listen (event) {
    return (...args) => this.get(event).forEach(e => {
      try {
        e.listen(...args)
      } catch (err) {
        logger.error(`Error handling event ${event} with handler ${e.name}: ${err}`)
      }
    })
  }
}

module.exports = Router
