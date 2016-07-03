import moment from 'moment'

import AbstractCommand from './AbstractCommand'

class AdminCommand extends AbstractCommand {
  constructor () {
    super()
    if (this.constructor === AdminCommand) {
      throw new Error('Can\'t instantiate abstract command!')
    }

    this.commander.on(`msg.${this.name.toUpperCase()}`, (args, msg, client) => {
      this.message = msg
      this.client = client
      if (!this.bot.config.discord.admins.find(i => i === msg.author.id)) {
        if (this.adminOnly === true) return
        const perms = msg.member.permission.json
        if (this.permissions.length > 0 && this.permissions.some(p => !perms[p])) {
          this.reply(`**${msg.author.username}**, you do not have enough permissions!`, 0, 5000)
          return false
        }
      }
      if (msg.isPrivate && this.noPMs === true) {
        this.reply('You can\'t use this command in a DM!', 0, 5000)
        return false
      }
      if (!this.timer.has(msg.author.id)) {
        this.timer.set(msg.author.id, +moment())
      } else {
        const diff = moment().diff(moment(this.timer.get(msg.author.id)), 'seconds')
        if (diff < this.cooldown) {
          this.reply(`**${msg.author.username}**, please cool down! (**${this.cooldown - diff}** seconds left)`, 0, 5000)
          return false
        } else {
          this.timer.delete(msg.author.id)
          this.timer.set(msg.author.id, +moment())
        }
      }
      this.handle(args)
      this.logger.heard(msg)
      this.bot.emit('command', this.name.toUpperCase())

      if (this.stats) {
        // Metrics stuff go here
      }
    })
    this.aliases.forEach(a => this.bot.on(a, args => this.handle(args)))
  }

  get permissions () {
    return []
  }

  get noPMs () {
    return true
  }

  get adminOnly () {
    return false
  }
}

module.exports = AdminCommand
