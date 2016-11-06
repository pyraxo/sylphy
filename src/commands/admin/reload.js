const util = require('util')
const { Command } = require('../../core')

class Reload extends Command {
  constructor (...args) {
    super(...args, {
      name: 'reload',
      description: 'Reloads modules, middleware and handlers',
      adminOnly: true,
      cooldown: 0,
      usage: [
        { name: 'type', type: 'string', optional: true },
        { name: 'group', type: 'string', optional: true }
      ]
    })
  }

  handle ({ args }, responder) {
    this.bot.engine.ipc.awaitResponse('reload', { type: args.type, group: args.group })
    .then(data => responder.format('code:js').send(data.map(d => util.inspect(d)).join('\n')))
    .catch(err => responder.format('code:js').send(err))
  }
}

module.exports = Reload
