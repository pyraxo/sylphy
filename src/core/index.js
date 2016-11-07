const extensions = require('./base')

let exported = {
  ShardManager: require('./managers/ShardManager'),
  Automaton: require('./Automaton')
}

for (let type in extensions) {
  exported[type] = extensions[type]
}

module.exports = exported
