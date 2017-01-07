module.exports = {
  name: 'commandLogger',
  priority: 100,
  process: container => {
    const { msg, isPrivate, isCommand, logger } = container
    if (!isCommand || !logger) return Promise.resolve()

    const curry = (color) => (str) => logger[color](logger.bold(str))

    logger.info(
      curry('magenta')(!isPrivate ? msg.guild.name : '(in PMs)') + ' > ' +
      curry('green')(msg.author.username) + ': ' +
      curry('blue')(msg.cleanContent.replace(/\n/g, ' '))
    )
    return Promise.resolve(container)
  }
}
