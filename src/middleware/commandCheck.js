const chalk = require('chalk')
const logger = require('winston')

module.exports = {
  priority: 100,
  process: async container => {
    const { msg, isPrivate, isCommand } = container
    if (!isCommand) return
    logger.info(`${chalk.bold.magenta(
      !isPrivate
      ? msg.guild.name
      : '(in PMs)'
    )} > ${chalk.bold.green(msg.author.username)}: ` +
    `${chalk.bold.blue(msg.cleanContent.replace(/\n/g, ' '))}`)

    return container
  }
}
