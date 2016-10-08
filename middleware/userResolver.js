module.exports = {
  priority: 20,
  process: function (obj, done) {
    const { msg, args } = obj
    args.forEach((elem, idx) => {
      let matches = elem.match(/^<@!*(\d{17,18})>$/i)
      if (matches) {
        const member = msg.channel.guild.members.find(m => m.id === matches[1])
        if (member) {
          args[idx] = member
          args[idx].isMember = true
          args[idx].isChannel = false
          args[idx].toString = () => member.user.username
        }
      } else {
        const nickMatch = msg.channel.guild.members.find(m => m.nick === elem)
        const nameMatch = msg.channel.guild.members.find(m => m.user.username === elem)
        args[idx] = nickMatch || nameMatch || args[idx]
        args[idx].isMember = !!nickMatch || !!nameMatch
        args[idx].isChannel = false
        args[idx].toString = () => args[idx].user.username
      }
    })
    obj.args = args
    return done(null, obj)
  }
}
