module.exports = {
  type: 'commandGroup',
  resolve: (content, args, msg, { plugins }) => {
    const commander = plugins.get('commands')
    if (!commander) {
      return Promise.reject('command.NO_COMMANDER')
    }
    const group = commander.find(c => c.group === content.toLowerCase())
    return group ? Promise.resolve(group) : Promise.reject('group.NOT_FOUND')
  }
}
