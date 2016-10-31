const util = require('util')
const logger = require('winston')
const { Command } = require('../../core/command')

class Reload extends Command {
  constructor (...args) {
    super(...args, {
      name: 'reload',
      description: 'Reloads modules, middleware and handlers',
      adminOnly: true,
      cooldown: 0
    })
  }

  handle ({ args }, responder) {
    const type = args[0]
    this.bot.engine.ipc.awaitResponse('reload', { type, group: args[1] })
    .then(data => responder.format('code:js').send(data.map(d => util.inspect(d)).join('\n')))
    .catch(err => responder.format('code:js').send(err))
  }
}

module.exports = Reload
