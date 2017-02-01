const { Command } = require('../../')

module.exports = class Stop extends Command {
  constructor (...args) {
    super(...args, {
      name: 'stop',
      aliases: ['end'],
      options: { localeKey: 'test' }
    })
  }

  handle ({ msg, client }, responder) {
    this.logger.debug('Ending test')
    process.send({ op: 'broadcast', d: 'end' })
    return responder.reply('{{end}}', { x: 'now' }).then(process.exit)
  }
}
