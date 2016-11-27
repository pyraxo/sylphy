const logger = require('winston')
const moment = require('moment')

const { Responder } = require('../util')
const UsageManager = require('../managers/UsageManager')
const Base = require('./Base')

class Command extends Base {
  constructor (bot, options, ...args) {
    super(bot)
    if (this.constructor === Command) {
      throw new Error('Cannot instantiate abstract Command')
    }

    this.resolver = new UsageManager(bot)
    this.responder = new Responder(this)
    this._verify(options, ...args)

    this.timers = new Map()
  }

  _verify ({
    name,
    aliases = [],
    description = 'No description',
    guildOnly = false,
    adminOnly = false,
    hidden = false,
    cooldown = 5,
    usage = [],
    enableLocales = true,
    localeKey
  } = {}) {
    this.labels = typeof name === 'string'
    ? [name].concat(aliases)
    : (Array.isArray(aliases) && aliases.length > 0 ? aliases : [])

    if (this.labels.length === 0) {
      throw new Error(`${this.constructor.name} command is not named`)
    }
    this.description = String(description)
    this.guildOnly = guildOnly
    this.adminOnly = adminOnly
    this.cooldown = cooldown
    this.hidden = hidden
    this.localeKey = localeKey

    this.usage = usage
    this.resolver.load(usage)
  }

  createResponder ({ msg, rawArgs, settings, client }) {
    let responder = (...args) => responder.send(...args)
    const lang = settings.lang

    for (let method in this.responseMethods) {
      responder[method] = (response = '', options = {}) => {
        if (Array.isArray(response)) response = response.join('\n')
        response = this.responseMethods[method](msg, response)
        const formats = responder._formats
        if (formats) {
          for (let format of formats) {
            format = format.split(':')
            if (this.formatMethods[format[0]]) {
              response = this.formatMethods[format[0]](response, format[1])
            }
          }
        }
        if (responder._file) options.file = responder._file
        if (responder._embed) options.embed = responder._embed

        delete responder._formats
        delete responder._file
        delete responder._embed
        options.lang = lang

        let prom = (options.DM ? this.client.getDMChannel(msg.author.id) : Promise.resolve(msg.channel))
        .then(channel => this.send(channel, response, options))

        prom.catch(err => logger.error(`${this.labels[0]} command failed to call ${method} - ${err}`))

        return prom
      }
    }

    return responder
  }

  _execute (container) {
    const responder = this.responder.create(container.msg, container.settings)

    if (!this._execCheck(container, responder)) return

    this.resolver.resolve(container.msg, container.rawArgs, {
      prefix: container.settings.prefix,
      command: container.trigger
    }).then((args = {}) => {
      container.args = args
      this.handle(container, responder).catch(err => {
        logger.error(`Rejection from ${this.labels[0]}`)
        logger.error(err)
      })
    }).catch(err => {
      return responder.error(err.message || err.err || err, err)
    })
  }

  _execCheck ({ msg, isPrivate, admins }, responder) {
    const awaitID = msg.channel.id + msg.author.id

    if (this.cooldown > 0) {
      if (!this.timers.has(awaitID)) {
        this.timers.set(awaitID, +moment())
      } else {
        const diff = moment().diff(moment(this.timers.get(awaitID)), 'seconds')
        if (diff < this.cooldown) {
          responder.reply('{{%COOLDOWN}}', {
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
    if (this.adminOnly && !admins.includes(msg.author.id)) return false
    if (this.guildOnly && isPrivate) return false
    return true
  }

  async handle () { return true }

  logError (err) {
    logger.error(`Error running ${this.labels[0]} command: ${err}`)
  }
}

module.exports = Command
