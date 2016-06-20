import AbstractCommand from './AbstractCommand'

class BaseCommand extends AbstractCommand {
  constructor () {
    super()
    if (this.constructor === BaseCommand) {
      throw new Error('Can\'t instantiate abstract command!')
    }

    this.bot.on(this.name, (args, msg, client) => {
      if (msg.channel.isPrivate && this.noPMs === true) {
        this.send(msg, 'You can\'t use this command in a DM!')
        return
      }
      this.message = msg
      this.client = client
      this.handle(args)
      this.logger.heard(msg)
    })
    this.aliases.forEach(a => this.bot.on(a, (s, m, c) => this.handle(s, m, c)))
  }
}

module.exports = BaseCommand
