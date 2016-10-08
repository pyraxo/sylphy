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
    this.plugins.set(trigger, { plugin, module })
  }

  runPlugin (trigger, ...args) {
    if (!this.plugins.has(trigger)) return
    this.plugins.get(trigger).plugin.execute(...args)
  }

  ejectModule (exp) {
    this.plugins.filter(p => mm.isMatch(p.module, exp))
    .forEach(p => this.ejectPlugin(p.plugin))
  }

  ejectPlugin (plugin) {
    if (!this.plugins.has(plugin.name)) return
    this.plugins.delete(plugin.name)
  }
}

module.exports = Processor
