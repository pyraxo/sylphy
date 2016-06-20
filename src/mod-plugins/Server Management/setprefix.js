import path from 'path'
import jsonfile from 'jsonfile'

import async from 'async'

import AdminCommand from '../../Base/AdminCommand'

class SetPrefix extends AdminCommand {
  get name () {
    return 'setprefix'
  }

  get description () {
    return 'Sets a custom prefix for your server'
  }

  handle (args) {
    const serverSettings = path.join(this.bot.dbPath, 'server-settings', `${this.message.server.id}.json`)
    async.waterfall([
      cb => {
        this.bot.userStates.add(this.message.sender)
        this.bot.verifyServerSettings(serverSettings)
        .then(() => cb(null))
        .catch(err => cb(err))
      },
      cb => {
        jsonfile.readFile(serverSettings, (err, data) => {
          if (err) return cb(err)
          return cb(null, data)
        })
      },
      (data, cb) => {
        this.await([
          '\nℹ  **Prefix Customisation Menu**\n',
          'Which prefix would you like you to edit?',
          'Choices: `admin`, `normal`'
        ].join('\n'),
        m => m.content.toLowerCase() === 'admin' || m.content.toLowerCase() === 'normal')
        .then(msg => cb(null, msg, data))
        .catch(err => cb(err))
      },
      (msg, data, cb) => {
        const setting = msg.content.toLowerCase() === 'admin' ? 'admin_prefix' : 'prefix'
        this.await([
          `ℹ  The current **${setting}** is **${data[setting]}**.`,
          `Please enter the new prefix:`
        ].join('\n'),
        m => /^.+$/.test(m.content), 'That prefix is not allowed. Try another one!', msg)
        .then(msg => cb(null, data, setting, msg))
        .catch(err => cb(err))
      },
      (data, setting, msg, cb) => {
        data[setting] = msg.content
        jsonfile.writeFile(serverSettings, data, { spaces: 2 }, err => {
          if (err) return cb(err)
          return cb(null, msg.content)
        })
      },
      (prefix, cb) => {
        this.reply([
          `✅  Success! Changed prefix to **${prefix}**`
        ].join('\n'))
        .then(() => cb(null))
        .catch(err => cb(err))
      }
    ], err => {
      this.bot.userStates.remove(this.message.sender)
      if (err) this.reply(`❎  **Error**: ${err}`)
    })
  }
}

module.exports = SetPrefix
