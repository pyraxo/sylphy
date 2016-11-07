const Command = require('./Command')

class MultiCommand extends Command {
  constructor (...args) {
    super(...args)

    this.userStates = new Map()
  }

  _verify (options) {
    super._verify(options)

    const { types = {}, hasMain = false } = options
    if (typeof types !== 'object') throw new Error(`${this.name} menu has invalid states`)
    for (let type in types) {
      if (typeof this[type] !== 'function') {
        throw new Error(`No function found named ${types[type]}`)
      }
    }
    if (hasMain) types['default'] = 'default'
    this.types = types

    let usage = { name: 'action', type: 'string', choices: Object.keys(types) }
    if (hasMain) {
      usage.optional = true
      usage.default = 'default'
    }
    this.usage = [usage].concat(this.usage)
    this.usageParser.load(this.usage)
  }

  handle (container, responder) {
    const type = this.types[container.args.action]
    return this[type](container, responder)
  }
}

module.exports = MultiCommand
