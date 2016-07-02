import _ from 'lodash'

import AdminCommand from '../../Base/AdminCommand'

class PluginDisable extends AdminCommand {
  get name () {
    return 'reload'
  }

  get description () {
    return 'Reloads all plugins'
  }

  get usage () {
    return '[command]'
  }

  get hidden () {
    return true
  }

  get adminOnly () {
    return true
  }

  handle (args) {
    this.bot.once('clear.plugins', count => {
      this.client.createMessage(this.message.channel.id, `ℹ  Reloaded **${count}** plugins`)
      this.logger.info(`${this.message.author.username} reloaded all ${count} plugins`)
    })
    this.bot.reloadPlugins()
  }
}

module.exports = PluginDisable
