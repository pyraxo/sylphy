module.exports = {
  type: 'command',
  resolve: (content, args, msg, { plugins }) => {
    const commander = plugins.get('commands')
    if (!commander) {
      return Promise.reject('command.NO_COMMANDER')
    }
    const command = commander.get(content.toLowerCase())
    return !command ||
    ((command.options || {}).adminOnly && !process.env.ADMIN_IDS.split(', ').includes(msg.author.id))
    ? Promise.reject('command.NOT_FOUND')
    : Promise.resolve(command)
  }
}
