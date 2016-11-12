const extensions = require('./base')
const util = require('./util')

let exported = {
  ShardManager: require('./managers/ShardManager'),
  Automaton: require('./Automaton')
}

for (let type in extensions) {
  exported[type] = extensions[type]
}

for (let type in util) {
  exported[type] = util[type]
}

module.exports = exported
