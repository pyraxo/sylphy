import path from 'path'
import fs from 'fs'
import BaseCommand from '../.Base/BaseCommand'

class Help extends BaseCommand {
  get name () {
    return 'help'
  }

  get description () {
    return 'Displays most of the commands. If a command is specified, gives info on that command.'
  }

  get usage () {
    return ''
  }

  handle (suffix, msg, client) {
    if (suffix) {
      let answered = false
      for (let mod in this.bot.modules) {
        for (let command in this.bot.modules[mod]) {
          command = this.bot.modules[mod][command]
          if (command.hidden === true) continue
          if (command.name === suffix) {
            const imgPath = path.join(this.bot.dbPath, 'gif', command.gif)
            fs.access(imgPath, fs.F_OK, err => {
              if (err) {
                this.bot.error(`Gif not found: ${imgPath}`)
                return
              }
              client.sendFile(msg, imgPath, command.gif, [
                `\`${this.bot.config.prefix}${command.name} ${command.usage}\``,
                command.description,
                `**Cooldown**: ${command.cooldown} seconds`
              ])
              answered = true
            })
          }
        }
      }
      if (answered === false) {
        client.sendMessage(msg, `Command \`${suffix}\` not found. Aliases aren't allowed.`)
      }
    }
    let arr = [
      '__**Tatsumaki Commands List**__\n',
      '*Don\'t include the example brackets when using commands!*\n',
      `Use \`${this.bot.config.prefix}help <command name>\` to get more info on a specific command.`,
      `For example: \`${this.bot.config.prefix}help rank\`\n`
    ]

    for (let mod in this.bot.modules) {
      if (Object.keys(this.bot.modules[mod]) === 0) continue
      let reply = [`**${mod} - **`]
      for (let command in this.bot.modules[mod]) {
        command = this.bot.modules[mod][command]
        if (command.hidden === true) continue
        reply.push(`\`${command.name}\` `)
      }
      arr.push(reply.join(''))
    }

    client.sendMessage(msg, arr.join('\n'))
  }
}

module.exports = Help
