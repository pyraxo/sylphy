const logger = require('winston')

const Command = require('./Command')
const UsageManager = require('../managers/UsageManager')

class MultiCommand extends Command {
  constructor (...args) {
    super(...args)

    this.userStates = new Map()
  }

  _verify (options) {
    super._verify(options)
    const { types = {}, hasMain = false } = options
    if (hasMain) types['default'] = 'default'
    this.types = types

    let usage = { name: 'action', type: 'string', choices: Object.keys(types) }
    if (hasMain) {
      usage.optional = true
      usage.default = 'default'
    }
    this.usage = usage
    this.resolver.load(usage)

    this.resolvers = {}
    if (typeof types !== 'object') throw new Error(`${this.name} menu has invalid states`)
    for (let type in types) {
      let name = type
      let usage = []
      if (Array.isArray(types[type])) {
        usage = types[type]
      } else {
        if (typeof types[type] === 'object') {
          name = types[type].name || name
          usage = types[type].usage || usage
        } else if (typeof types[type] === 'string') {
          name = types[type]
        } else {
          throw new TypeError('Usage must be object, string or array')
        }
      }
      if (typeof this[name] !== 'function') {
        throw new Error(`No function found named ${name}`)
      }
      let resolver = new UsageManager(this.bot)
      resolver.load(usage)
      this.resolvers[type] = { resolver, name }
    }
  }

  handle (container, responder) {
    const type = container.args.action
    const usage = this.resolvers[type]
    usage.resolver.resolve(container.msg, container.rawArgs.slice(1), {
      prefix: container.settings.prefix,
      command: `${container.trigger} ${type}`
    }).then((args = {}) => {
      for (let key in args) {
        container.args[key] = args[key]
      }
      try {
        this[usage.name](container, responder)
      } catch (err) {
        logger.error(`Failed to run ${this.labels[0]} ${type}`)
        logger.error(err)
      }
    }).catch(err => {
      return responder.format('emoji:fail').send(err.message || err)
    })
  }
}

module.exports = MultiCommand
