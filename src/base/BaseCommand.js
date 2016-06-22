import moment from 'moment'

import AbstractCommand from './AbstractCommand'

class BaseCommand extends AbstractCommand {
  constructor () {
    super()
    if (this.constructor === BaseCommand) {
      throw new Error('Can\'t instantiate abstract command!')
    }

    this.bot.on(this.name, (args, msg, client) => {
      if (msg.channel.isPrivate && this.noPMs === true) {
        this.reply('You can\'t use this command in a DM!', 0, 5000)
        return false
      }
      if (!this.timer.hasOwnProperty(msg.author.id)) {
        this.timer[msg.author.id] = +moment()
      } else {
        const diff = moment().diff(moment(this.timer[msg.author.id]), 'seconds')
        if (diff < this.cooldown) {
          this.reply(`**${msg.author.username}**, please cool down! (**${this.cooldown - diff}** seconds left)`, 0, 5000)
          return false
        } else {
          this.timer[msg.author.id] = +moment()
        }
      }
      this.message = msg
      this.client = client
      this.handle(args)
      this.logger.heard(msg)
      this.bot.emit('command', this.name)
    })
    this.aliases.forEach(a => this.bot.on(a, (s, m, c) => this.handle(s, m, c)))
  }
}

module.exports = BaseCommand
