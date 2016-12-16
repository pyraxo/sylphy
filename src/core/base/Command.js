const logger = require('winston')
const moment = require('moment')

const { Responder, Collection } = require('../util')
const Resolver = require('../managers/Resolver')
const Base = require('./Base')

class Command extends Base {
  constructor (bot, group, ...args) {
    super(bot)
    if (this.constructor === Command) {
      throw new Error('Cannot instantiate abstract Command')
    }

    this.group = group
    this.resolver = new Resolver(bot)
    this.responder = new Responder(this)
    this.subcommands = new Collection()

    const options = args.reduce((p, c) => Object.assign(c, p), {})
    this._verify(options, ...args)

    this.timers = new Map()
  }

  _verify ({
    name,
    aliases = [],
    cooldown = 5,
    usage = [],
    options = {},
    subcommands = {},
    subcommand
  } = {}) {
    this.labels = typeof name === 'string'
    ? [name].concat(aliases)
    : (Array.isArray(aliases) && aliases.length > 0 ? aliases : [])

    if (this.labels.length === 0) {
      throw new Error(`${this.constructor.name} command is not named`)
    }
    this.cooldown = cooldown
    this.options = options
    if (this.options.modOnly) {
      this.options.permissions = (this.options.permissions || []).concat('manageGuild')
    }

    this.usage = usage
    this.localeKey = options.localeKey
    this.resolver.load(usage)

    for (const command in subcommands) {
      const name = subcommands[command].name || command
      for (const alias of [name].concat(subcommands[command].aliases || [])) {
        this.subcommands.set(alias, {
          usage: subcommands[command].usage || [], name
        })
      }
    }
    this.subcommand = subcommand
  }

  _execute (container) {
    const responder = this.responder.create(container)

    let usage = this.usage
    let process = 'handle'

    const subcmd = this.subcommand ? this.subcommand : container.rawArgs[0]
    const cmd = this.subcommands.get(subcmd)
    if (cmd) {
      usage = cmd.usage
      process = cmd.name
      container.rawArgs = container.rawArgs.slice(this.subcommand ? 0 : 1)
      container.trigger += ' ' + subcmd
    }

    if (!this._execCheck(container, responder)) return

    this.resolver.resolve(container.msg, container.rawArgs, {
      prefix: container.settings.prefix,
      command: container.trigger
    }, usage).then((args = {}) => {
      container.args = args
      this[process](container, responder).catch(err => {
        logger.error(`Rejection from ${this.labels[0]}`)
        logger.error(err)
      })
    }).catch(err => {
      return responder.error(err.message || err.err || err, err)
    })
  }

  _execCheck ({ msg, isPrivate, admins, client }, responder) {
    const isAdmin = admins.includes(msg.author.id)
    const { adminOnly, guildOnly, permissions = [], botPerms = [] } = this.options
    if (adminOnly === true && !isAdmin) return false
    if (guildOnly === true && isPrivate) return false

    if (permissions.length && !this.hasPermissions(msg.channel, msg.author, ...permissions)) {
      responder.error('{{%NO_PERMS}}', {
        perms: permissions.map(p => `\`${p}\``).join(', ')
      })
      return false
    }

    if (botPerms.length && !this.hasPermissions(msg.channel, client.user, ...botPerms)) {
      responder.error('{{%NO_PERMS_BOT}}', {
        perms: botPerms.map(p => `\`${p}\``).join(', ')
      })
      return false
    }

    if (isAdmin) return true
    const awaitID = msg.channel.id + msg.author.id
    if (this.cooldown > 0) {
      if (!this.timers.has(awaitID)) {
        this.timers.set(awaitID, +moment())
      } else {
        const diff = moment().diff(moment(this.timers.get(awaitID)), 'seconds')
        if (diff < this.cooldown) {
          responder.error('{{%COOLDOWN}}', {
            delay: 0,
            deleteDelay: 5000,
            time: `**${this.cooldown - diff}**`
          })
          return false
        } else {
          this.timers.delete(awaitID)
          this.timers.set(awaitID, +moment())
        }
      }
    }
    return true
  }

  async handle () { return true }

  logError (err) {
    logger.error(`Error running ${this.labels[0]} command: ${err}`)
  }

  get permissionNode () {
    return `${this.group}.${this.labels[0]}`
  }
}

module.exports = Command
