const util = require('util')
const { Command } = require('../../core')

class Kill extends Command {
  constructor (...args) {
    super(...args, {
      name: 'kill',
      description: 'Kills the bot',
      adminOnly: true
    })
  }

  handle (container, responder) {
    this.bot.engine.ipc.awaitResponse('kill')
    .then(data => responder.format('code:js').send(data.map(d => util.inspect(d)).join('\n')))
    .catch(err => responder.format('code:js').send(err))
  }
}

module.exports = Kill
