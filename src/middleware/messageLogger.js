const chalk = require('chalk')
const logger = require('winston')

module.exports = {
  priority: 100,
  process: function (obj, done) {
    const { msg, isPrivate, isCommand } = obj
    if (isCommand) {
      logger.info(`${chalk.bold.magenta(
        !isPrivate
        ? msg.guild.name
        : '(in PMs)'
      )} > ${chalk.bold.green(msg.author.username)}: ` +
      `${chalk.bold.blue(msg.cleanContent.replace(/\n/g, ' '))}`)
      return done(null, obj)
    }
    return done(true)
  }
}
