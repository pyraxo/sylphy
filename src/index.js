const Core = require('./core')
const Client = function Client (opts) {
  return new Core.Client(opts)
}

module.exports = Object.assign(Client, Core, require('./util'))
