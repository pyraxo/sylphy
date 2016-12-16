const logger = require('winston')
const { Collection } = require('../util')

class Commander extends Collection {
  constructor (bot) {
    super()
    this.bot = bot
  }

  attach (group, Command) {
    const command = new Command(this.bot, group)
    for (let label of command.labels) {
      if (this.has(label)) throw new Error(`Duplicate command: ${label}`)
      this.set(label.toLowerCase(), { cmd: command, group, label })
    }
  }

  eject (group) {
    this.filter(e => e.group === group || typeof group === 'undefined')
    .forEach(e => this.delete(e.label))
  }

  execute (label, ...args) {
    const e = this.get(label)
    if (e) {
      try {
        e.cmd._execute(...args)
      } catch (err) {
        logger.error(`Error running command ${label}`)
        logger.error(err)
      }
    }
  }

  executeGroup (group, ...args) {
    this.filter(e => e.group === group)
    .forEach(e => {
      try {
        e.cmd._execute(...args)
      } catch (err) {
        logger.error(`Error running command group ${group}: ${err}`)
      }
    })
  }
}

module.exports = Commander
