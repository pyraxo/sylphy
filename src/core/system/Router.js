const logger = require('winston')
const { Collection } = require('../util')

class Router extends Collection {
  constructor (client, context) {
    super()
    this._context = context
    this.client = client
    this.events = {}
  }

  attach (group, Module) {
    const module = new Module(this._context)
    this.set(module.name, module)
    for (const event in module.events) {
      if (typeof this.events[event] === 'undefined') this.register(event)
      const listener = module.events[event]
      if (typeof module[listener] !== 'function') {
        throw new TypeError(`${listener} is an invalid handler`)
      }

      let events = this.events[event] || {}
      events[module.name] = listener
      this.events[event] = events
    }
  }

  register (event) {
    this.client.on(event, (...args) => {
      let events = this.events[event] || {}
      for (let name in events) {
        const module = this.get(name)
        if (!module) continue
        try {
          module[events[name]](...args)
        } catch (err) {
          logger.error(`Error executing ${event} in ${name}`)
          logger.error(err)
        }
      }
    })
  }

  initAll () {
    this.forEach(module => {
      if (typeof module.init === 'function') {
        module.init()
      }
    })
  }
}

module.exports = Router
