const { configDB } = require('../core/system/Database')

module.exports = {
  priority: 80,
  process: async (container, resolve) => {
    const { isCommand } = container
    if (isCommand) {

    }
    return resolve(container)
  }
}
