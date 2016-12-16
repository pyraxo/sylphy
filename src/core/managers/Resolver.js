const path = require('path')
const requireAll = require('require-all')

class Resolver {
  constructor (bot) {
    this.bot = bot
    this._resolvers = {}
    this.loadResolvers()
  }

  loadResolvers () {
    const resolvers = requireAll(path.join(__dirname, 'resolvers'))
    for (let resolver in resolvers) {
      resolver = resolvers[resolver]
      if (!resolver.resolve || !resolver.type) continue
      this._resolvers[resolver.type] = resolver
    }
  }

  load (data) {
    this.usage = this.verify(data)
  }

  verify (usage) {
    return (Array.isArray(usage) ? usage : [usage]).map(args => {
      if (!args.name) throw new Error('Argument specified in usage has no name')
      if (!args.types) args.types = [ args.type || 'string' ]
      if (!args.displayName) args.displayName = args.name
      return args
    })
  }

  resolve (message, rawArgs, data = {}, usage = this.usage) {
    usage = this.verify(usage)
    if (!usage.length) return Promise.resolve()

    const argsCount = rawArgs.length
    const requiredArgs = usage.filter(arg => !arg.optional).length
    const optionalArgs = argsCount - requiredArgs

    if (argsCount < requiredArgs) {
      let msg = '{{%resolver.INSUFFICIENT_ARGS}}'
      if (data.prefix && data.command) {
        msg += `\n\n**{{%resolver.CORRECT_USAGE}}**: \`${data.prefix}${data.command} ` + (usage.length
        ? usage.map(arg => arg.optional ? `[${arg.displayName}]` : `<${arg.displayName}>`).join(' ')
        : '') + '`'
      }
      return Promise.reject({
        message: msg,
        requiredArgs: `**${requiredArgs}**`,
        argsCount: `**${argsCount}**.`
      })
    }

    let args = {}
    let idx = 0
    let optArgs = 0
    let resolves = []
    let skip = false
    for (const arg of usage) {
      let rawArg
      if (arg.last) {
        rawArg = rawArgs.slice(idx).join(' ')
        skip = true
      } else {
        if (arg.optional) {
          if (optionalArgs > optArgs) {
            optArgs++
          } else {
            if (arg.default) args[arg.name] = arg.default
            continue
          }
        }
        rawArg = rawArgs[idx]
        if (typeof rawArg !== 'undefined') {
          if (rawArg.startsWith('"')) {
            const endQuote = rawArgs.findIndex((str, i) => str.endsWith('"') && i >= idx)
            if (endQuote > -1) {
              rawArg = rawArgs.slice(idx, endQuote + 1).join(' ').replace(/"/g, '')
              idx = endQuote
            } else {
              return Promise.reject('{{%resolver.NO_END_QUOTE}}')
            }
          }
        }
        idx++
      }
      resolves.push(
        Promise.all(arg.types.map(type => {
          const resolver = this._resolvers[type]
          if (typeof resolver === 'undefined') {
            return Promise.reject({ err: 'Invalid resolver type' })
          }
          return resolver.resolve(rawArg, arg, message, this.bot)
          .catch(err => Object.assign(arg, {
            arg: `**\`${arg.name || 'argument'}\`**`,
            err: err.message ? err.message : `{{%resolver.${err}}}` +
            (data.prefix && data.command
            ? `\n\n**{{%resolver.CORRECT_USAGE}}**: \`${data.prefix}${data.command} ` +
            (usage.length ? usage.map(arg =>
              skip ? arg.displayName
              : (arg.optional ? `[${arg.displayName}]` : `<${arg.displayName}>`)
            ).join(' ') : '') + '`'
            : '')
          }))
        }))
        .then(results => {
          const resolved = results.filter(v => !v.err)

          if (resolved.length) {
            const res = resolved.length === 1
            ? resolved[0]
            : resolved.reduce((p, c) => p.concat(c), [])
            args[arg.name] = res
            return res
          }

          return Promise.reject(results[0])
        })
      )
      if (skip) break
    }
    return Promise.all(resolves).then(() => args)
  }
}

module.exports = Resolver
