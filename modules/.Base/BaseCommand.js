const Tatsumaki = require('../../src')

class BaseCommand {
  constructor () {
    if (this.constructor === BaseCommand) {
      throw new Error('Can\'t instantiate abstract command!')
    }
    this.bot = Tatsumaki
    this.bot.on(this.name, (suffix, msg, client) => this.handle(suffix, msg, client))
  }

  get name () {
    throw new Error('Names must be overwritten')
  }

  get description () {
    throw new Error('Description must be overwritten')
  }

  get usage () {
    return ''
  }

  get cooldown () {
    return 0
  }

  get permissions () {
    return []
  }

  get hidden () {
    return false
  }

  get gif () {
    return null
  }

  handle (suffix, msg, client) {}
}

module.exports = BaseCommand
