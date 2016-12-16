const logger = require('winston')
const chalk = require('chalk')

module.exports = {
  priority: 6,
  process: async container => {
    const { settings, msg, modules, client, isPrivate } = container
    const { prefix } = settings
    const defPrefix = process.env.CLIENT_PREFIX

    if (msg.content.startsWith(prefix) || msg.content.startsWith(defPrefix)) return container

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
}
