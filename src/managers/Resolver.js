let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const { requireRecursive, Collection } = require('../util')

/** Resolver manager for resolving usages */
class Resolver extends Collection {
  /**
   * Creates a new Resolver instance
   * @arg {Client} client Client instance
   */
  constructor (client) {
    super()
    this._client = client
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
    const resolvers = requireRecursive(path)
    for (const name in resolvers) {
      const resolver = resolvers[name]
      if (!resolver.resolve || !resolver.type) continue
      this.set(resolver.type, resolver)
    }
    return resolvers
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
   * @arg {Object} data Additional data
   * @arg {String} data.prefix The client's prefix
   * @arg {String} data.command The command trigger
   * @arg {CommandUsage[]} [usage=this.usage] Array of CommandUsage objects
   * @returns {Promise<Object>}
   */
  resolve (message, rawArgs, data, rawUsage = this.usage) {
    let args = {}

    const usage = this.verify(rawUsage)
    if (!usage.length) return Promise.resolve(args)

    const argsCount = rawArgs.length
    const requiredArgs = usage.filter(arg => !arg.optional).length
    const optionalArgs = argsCount - requiredArgs

    if (argsCount < requiredArgs) {
      return Promise.reject({
        message: 'INSUFFICIENT_ARGS',
        requiredArgs: `**${requiredArgs}**`,
        argsCount: `**${argsCount}**.`,
        usage: this.getUsage(this.usage, data)
      })
    }

    let idx = 0
    let optArgs = 0
    let resolves = []
    let skip = false
    for (const arg of usage) {
      let rawArg = rawArgs[idx]
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
        if (typeof rawArg !== 'undefined') {
          if (rawArg.startsWith('"')) {
            const endQuote = rawArgs.findIndex((str, i) => str.endsWith('"') && i >= idx)
            if (endQuote > -1) {
              rawArg = rawArgs.slice(idx, endQuote + 1).join(' ').replace(/"/g, '')
              idx = endQuote
            } else {
              return Promise.reject({ message: 'NO_END_QUOTE' })
            }
          }
        }
        idx++
      }
      resolves.push(this._resolveArg(arg, rawArg, message, data, usage).then(res => {
        args[arg.name] = res
        return res
      }))
      if (skip) break
    }
    return Promise.all(resolves).then(() => args)
  }

  _resolveArg (arg, rawArg, message, data, usage) {
    const resolves = arg.types.map(type => {
      const resolver = this.get(type)
      if (!resolver) {
        return Promise.resolve({ err: 'Invalid resolver type' })
      }
      return resolver.resolve(rawArg, arg, message, this._client)
      .catch(err => {
        let error
        let resp = arg
        if (err.message) {
          for (const key in err) {
            if (key === 'message') continue
            error = err[key]
          }
        } else {
          error = err
        }
        return Object.assign(resp, {
          arg: `**\`${arg.name || 'argument'}\`**`,
          err: error
        })
      })
    })
    return Promise.all(resolves).then(results => {
      const resolved = results.filter(v => !v.err)
      if (resolved.length) {
        const res = resolved.length === 1 ? resolved[0] : resolved.reduce((arr, c) => arr.concat(c), [])
        return res
      }
      let err = results[0].err
      if (err instanceof Error) {
        return Promise.reject({ message: 'PARSING_ERROR', err })
      }
      return Promise.reject(Object.assign(results[0], {
        message: err,
        arg: `**\`${arg.name || 'argument'}\`**`,
        usage: this.getUsage(this.usage, data)
      }))
    })
  }

  /**
   * Gets a command usage
   * @arg {CommandUsage[]} [usage=this.usage] Array of CommandUsage objects
   * @arg {Object} data Additional data
   * @arg {String} data.prefix The client's prefix
   * @arg {String} data.command The command trigger
   * @returns {String}
   */
  getUsage (usage = this.usage, { prefix, command } = {}) {
    const argsUsage = usage.map(arg =>
      arg.last ? arg.displayName : arg.optional ? `[${arg.displayName}]` : `<${arg.displayName}>`
    ).join(' ')
    return `${prefix}${command}` + (usage.length ? ' ' + argsUsage : '')
  }
}

module.exports = Resolver
