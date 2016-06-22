import async from 'async'

import AdminCommand from '../../Base/AdminCommand'

class SetPrefix extends AdminCommand {
  get name () {
    return 'setprefix'
  }

  get description () {
    return 'Sets a custom prefix for your server'
  }

  get permissions () {
    return ['manageChannels']
  }

  handle (args) {
    const serverSettings = this.getSettings()
    async.waterfall([
      cb => {
        this.bot.busyUsers.add(this.message.sender)
        this.await([
          '\nℹ  **Prefix Customisation Menu**\n',
          'Which custom prefix would you like you to edit?',
          'Choices: `admin`, `normal`'
        ].join('\n'),
        m => m.content.toLowerCase() === 'admin' || m.content.toLowerCase() === 'normal')
        .then(msg => cb(null, msg))
        .catch(err => cb(err))
      },
      (msg, cb) => {
        const setting = msg.content.toLowerCase() === 'admin' ? 'admin_prefix' : 'prefix'
        this.await([
          `ℹ  The current custom **${setting}** is **${serverSettings[setting]}**.`,
          `Please enter the new prefix:`
        ].join('\n'),
        m => /^.+$/.test(m.content), 'That prefix is not allowed. Try another one!', msg)
        .then(msg => cb(null, setting, msg))
        .catch(err => cb(err))
      },
      (setting, msg, cb) => {
        serverSettings[setting] = msg.content
        this.saveSettings(serverSettings).then(() => cb(null, msg.content)).catch(err => cb(err))
      },
      (prefix, cb) => {
        this.reply([
          `✅  Success! Changed custom prefix to **${prefix}**`
        ].join('\n'))
        .then(() => cb(null))
        .catch(err => cb(err))
      }
    ], err => {
      this.bot.busyUsers.remove(this.message.sender)
      if (err) this.logger.error(`Error reading ${serverSettings}: ${err}`)
    })
  }
}

module.exports = SetPrefix
