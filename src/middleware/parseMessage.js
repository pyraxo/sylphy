module.exports = {
  priority: 6,
  process: async container => {
    const { settings, msg, commander } = container
    const { prefix } = settings
    const defPrefix = process.env.CLIENT_PREFIX

    if (!msg.content.startsWith(prefix) && !msg.content.startsWith(defPrefix)) {
      return
    }

    const chk = msg.content.startsWith(prefix)
    const trigger = msg.content.substring((chk ? prefix : defPrefix).length).split(' ')[0]
    container.trigger = trigger.toLowerCase()
    container.isCommand = commander.has(container.trigger)
    container.rawArgs = msg.content.split(' ').splice(1).filter(v => !!v)
    return container
  }
}
