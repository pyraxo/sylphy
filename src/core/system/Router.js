const logger = require('winston')
const { Collection } = require('../util')

class Router extends Collection {
  constructor (client, context) {
    super()
    this._context = context
    this.client = client
    this.events = new Collection()
  }

  attach (group, Module) {
    const module = new Module(this._context)
    this.set(module.name, module)
    for (const event in module.events) {
      const listener = module.events[event]
      if (typeof module[listener] !== 'function') {
        throw new TypeError(`${listener} is an invalid handler`)
      }

      let events = this.events.get(event) || []
      events.push({ module: module.name, name: listener })
      this.events.set(event, events)
    }
  }

  setup () {
    for (let [event, listeners] of this.events) {
      const groupListener = this._listen(listeners)
      this.client.removeListener(event, groupListener)
      this.client.on(event, groupListener)
    }
  }

  _listen (listeners) {
    return (...args) => {
      listeners.forEach(listener => {
        const module = this.get(listener.module)
        if (!module) return
        module[listener.name](...args)
      })
    }
  }
}

module.exports = Router
