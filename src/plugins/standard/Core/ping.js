const logger = require('winston')
const { AbstractCommand } = require('../../../interfaces')

class PingCommand extends AbstractCommand {
  get name () { return 'ping' }

  handle ({ msg }, responder) {
    responder.format('emoji:info').send('Pong!').then(m => {
      m.edit(`${m.content} - Time taken: **${m.timestamp - msg.timestamp}ms**`)
      .catch(err => logger.error(err))
    })
  }
}

module.exports = PingCommand
