const path = require('path')
const requireAll = require('require-all')

let exported = {
  Command: require('./base/Command'),
  Module: require('./base/Module'),
  ShardManager: require('./managers/ShardManager'),
  Automaton: require('./Automaton')
}

const extensions = requireAll(path.join(__dirname, 'extensions'))
for (let type in extensions) {
  exported[type] = extensions[type]
}

module.exports = exported
