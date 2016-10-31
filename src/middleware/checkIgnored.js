const { baseDB } = require('../core/system/Database')

module.exports = {
  priority: 7,
  process: async (container, resolve, reject) => {
    const { settings, msg, trigger, isPrivate } = container
    if (msg.author.bot) return reject()
    if (isPrivate) return resolve(container)

    let multi = baseDB.multi().sismember('exclude:users', msg.author.id)
    if (settings) {
      multi.sismember(`settings:${msg.guild.id}:ignoredUsers`, msg.author.id)
      .sismember(`settings:${msg.guild.id}:ignoredChannels`, msg.channel.id)
      .sismember(`settings:${msg.guild.id}:ignoredCommands`, trigger)
      .sismember(`settings:${msg.guild.id}:${msg.channel.id}:ignoredCommands`, trigger)
    }
    try {
      let replies = await multi.execAsync()
      container.args = msg.content.split(' ').splice(1).filter(v => !v)
      if (replies[2] && trigger === trigger.toUpperCase()) return resolve(container)
      if (replies.some(r => r === 1)) return reject()
      return resolve(container)
    } catch (err) {
      return reject(err)
    }
  }
}
