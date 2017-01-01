const { Command } = require('../../')

module.exports = class Stop extends Command {
  constructor (...args) {
    super(...args, {
      name: 'stop',
      aliases: ['end'],
      options: { localeKey: 'test' }
    })
  }

  handle ({ msg }, responder) {
    this.logger.debug('Ending test')
    return responder.reply('{{end}}', { x: 'now' }).then(process.exit)
  }
}
