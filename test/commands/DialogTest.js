const { Command } = require('../../')

module.exports = class DialogTest extends Command {
  constructor (...args) {
    super(...args, {
      name: 'dialog',
      options: { localeKey: 'test' }
    })
  }

  async handle ({ msg, client }, responder) {
    const reply = await responder.selection([1, 2, 3, 4, 5])
    console.log(reply)
  }
}
