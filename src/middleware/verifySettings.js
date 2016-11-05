module.exports = {
  priority: 5,
  process: async container => {
    const { client, msg, isPrivate, db } = container
    try {
      if (isPrivate) {
        let channel = await client.getDMChannel(msg.author.id)
        container.settings = new db.Guild({ id: channel.id })
        return container
      }
      try {
        let settings = await db.Guild.get(msg.guild.id).run()
        container.settings = settings
        return container
      } catch (err) {
        if (err.name === 'DocumentNotFoundError') {
          let settings = new db.Guild({ id: msg.guild.id })
          await settings.save()
          container.settings = settings
          return container
        }
        throw err
      }
    } catch (err) {
      throw err
    }
  }
}
