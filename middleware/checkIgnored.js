const _ = require('lodash')
const { baseDB } = require('../core/system/Database')

module.exports = {
  priority: 7,
  process: function (obj, done) {
    const { settings, msg, trigger } = obj
    if (msg.author.bot) return done(true)

    let multi = baseDB.multi().sismember('exclude:users', msg.author.id)
    if (settings) {
      multi.sismember(`settings:${msg.channel.guild.id}:ignoredUsers`, msg.author.id)
      .sismember(`settings:${msg.channel.guild.id}:ignoredChannels`, msg.channel.id)
      .sismember(`settings:${msg.channel.guild.id}:ignoredCommands`, trigger)
      .sismember(`settings:${msg.channel.guild.id}:${msg.channel.id}:ignoredCommands`, trigger)
    }
    multi.exec((err, replies) => {
      if (err) return done(err)
      obj.args = _.compact(msg.content.split(' ').splice(1))
      if (replies[2] && trigger === trigger.toUpperCase()) return done(null, obj)
      if (replies.some(r => r === 1)) return done(true)
      return done(null, obj)
    })
  }
}
