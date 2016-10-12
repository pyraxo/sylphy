module.exports = {
  priority: 2,
  process: function (obj, done) {
    const { msg } = obj
    obj.isPrivate = !msg.channel.guild
    return done(null, obj)
  }
}
