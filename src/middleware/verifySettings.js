module.exports = {
  priority: 5,
  process: async container => {
    const { client, msg, isPrivate, data } = container
    try {
      const Guild = data.Guild.model
      if (isPrivate) {
        let channel = await client.getDMChannel(msg.author.id)
        container.settings = new Guild({ id: channel.id })
        return container
      }
      let settings = await data.Guild.fetch(msg.guild.id)
      if (!settings) {
        settings = new Guild({ id: msg.guild.id })
        await settings.save()
      }
      container.settings = settings
      return container
    } catch (err) {
      throw err
    }
  }
}
