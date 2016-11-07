module.exports = {
  priority: 2,
  process: async (container) => {
    const { msg } = container
    container.isPrivate = !msg.guild
    return container
  }
}
