import path from 'path'
import fs from 'fs'

import AdminCommand from '../../Base/AdminCommand'

class Help extends AdminCommand {
  get name () {
    return 'help'
  }

  get description () {
    return 'Displays a list of moderation commands. Provide a command to get its info'
  }

  get usage () {
    return '[command]'
  }

  get aliases () {
    return ['h', 'commands']
  }

  handle (args) {
    const settings = this.getSettings()
    const prefix = settings.admin_prefix
    if (args[0]) {
      let answered = false
      for (let mod in this.bot.modPlugins) {
        for (let command in this.bot.modPlugins[mod]) {
          command = this.bot.modPlugins[mod][command]
          if (command.hidden === true) continue
          if (command.name === args[0]) {
            if (typeof command.gif === 'string') {
              const imgPath = path.join(this.bot.dbPath, 'gif', command.gif)
              this.upload(imgPath, command.gif)
              .then(msg => {
                this.reply([
                  `**${prefix}${command.name}** ${command.usage ? `\`${command.usage}\`` : ''}`,
                  command.description,
                  command.cooldown ? `**Cooldown**: ${command.cooldown} seconds` : ''
                ].join('\n'))
              })
            } else {
              this.reply([
                `**${prefix}${command.name}** ${command.usage ? `\`${command.usage}\`` : ''}`,
                command.description,
                command.cooldown ? `**Cooldown**: ${command.cooldown} seconds` : ''
              ].join('\n'))
              answered = true
            }
          }
        }
      }
      if (answered === false) {
        this.reply(`Command \`${args[0]}\` not found. Aliases aren't allowed.`)
      }
    } else {
      let arr = [
        '__**Moderation Commands List**__\n',
        '*Don\'t include the example brackets when using commands!*\n',
        `Use \`${prefix}help <command name>\` to get more info on a specific command.`,
        `For example: \`${prefix}help rank\`\n`,
        '**Web Dashboard** is available at **<http://tatsumaki.xyz>**\n'
      ]

      for (let mod in this.bot.modPlugins) {
        if (Object.keys(this.bot.modPlugins[mod]) === 0) continue
        let reply = [`**${mod} - **`]
        for (let command in this.bot.modPlugins[mod]) {
          command = this.bot.modPlugins[mod][command]
          if (command.hidden === true) continue
          reply.push(`\`${command.name}\` `)
        }
        arr.push(reply.join(''))
      }
      arr.push(`\nTo view standard commands, use \`${settings.prefix}help\``)

      this.reply(arr.join('\n'))
    }
  }
}

module.exports = Help
