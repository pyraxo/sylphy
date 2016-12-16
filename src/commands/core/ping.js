const logger = require('winston')
const { Command } = require('../../core')

class Ping extends Command {
  constructor (...args) {
    super(...args, {
      name: 'ping',
      description: 'Pong!',
      options: { hidden: true }
    })
  }

  handle ({ msg }, responder) {
    return responder.format('emoji:info').send('Pong!').then(m => {
      m.edit(`${m.content} - Time taken: **${m.timestamp - msg.timestamp}ms**`)
      .catch(logger.error)
    })
  }
}

module.exports = Ping
