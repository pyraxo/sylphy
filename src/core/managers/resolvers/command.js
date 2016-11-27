module.exports = {
  type: 'command',
  resolve: (content, { group }, msg, { engine }) => {
    const command = engine.commands.get(content)
    if (!command || (command.adminOnly && !process.env.ADMIN_IDS.split(', ').includes(msg.author.id))) {
      return Promise.reject('command.NOT_FOUND')
    }
    return Promise.resolve(command)
  }
}
