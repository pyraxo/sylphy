const util = require('util')
const { Command } = require('../../core')

class Kill extends Command {
  constructor (...args) {
    super(...args, {
      name: 'kill',
      description: 'Kills the bot',
      adminOnly: true,
      cooldown: 0
    })
  }

  handle ({ args }, responder) {
    this.bot.engine.ipc.awaitResponse('kill', { type: args.type, group: args.group })
    .then(data => responder.format('code:js').send(data.map(d => util.inspect(d)).join('\n')))
    .catch(err => responder.format('code:js').send(err))
  }
}

module.exports = Kill
