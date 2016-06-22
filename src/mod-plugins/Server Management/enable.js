import _ from 'lodash'

import AdminCommand from '../../Base/AdminCommand'

class PluginEnable extends AdminCommand {
  get name () {
    return 'enable'
  }

  get description () {
    return 'Enables all or specific commands for the channel'
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
      if (settings.ignored[this.message.channel.id] === true) {
        this.reply(`ℹ  All commands have been enabled on this channel.`)
        return
      } else if (settings.ignored[this.message.channel.id] === false) {
        this.reply(`❎  Please enable all commands on this channel first!`)
        return
      }
      let answered = false
      for (let mod in this.bot.plugins) {
        for (let command in this.bot.plugins[mod]) {
          command = this.bot.plugins[mod][command]
          if (command.name === args[0]) {
            if (Array.isArray(settings.ignored[this.message.channel.id])) {
              _.pull(settings.ignored[this.message.channel.id], command.name)
            } else if (settings.ignored[this.message.channel.id] === false) {
              settings.ignored[this.message.channel.id] = []
            }
            this.reply(`🔉  Enabled **${command.name}** on this channel.`)
            answered = true
          }
        }
      }
      if (answered === false) {
        this.reply(`Command \`${args[0]}\` not found. Aliases aren't allowed.`)
        return
      }
    } else {
      delete settings.ignored[this.message.channel.id]
      this.reply(`🔉  Enabled all commands on this channel.`)
    }
    this.saveSettings(settings)
    .then(() => this.logger.info(`Saved server settings ${settings.id}`))
    .catch(err => this.logger.error(`Error saving settings ${settings.id}: ${err}`))
  }
}

module.exports = PluginEnable
