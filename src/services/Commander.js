import { EventEmitter2 as EventEmitter } from 'eventemitter2'

class Commander extends EventEmitter {
  constructor (client, config, guildSettings) {
    super({ wildcard: true })
    this.client = client
    this.ignoredUsers = new Set()
    this.config = config
    this.guildSettings = guildSettings
  }

  handle (msg) {
    if (msg.author.bot === true || this.ignoredUsers.has(msg.author.id)) return
    if (msg.channel.guild === null) { // isPrivate
      if (msg.content.startsWith(this.config.discord.prefix)) {
        const trigger = msg.content.toLowerCase().split(' ')[0].substring(this.config.discord.prefix.length)
        const args = msg.content.split(' ').splice(1)
        msg.isPrivate = true
        this.emit(`msg:${trigger}`, args, msg, this.client)
      }
      return
    }
    let trigger = ''

    const settings = this.guildSettings.get(msg.channel.guild.id)
    if (msg.content.startsWith(settings.prefix)) {
      trigger = msg.content.toLowerCase().split(' ')[0].substring(settings.prefix.length)
    } else if (msg.content.startsWith(settings.admin_prefix)) {
      trigger = msg.content.toUpperCase().split(' ')[0].substring(settings.admin_prefix.length)
    } else if (msg.content.startsWith(this.config.discord.prefix)) {
      trigger = msg.content.toLowerCase().split(' ')[0].substring(this.config.discord.prefix.length)
    } else if (msg.content.startsWith(this.config.discord.admin_prefix)) {
      trigger = msg.content.toUpperCase().split(' ')[0].substring(this.config.discord.admin_prefix.length)
    } else {
      return
    }

    if (settings.ignored[msg.channel.id] === true && trigger !== trigger.toUpperCase()) return

    if (Array.isArray(settings.ignored[msg.channel.id]) && settings.ignored[msg.channel.id].find(c => c === trigger)) return
    const args = msg.content.split(' ').splice(1)
    args.forEach((elem, idx) => {
      let matches = elem.match(/^<@!*(\d{17,18})>$/i)
      if (matches) {
        const user = this.client.users.find(u => u.id === matches[1])
        if (user) args[idx] = user
      }
    })
    this.emit(`msg:${trigger}`, args, msg, this.client)
  }
}

module.exports = Commander
