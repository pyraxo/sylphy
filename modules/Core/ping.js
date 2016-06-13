import BaseCommand from '../.Base/BaseCommand'

class Ping extends BaseCommand {
  get name () {
    return 'ping'
  }

  get description () {
    return 'Pong!'
  }

  get usage () {
    return []
  }

  handle (msg, client) {
    msg.reply('pong!')
  }
}

module.exports = Ping
