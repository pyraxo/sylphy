import path from 'path'

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
      for (let plugin in this.bot.modPlugins) {
        for (let command in this.bot.modPlugins[plugin]) {
          command = this.bot.modPlugins[plugin][command]
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

      for (let plugin in this.bot.modPlugins) {
        let reply = [`**${plugin} - **`]
        for (let command in this.bot.modPlugins[plugin]) {
          command = this.bot.modPlugins[plugin][command]
          if (command.hidden === true) continue
          reply.push(`\`${command.name}\` `)
        }
        if (reply.length > 1) {
          arr.push(reply.join(''))
        }
      }
      arr.push(`\nTo view standard commands, use \`${settings.prefix}help\``)

      this.reply(arr.join('\n'))
    }
  }
}

module.exports = Help
