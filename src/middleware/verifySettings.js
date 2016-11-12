module.exports = {
  priority: 5,
  process: async container => {
    const { client, msg, isPrivate, data, db } = container
    try {
      if (isPrivate) {
        let channel = await client.getDMChannel(msg.author.id)
        container.settings = new db.Guild({ id: channel.id })
        return container
      }
      let settings = await data.Guild.fetch(msg.guild.id)
      if (!settings) {
        settings = new db.Guild({ id: msg.guild.id })
        await settings.save()
      }
      container.settings = settings
      return container
    } catch (err) {
      throw err
    }
  }
}
