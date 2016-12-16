const logger = require('winston')
const { Collection } = require('../util')

class Router extends Collection {
  constructor (bot) {
    super()
    this.bot = bot
    this.events = {}
  }

  attach (group, Module) {
    const module = new Module(this.bot)
    this.set(module.name, module)
    for (const event in module.events) {
      if (typeof this.events[event] === 'undefined') {
        this.register(event)
      }

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
    this.bot.on(event, (...args) => {
      const events = this.events[event] || {}
      for (const name in events) {
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
  }
}

module.exports = Router
