const extensions = require('./base')
const util = require('./util')

module.exports = Object.assign({
  ShardManager: require('./managers/ShardManager'),
  Automaton: require('./Automaton')
}, extensions, util)
