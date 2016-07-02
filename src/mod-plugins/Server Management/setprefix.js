import async from 'async'

import AdminCommand from '../../Base/AdminCommand'

class SetPrefix extends AdminCommand {
  get name () {
    return 'setprefix'
  }

  get description () {
    return 'Sets a custom prefix for your guild'
  }

  get permissions () {
    return ['manageChannels']
  }

  handle (args) {
    const guildSettings = this.getSettings()
    async.waterfall([
      cb => {
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
          `ℹ  The current custom **${setting}** is **${guildSettings[setting]}**.\n`,
          `Please enter the new prefix:`
        ].join('\n'),
        m => /^.+$/.test(m.content), 'That prefix is not allowed. Try another one!', msg)
        .then(msg => cb(null, setting, msg))
        .catch(err => cb(err))
      },
      (setting, msg, cb) => {
        guildSettings[setting] = msg.content
        this.saveSettings(guildSettings).then(() => cb(null, msg.content)).catch(err => cb(err))
      },
      (prefix, cb) => {
        this.reply([
          `✅  Success! Changed custom prefix to **${prefix}**`
        ].join('\n'))
        .then(() => cb(null))
        .catch(err => cb(err))
      }
    ], err => {
      if (err) this.logger.error(`Error reading ${guildSettings}: ${err}`)
    })
  }
}

module.exports = SetPrefix
