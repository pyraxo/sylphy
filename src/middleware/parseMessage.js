module.exports = {
  name: 'parseMessage',
  priority: 10,
  process: container => {
    const { msg, client, commands } = container

    if (!msg.content.startsWith(client.prefix)) return Promise.resolve()

    const rawArgs = msg.content.substring(client.prefix.length).split(' ')
    container.trigger = rawArgs[0].toLowerCase()
    container.isCommand = commands.has(container.trigger)
    container.rawArgs = rawArgs.slice(1).filter(v => v)
    return Promise.resolve(container)
  }
}
