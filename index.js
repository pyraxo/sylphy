const Client = require('./src/Client')
const Core = require('./src/core')

function Sylphy (opts) {
  return new Client(opts)
}

module.exports = Object.assign(
  Sylphy, Core, { Client },
  require('./src/util'),
  require('./src/structures'),
  require('./src/managers')
)
