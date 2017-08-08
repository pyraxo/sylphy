module.exports = {
  type: 'channel',
  resolve: (content, { text, voice } = {}, msg) => {
    const guild = msg.channel.guild
    if (!msg.channelMentions.length) {
      content = String(content).toLowerCase()
      let channels = guild.channels.filter(c => {
        if (text && c.type !== 0) return
        if (voice && c.type !== 2) return
        const name = c.name.toLowerCase()
        return name === content || name.includes(content)
      })
      if (channels.length) {
        return Promise.resolve(channels)
      } else {
        return Promise.reject('channel.NOT_FOUND')
      }
    } else {
      let chan = guild.channels.get(msg.channelMentions[0])
      if (!chan) return Promise.reject('channel.NOT_FOUND')
      return Promise.resolve([chan])
    }
  }
}
