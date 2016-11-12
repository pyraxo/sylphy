module.exports = {
  priority: 80,
  process: async container => {
    const { isCommand } = container
    if (!isCommand) return

    return container
  }
}
