module.exports = {
  type: 'command',
  resolve: async (content, { group }, msg, { engine }) => {
    const command = engine.commands.get(content)
    if (!command || (command.adminOnly && !process.env.ADMIN_IDS.split(', ').includes(msg.author.id))) {
      throw new Error('No command found named {arg}')
    }
    return command
  }
}
