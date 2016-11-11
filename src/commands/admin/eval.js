const { Command } = require('../../core')

class Eval extends Command {
  constructor (...args) {
    super(...args, {
      name: 'eval',
      description: 'Evaluates an expression',
      adminOnly: true,
      cooldown: 0
    })
  }

  handle ({ msg }, responder) {
    const content = msg.content.split(' ').slice(1).join(' ')
    this.bot.engine.ipc.awaitResponse('evaluate', { content })
    .then(data => responder.format('code:js').send(data.map(d => {
      const r = d.result || null
      return [
        `PROCESS ${d.id}:`,
        (r && r.length > 200 ? r.substr(0, 200) + '...' : r) + '\n'
      ].join('\n')
    }).join('\n')))
    .catch(err => responder.format('code:js').send(err))
  }
}

module.exports = Eval
