const logger = require('winston')
const chalk = require('chalk')

module.exports = {
  priority: 6,
  process: async container => {
    const { settings, msg, commander, modules, client, isPrivate } = container
    const { prefix } = settings
    const defPrefix = process.env.CLIENT_PREFIX

    if (!msg.content.startsWith(prefix) && !msg.content.startsWith(defPrefix)) {
      if (!msg.mentions.find(u => u.id === client.user.id)) return
      const mention = msg.content.split(' ')[0]
      if (!mention.match(new RegExp('<@!*' + client.user.id + '>'))) return

      const cleverbot = modules.get('cleverbot')
      if (!cleverbot) return
      await cleverbot.respond(msg.cleanContent.split(' ').slice(1).join(' '), msg.channel)

      logger.info(`${chalk.bold.magenta(
        !isPrivate
        ? msg.guild.name
        : '(in PMs)'
      )} > ${chalk.bold.green(msg.author.username)}: ` +
      `${chalk.bold.yellow(msg.cleanContent.replace(/\n/g, ' '))}`)
      return
    }

    const chk = msg.content.startsWith(prefix)
    const trigger = msg.content.substring((chk ? prefix : defPrefix).length).split(' ')[0]
    container.trigger = trigger.toLowerCase()
    container.isCommand = commander.has(container.trigger)
    container.rawArgs = msg.content.split(' ').splice(1).filter(v => !!v)
    return container
  }
}
