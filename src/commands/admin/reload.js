const util = require('util')
const { Command } = require('../../core')

class Reload extends Command {
  constructor (...args) {
    super(...args, {
      name: 'reload',
      description: 'Reloads commands, middleware and modules',
      options: {
        adminOnly: true
      },
      cooldown: 0,
      usage: [
        { name: 'type', type: 'string', optional: true },
        { name: 'group', type: 'string', optional: true },
        { name: 'file', type: 'string', optional: true }
      ]
    })
  }

  async handle ({ args }, responder) {
    try {
      const data = await this.bot.engine.ipc.awaitResponse('reload', { type: args.type, group: args.group, file: args.file })
      return responder.format('code:js').send(data.map(d => util.inspect(d)).join('\n'))
    } catch (err) {
      return responder.format('code:js').send(err)
    }
  }
}

module.exports = Reload
