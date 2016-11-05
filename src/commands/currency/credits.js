const { MenuCommand } = require('../../core').commands

class Credits extends MenuCommand {
  constructor (...args) {
    super(...args, {
      name: 'credits',
      description: 'Currency command',
      adminOnly: true,
      cooldown: 0
    })
  }

  handle ({ args }, responder) {

  }
}

module.exports = Credits
