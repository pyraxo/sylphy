module.exports = {
  priority: 2,
  process: (container) => {
    const { msg } = container
    container.isPrivate = !msg.guild
    return Promise.resolve(container)
  }
}
