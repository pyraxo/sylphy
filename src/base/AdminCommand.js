import moment from 'moment'

import AbstractCommand from './AbstractCommand'

class AdminCommand extends AbstractCommand {
  constructor () {
    super()
    if (this.constructor === AdminCommand) {
      throw new Error('Can\'t instantiate abstract command!')
    }

    this.bot.on(this.name.toUpperCase(), (args, msg, client) => {
      this.message = msg
      this.client = client
      const perms = msg.channel.permissionsOf(msg.sender)
      if (this.permissions.length > 0 && this.permissions.some(p => !perms.hasPermission(p))) {
        this.reply(`**${msg.sender.name}**, you do not have enough permissions!`)
        return false
      }
      if (msg.channel.isPrivate) {
        this.reply('You can\'t use this command in a DM!')
        return false
      }
      if (!this.timer.hasOwnProperty(msg.sender.id)) {
        this.timer[msg.sender.id] = +moment()
      } else {
        const diff = moment().diff(moment(this.timer[msg.sender.id]), 'seconds')
        if (diff < this.cooldown) {
          this.reply(`**${msg.sender.name}**, please cool down! (**${this.cooldown - diff}** seconds left)`)
          .then(msg => client.deleteMessage(msg, { wait: 5000 }))
          return false
        } else {
          this.timer[msg.sender.id] = +moment()
        }
      }
      this.handle(args)
      this.logger.heard(msg)
      this.bot.emit('command', this.name.toUpperCase())
    })
    this.aliases.forEach(a => this.bot.on(a, (s, m, c) => this.handle(s, m, c)))
  }

  get permissions () {
    return []
  }

  get noPMs () {
    return true
  }
}

module.exports = AdminCommand
