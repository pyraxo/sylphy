module.exports = {
  type: 'commandGroup',
  resolve: (content, args, msg, { commands }) => {
    const group = commands.find(c => c.group === content.toLowerCase())
    return group ? Promise.resolve(group) : Promise.reject('group.NOT_FOUND')
  }
}
