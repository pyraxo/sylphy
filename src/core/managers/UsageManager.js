const path = require('path')
const requireAll = require('require-all')

class UsageManager {
  constructor (bot) {
    this.bot = bot
    this._resolvers = {}
    const resolvers = requireAll(path.join(__dirname, 'resolvers'))
    for (let resolver in resolvers) {
      resolver = resolvers[resolver]
      if (!resolver.resolve || !resolver.type) continue
      this._resolvers[resolver.type] = resolver
    }
  }

  load (usage) {
    if (!Array.isArray(usage)) usage = [usage]

    usage.map(args => {
      if (!args.name) throw new Error('Argument specified in usage has no name')
      if (!args.types) args.types = [ args.type || 'string' ]
      if (!args.displayName) args.displayName = args.name
    })
    this.minArgs = usage.filter(arg => !arg.optional).length
    this.usage = usage
  }

  async execResolve (type, content, arg, msg) {
    const resolver = this._resolvers[type]
    if (typeof resolver === 'undefined') {
      throw new TypeError('Invalid resolver type')
    }
    try {
      return await resolver.resolve(content, arg, msg, this.bot)
    } catch (err) {
      throw new TypeError(`Invalid input: ${err.message.replace('{arg}', '**`' + (arg.displayName || 'argument') + '`**')}`)
    }
  }

  async resolve (message, rawArgs, data = {}) {
    if (!this.usage.length) return {}

    const argsCount = rawArgs.length
    const requiredArgs = this.minArgs
    const optionalArgs = argsCount - requiredArgs

    if (argsCount < requiredArgs) {
      let reply = `Insufficient arguments - Expected at least **${requiredArgs}**, saw **${argsCount}**.`
      if (data.prefix && data.command) {
        reply += `\n**Correct usage**: \`${data.prefix}${data.command} ${(this.usage.length
        ? this.usage.map(arg => arg.optional ? `[${arg.displayName}]` : `<${arg.name}>`).join(' ')
        : '')}\``
      }
      throw new Error(reply)
    }

    let args = {}
    let idx = 0
    let optArgs = 0
    let resolves = []
    for (const arg of this.usage) {
      if (arg.optional) {
        if (optionalArgs > optArgs) {
          optArgs++
        } else {
          if (arg.default) args[arg.name] = arg.default
          continue
        }
      }
      let rawArg = rawArgs[idx]
      if (typeof rawArg !== 'undefined') {
        if (rawArg.startsWith('"')) {
          const endQuote = rawArgs.findIndex((str, i) => str.endsWith('"') && i >= idx)
          if (endQuote > -1) {
            rawArg = rawArgs.slice(idx, endQuote + 1).join(' ').replace(/"/g, '')
            idx = endQuote
          } else {
            throw new RangeError('Missing end quote')
          }
        }
      }
      idx++
      resolves.push(
        this.resolveArg(arg, rawArg, message).then(res => {
          args[arg.name] = res
          return res
        })
      )
    }
    return Promise.all(resolves).then(() => args)
  }

  resolveArg (arg, rawArg, msg) {
    return Promise.all(arg.types.map(type => this.execResolve(type, rawArg, arg, msg)))
    .then(results => results[0])
  }
}

module.exports = UsageManager
