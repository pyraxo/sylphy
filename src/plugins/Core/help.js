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
    return ['commands']
  }

  handle (args) {
    this.db.get(`server:${this.message.server.id}:settings`, 'prefix')
    .then(prefix => {
      if (prefix === null) {
        this.db.set(`server:${this.message.server.id}:settings`, 'prefix', this.bot.config.discord.prefix)
        prefix = this.bot.config.discord.prefix
      }
      if (args[0]) {
        let answered = false
        for (let mod in this.bot.plugins) {
          for (let command in this.bot.plugins[mod]) {
            command = this.bot.plugins[mod][command]
            if (command.hidden === true) continue
            if (command.name === args[0]) {
              if (typeof command.gif === 'string') {
                const imgPath = path.join(this.bot.dbPath, 'gif', command.gif)
                fs.access(imgPath, fs.F_OK, err => {
                  if (err) {
                    this.logger.error(`Gif not found: ${imgPath}`)
                    return
                  }
                  this.client.sendFile(this.message, imgPath, command.gif, [
                    `**${prefix}${command.name}** ${command.usage ? `\`${command.usage}\`` : ''}`,
                    command.description,
                    command.cooldown ? `**Cooldown**: ${command.cooldown} seconds` : ''
                  ])
                  answered = true
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
          this.client.sendMessage(this.message, `Command \`${args[0]}\` not found. Aliases aren't allowed.`)
        }
      } else {
        let arr = [
          '__**Commands List**__\n',
          '*Don\'t include the example brackets when using commands!*\n',
          `Use \`${prefix}help <command name>\` to get more info on a specific command.`,
          `For example: \`${prefix}help rank\`\n`
        ]

        for (let mod in this.bot.plugins) {
          if (Object.keys(this.bot.plugins[mod]) === 0) continue
          let reply = [`**${mod} - **`]
          for (let command in this.bot.plugins[mod]) {
            command = this.bot.plugins[mod][command]
            if (command.hidden === true) continue
            reply.push(`\`${command.name}\` `)
          }
          arr.push(reply.join(''))
        }

        this.reply(arr.join('\n'))
      }
    })
  }
}

module.exports = Help
