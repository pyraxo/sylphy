module.exports = {
  priority: 6,
  process: async (container, resolve, reject) => {
    const { settings, msg, manager } = container
    const { prefix } = settings
    const defPrefix = process.env.CLIENT_PREFIX

    if (!msg.content.startsWith(prefix) && !msg.content.startsWith(defPrefix)) {
      return reject()
    }

    const chk = msg.content.startsWith(prefix)
    const trigger = msg.content.substring((chk ? prefix : defPrefix).length).split(' ')[0]
    container.trigger = trigger.toLowerCase()
    container.isCommand = manager.has(container.trigger)
    return resolve(container)
  }
}
