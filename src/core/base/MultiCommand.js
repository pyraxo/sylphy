const logger = require('winston')

const Command = require('./Command')
const UsageManager = require('../managers/UsageManager')

class MultiCommand extends Command {
  constructor (...args) {
    super(...args)

    this.userStates = new Map()
  }

  registerSubcommand (type) {
    if (!type || typeof this.types === 'undefined') return
    let resolver = this.resolvers[type]
    if (typeof resolver === 'undefined') throw new Error(`${type} is an invalid type`)
    this.resolver = resolver.resolver
    this.type = resolver.name
  }

  registerSubcommands (types, defaultAction) {
    if (defaultAction) {
      if (typeof this[defaultAction] !== 'function') throw new Error(`${defaultAction} is not a function`)
      types['default'] = defaultAction
    }
    this.types = types

    let usage = { name: 'action', type: 'string', choices: Object.keys(types) }
    if (defaultAction) {
      usage.optional = true
      usage.default = 'default'
    }
    this.usage = usage
    this.resolver.load(usage)

    this.resolvers = {}
    if (typeof types !== 'object') throw new Error(`${this.name} menu has invalid types`)
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
    const resolver = this.type ? this.resolver : this.resolvers[type].resolver
    const command = this.type ? container.trigger : `${container.trigger} ${type}`
    resolver.resolve(container.msg, container.rawArgs.slice(1), {
      prefix: container.settings.prefix, command
    }).then((args = {}) => {
      for (let key in args) {
        container.args[key] = args[key]
      }
      try {
        this[this.type || this.resolvers[type].name](container, responder)
      } catch (err) {
        logger.error(`Failed to run ${command}`)
        logger.error(err)
      }
    }).catch(err => {
      return responder.format('emoji:fail').send(err.message || err)
    })
  }
}

module.exports = MultiCommand
