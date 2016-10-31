const path = require('path')
const logger = require('winston')

const Command = require('./Command')

class MenuCommand extends Command {
  constructor (...args) {
    super(...args)
  }
}

module.exports = MenuCommand
