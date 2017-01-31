module.exports = {
  name: 'commandLogger',
  priority: 100,
  process: container => {
    const { msg, isPrivate, isCommand, logger } = container
    if (!isCommand || !logger) return Promise.resolve()
    logger.info(
      (!isPrivate ? msg.channel.guild.name : '(in PMs)') + ' > ' +
      msg.author.username + ': ' +
      msg.cleanContent.replace(/\n/g, ' ')
    )
    return Promise.resolve(container)
  }
}
