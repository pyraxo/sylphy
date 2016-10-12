const mm = require('micromatch')
const Collection = require('../util/Collection')

class Processor {
  constructor (client) {
    this.client = client
    this.plugins = new Collection()
  }

  attachModule (name, unit) {
    for (let plug in unit) {
      const plugin = new unit[plug](this.client)
      this.attachPlugin(plugin.name, name, plugin)
    }
  }

  attachPlugin (trigger, module, plugin) {
    if (this.plugins.has(trigger)) {
      throw new Error(`Duplicate plugin: ${trigger}`)
    }
    this.plugins.set(trigger, { plugin, module, trigger })
  }

  runPlugin (trigger, ...args) {
    if (!this.plugins.has(trigger)) return
    this.plugins.get(trigger).plugin.execute(...args)
  }

  ejectModule (exp) {
    this.findModule(exp)
    .forEach(p => this.ejectPlugin(p))
  }

  ejectPlugin (plugin) {
    if (!this.plugins.has(plugin.trigger)) return
    this.plugins.delete(plugin.trigger)
  }

  findModule (exp) {
    return this.plugins.filter(p => mm.isMatch(p.module, exp))
  }
}

module.exports = Processor
