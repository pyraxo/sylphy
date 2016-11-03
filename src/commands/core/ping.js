const logger = require('winston')
const { Command } = require('../../core')

class PingCommand extends Command {
  constructor (...args) {
    super(...args, {
      name: 'ping',
      description: 'Pong!'
    })
  }

  handle ({ msg }, responder) {
    responder.format('emoji:info').send('Pong!').then(m => {
      m.edit(`${m.content} - Time taken: **${m.timestamp - msg.timestamp}ms**`)
      .catch(err => logger.error(err))
    })
  }
}

module.exports = PingCommand
