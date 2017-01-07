module.exports = {
  name: 'parseMessage',
  priority: 10,
  process: container => {
    const { msg, client, commands } = container
  
    for (const prefix of commands.prefixes.keys()) {
      if (!msg.content.startsWith(prefix)) continue
      const rawArgs = msg.content.substring(prefix.length).split(' ')
      container.trigger = rawArgs[0].toLowerCase()
      container.isCommand = commands.has(container.trigger)
      container.rawArgs = rawArgs.slice(1).filter(v => v)
      return Promise.resolve(container)
    }
    
    return Promise.resolve()
  }
}
