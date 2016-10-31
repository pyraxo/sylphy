module.exports = {
  priority: 2,
  process: async (container, resolve) => {
    const { msg } = container
    container.isPrivate = !msg.guild
    return resolve(container)
  }
}
