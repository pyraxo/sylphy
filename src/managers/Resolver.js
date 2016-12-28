const { readdirRecursive } = require('../util')

/**
 * Resolver manager for resolving usages
 * @prop {Object} resolvers Object with resolver functions
 */
class Resolver {
  /**
   * Creates a new Resolver instance
   * @arg {Client} client Client instance
   */
  constructor (client) {
    this._client = client
    this.resolvers = {}
  }

  /**
   * Resolver function
   * @typedef {Object} ResolverObject
   * @prop {String} type Resolver type
   * @prop {Promise(Container)} resolve Promise that takes in {@link Container} as an argument and resolves a result
   */

  /**
   * Loads {@link ResolverObject|ResolverObjects} from a file path
   * @arg {String} path File path to load resolvers from
   * @returns {Promise<ResolverObject>}
   */
  loadResolvers (path) {
    return readdirRecursive(path).then(resolvers => {
      resolvers = resolvers.map(r => require(r))
      for (const name in resolvers) {
        const resolver = resolvers[name]
        if (!resolver.resolve || !resolver.type) continue
        this._resolvers[resolver.type] = resolver
      }
      return resolvers
    })
  }

  /**
   * Loads a command usage locally
   * @arg {CommandUsage} usage CommandUsage object to be loaded
   */
  load (data) {
    this.usage = this.verify(data)
  }

  /**
   * Verifies a {@link CommandUsage}
   * @arg {CommandUsage} usage CommandUsage object to be verified
   * @returns CommandUsage
   */
  verify (usage) {
    /**
     * An object documenting the requirements of a command argument
     * @namespace CommandUsage
     * @type {Object}
     */
    return (Array.isArray(usage) ? usage : [usage]).map(entry => {
      /**
       * The name of the argument
       * @type {String}
       * @memberof CommandUsage
       * @name name
       */
      if (!entry.name) {
        throw new Error('Argument specified in usage has no name')
      }
      /**
       * Single allowed argument type to be resolved
       * @type {String}
       * @memberof CommandUsage
       * @name type
       * @see {@link ResolverObject}
       */

      /**
       * Multiple allowed argument types to be resolved
       * @type {Array}
       * @memberof CommandUsage
       * @name types
       * @see {@link ResolverObject}
       */
      if (!entry.types) entry.types = [ entry.type || 'string' ]

      /**
       * The display name of the argument, to be used when displaying argument info
       * @type {?String}
       * @memberof CommandUsage
       * @name displayName
       */
      if (!entry.displayName) entry.displayName = entry.name
      return entry
    })
  }

  /**
   * Resolves a message
   * @arg {external:"Eris.Message"} message Eris message
   * @arg {String[]} args Array of strings, by default a message split by spaces, without command trigger and prefix
   * @arg {Object} [data] Additional data
   * @arg {String} [data.prefix] The client's prefix
   * @arg {String} [data.command] The command trigger
   * @arg {CommandUsage} [usage=this.usage] CommandUsage object
   * @returns {Promise<*, ResolverError>}
   */
  resolve (message, rawArgs, data = {}, rawUsage = this.usage) {
    const usage = this.verify(usage)
    if (!usage.length) return Promise.resolve()

    const argsCount = rawArgs.length
    const requiredArgs = usage.filter(arg => !arg.optional).length
    const optionalArgs = argsCount - requiredArgs

    // REDO
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
        })).then(results => {
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
