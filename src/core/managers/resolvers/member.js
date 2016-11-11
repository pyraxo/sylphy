module.exports = {
  type: 'member',
  resolve: async (content, arg, msg) => {
    const guild = msg.guild
    if (typeof content === 'undefined') {
      throw new Error('No query supplied')
    }
    content = String(content).toLowerCase()
    let user = content.match(/^<@!?(\d{17,18})>$/) || content.match(/^(\d{17,18})$/)
    if (!user) {
      let members = guild.members.filter(m => {
        return m.user.username === content || m.nick === content ||
        `${m.user.username}#${m.user.discriminator}` === content ||
        `${m.nick}#${m.user.discriminator}` === content
      })
      if (members.length) {
        return members
      } else {
        throw new Error('{arg} not found')
      }
    } else {
      let member = guild.members.get(user[1])
      if (!member) throw new Error('{arg} not found')
      return member
    }
  }
}
