module.exports = {
  priority: 10,
  process: container => {
    const { settings, msg, commander } = container
    const { prefix } = settings
    const defPrefix = process.env.CLIENT_PREFIX

    const chk = msg.content.startsWith(prefix)
    const rawArgs = msg.content.substring((chk ? prefix : defPrefix).length).split(' ')
    container.trigger = rawArgs[0].toLowerCase()
    container.isCommand = commander.has(container.trigger)
    container.rawArgs = rawArgs.slice(1).filter(v => !!v)
    return Promise.resolve(container)
  }
}
