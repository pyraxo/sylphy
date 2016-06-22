import _ from 'lodash'

import AdminCommand from '../../Base/AdminCommand'

class PluginDisable extends AdminCommand {
  get name () {
    return 'disable'
  }

  get description () {
    return 'Disables all or specific commands for the channel'
  }

  get usage () {
    return '[command]'
  }

  get permissions () {
    return ['manageChannel']
  }

  handle (args) {
    const settings = this.getSettings()
    if (args[0]) {
      let answered = false
      for (let mod in this.bot.plugins) {
        for (let command in this.bot.plugins[mod]) {
          command = this.bot.plugins[mod][command]
          if (command.name === args[0]) {
            if (Array.isArray(settings.ignored[this.message.channel.id])) {
              _.pull(settings.ignored[this.message.channel.id], command.name)
              settings.ignored[this.message.channel.id].push(command.name)
            } else {
              settings.ignored[this.message.channel.id] = [command.name]
            }
            this.reply(`🔇  Disabled **${command.name}** on this channel.`)
            answered = true
          }
        }
      }
      if (answered === false) {
        this.reply(`Command \`${args[0]}\` not found. Aliases aren't allowed.`)
        return
      }
    } else {
      settings.ignored[this.message.channel.id] = true
      this.reply(`🔇  Disabled all commands on this channel.`)
    }
    this.saveSettings(settings)
    .then(() => this.logger.info(`Saved server settings ${settings.id}`))
    .catch(err => this.logger.error(`Error saving settings ${settings.id}: ${err}`))
  }
}

module.exports = PluginDisable
