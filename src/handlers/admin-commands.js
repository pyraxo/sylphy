module.exports = function adminCommands () {
  this.on('RELOAD', (args, msg) => {
    if (!this.config.discord.admins.find(i => i === msg.author.id)) return
    this.once('clear.plugins', count => {
      this.client.createMessage(msg.channel.id, `ℹ  Reloaded **${count}** plugins`)
    })
    this.emit('reload.plugins')
  })
}
