import path from 'path'
import fs from 'fs'

import BaseCommand from '../../Base/BaseCommand'

class Help extends BaseCommand {
  get name () {
    return 'help'
  }

  get description () {
    return 'Displays a list of commands. Provide a command to get its info'
  }

  get usage () {
    return '[command]'
  }

  get aliases () {
    return ['h', 'commands']
  }

  get gif () {
    return 'more-help.gif'
  }

  handle (args) {
    const settings = this.getSettings()
    const prefix = settings.prefix
    if (args[0]) {
      let answered = false
      for (let plugin in this.bot.plugins) {
        for (let command in this.bot.plugins[plugin]) {
          command = this.bot.plugins[plugin][command]
          if (command.hidden === true) continue
          if (command.name === args[0]) {
            if (typeof command.gif === 'string') {
              const imgPath = path.join(this.bot.dbPath, 'gif-help', command.gif)
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
        '__**Commands List**__\n',
        '*Don\'t include the example brackets when using commands!*\n',
        `Use \`${prefix}help <command name>\` to get more info on a specific command.`,
        `For example: \`${prefix}help rank\`\n`
      ]

      for (let plugin in this.bot.plugins) {
        let reply = [`**${plugin} - **`]
        for (let command in this.bot.plugins[plugin]) {
          command = this.bot.plugins[plugin][command]
          if (command.hidden === true) continue
          reply.push(`\`${command.name}\` `)
        }
        if (reply.length > 1) {
          arr.push(reply.join(''))
        }
      }
      arr.push(`\nTo view mod commands, use \`${settings.admin_prefix}help\``)

      const imgPath = path.join(this.bot.dbPath, 'gif-help', this.gif)
      fs.access(imgPath, fs.F_OK, err => {
        if (err) {
          this.logger.error(`Gif not found: ${imgPath}`)
          this.reply(arr.join('\n'))
          return
        }
        this.upload(imgPath, 'more.gif')
        .then(() => this.reply(arr.join('\n')))
      })
    }
  }
}

module.exports = Help
