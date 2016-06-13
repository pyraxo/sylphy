let Tatsumaki = require('../../src')

class BaseCommand {
  constructor () {
    if (this.constructor === BaseCommand) {
      throw new Error('Can\'t instantiate abstract command!')
    }
    this.bot = Tatsumaki
    Tatsumaki.on(this.name, (msg, client) => this.handle(msg, client))
  }

  get name () {
    throw new Error('Names must be overwritten')
  }

  get description () {
    throw new Error('Description must be overwritten')
  }

  handle (msg, client) {}
}

module.exports = BaseCommand
