const { Collection } = require('../util')

class Container extends Collection {
  constructor (bot) {
    super()
    this.bot = bot
  }

  attach (group, Extension) {
    const extension = new Extension(this.bot)
    for (let label of extension.labels) {
      if (this.has(label)) throw new Error(`Duplicate command: ${label}`)
      this.set(label.toLowerCase(), { ext: extension, group, label })
    }
  }

  eject (group) {
    this.filter(e => e.group === group || typeof group === 'undefined')
    .forEach(e => this.delete(e.label))
  }

  execute (label, ...args) {
    const e = this.get(label)
    if (e) e.ext._execute(...args)
  }

  executeGroup (group, ...args) {
    this.filter(e => e.group === group)
    .forEach(e => e.ext._execute(...args))
  }
}

module.exports = Container
