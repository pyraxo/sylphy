module.exports = {
  type: 'member',
  resolve: (content, { bot = false }, msg) => {
    const guild = msg.guild
    content = String(content).toLowerCase()
    let user = content.match(/^<@!?(\d{17,18})>$/) || content.match(/^(\d{17,18})$/)
    if (!user) {
      let members = guild.members.filter(m => {
        if (!bot && m.user.bot) return
        const name = m.user.username.toLowerCase()
        const nick = m.nick ? m.nick.toLowerCase() : name
        const discrim = m.user.discriminator
        return name === content || nick === content ||
        `${name}#${discrim}` === content ||
        `${nick}#${discrim}` === content ||
        name.includes(content) ||
        nick.includes(content)
      })
      if (members.length) {
        return Promise.resolve(members)
      } else {
        return Promise.reject('member.NOT_FOUND')
      }
    } else {
      let member = guild.members.get(user[1])
      if (!member) return Promise.reject('member.NOT_FOUND')
      return Promise.resolve([member])
    }
  }
}
