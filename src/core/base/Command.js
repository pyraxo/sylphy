const path = require('path')
const logger = require('winston')
const moment = require('moment')

const { Emojis: emoji, Localisation } = require('../util')
const UsageManager = require('../managers/UsageManager')

class Command {
  constructor (bot, options, ...args) {
    if (this.constructor === Command) {
      throw new Error('Cannot instantiate abstract Command')
    }

    this.bot = bot
    this.client = bot.client
    this.resolver = new UsageManager(bot)
    this._verify(options, ...args)

    this.responseMethods = {
      send: (msg, res) => res,
      reply: (msg, res) => `**${msg.author.username}**, ${res}`,
      success: (msg, res) => `${emoji.success}  |  **${msg.author.username}**, ${res}`,
      error: (msg, res) => `${emoji.fail}  |  **${msg.author.username}**, ` +
      res || 'an error occurred! Please try again later.'
    }

    this.formatMethods = {
      bold: (res) => `**${res}**`,
      italic: (res) => `*${res}*`,
      underline: (res) => `__${res}__`,
      strikethrough: (res) => `~~${res}~~`,
      inlineCode: (res) => `\`${res}\``,
      code: (res, type = '') => `\`\`\`${type}\n${res}\n\`\`\``,
      emoji: (res, type) => `${emoji[type] || emoji.success}  |  ${res}`
    }

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
    usage = []
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

    this.usage = usage
    this.resolver.load(usage)

    let title = this.labels[0]
    let locales = this.i18n = new Localisation(path.join(this.bot.paths.resources, 'i18n', title))
    locales.init()
  }

  _createResponder ({ msg, rawArgs, settings }) {
    let responder = (...args) => responder.send(...args)

    for (let method in this.responseMethods) {
      responder[method] = (response, options = {}, ...args) => {
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

        delete responder._formats
        delete responder._file
        let prom = (options.DM ? this.client.getDMChannel(msg.author.id) : Promise.resolve(msg.channel))
        .then(channel => this.send(channel, response, options, ...args))

        prom.catch(err => logger.error(`${this.labels[0]} command failed to call ${method} - ${err}`))

        return prom
      }
    }

    responder.format = (formats) => {
      formats = (formats instanceof Array) ? formats : [formats]
      responder._formats = formats.reverse()
      return responder
    }

    responder.file = (attachment, filename) => {
      responder._file = { attachment, filename }
      return responder
    }

    responder.prompt = (prompt, check, options = {}) => {
      let method = options.method && this.responseMethods[options.method] ? options.method : 'send'
      delete options.method
      options.exit = options.exit || 'exit'

      // TODO: check if bot has delete perms, if yes send prompt message
      return responder[method](prompt, options).then(qn => {
        return this.prompt(msg, check, options, () => {
          responder.error(
            options.errorMsg ||
            `that is an invalid response. Please try again or type **\`${options.exit}\`** to quit.`
          )
        }, qn).catch(err => {
          if (!err) return null
          throw err.message || err
        })
      }, err => {
        logger.error(`Error sending prompt for ${this.labels[0]} - ${err}`)
      })
    }

    return responder
  }

  _execute (container) {
    const responder = this._createResponder(container)

    if (!this._execCheck(container, responder)) return

    this.resolver.resolve(container.msg, container.rawArgs, {
      prefix: container.settings.prefix,
      command: container.trigger
    }).then((args = {}) => {
      container.args = args
      try {
        this.handle(container, responder)
      } catch (err) {
        logger.error(`Failed to run ${this.labels[0]}`)
        logger.error(err)
      }
    }).catch(err => {
      return responder.error(err.message || err)
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
          responder.reply(
            `please cool down! (**${this.cooldown - diff}** seconds left)`,
            {}, { delay: 0, deleteDelay: 5000 }
          )
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

  handle () { return true }

  async send (channel, content, file = null, { lang = 'en' } = {}, { delay = 0, deleteDelay = 0, tags = {} } = {}) {
    if (delay) {
      await Promise.delay(delay)
    }

    if (Array.isArray(content)) content = content.join('\n')
    content = this.i18n.parse(content, lang, tags)
    content = content.match(/(.|[\r\n]){1,2000}/g)

    try {
      let replies = await Promise.mapSeries(content, (c, idx) => {
        return channel.createMessage(c, idx === 0 ? file : null).then(m => {
          if (deleteDelay) {
            setTimeout(() => m.delete(), deleteDelay)
          }
          return m
        })
      })
      // TODO: resolve the array directly instead of checking if length is 1 then resolve first msg
      return replies.length > 1 ? replies : replies[0]
    } catch (err) {
      throw err
    }
  }

  prompt (msg, check, opts, failcheck, prompt) {
    const checkType = typeof check
    if (checkType === 'undefined') {
      throw new TypeError('Supplied check is not a function')
    }
    const checkMsg = checkType === 'string'
    ? (msg) => msg.content === check
    : checkType === 'number'
    ? (msg) => parseInt(msg.content, 10) === check
    : () => true
    const id = msg.channel.id + msg.author.id
    return this.bot.engine.bridge.collect(id, checkMsg, opts, failcheck, prompt)
  }

  // Utility
  parseNumber (number) {
    if (typeof number === 'number') number = number.toString()
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  locateUser ({ msg, isPrivate }, query) {
    query = query.toLowerCase()
    if (isPrivate) return msg.author
    const guild = msg.guild
    const isInString = (str, query) => str === query || str.startsWith(query) || str.includes(query)
    const member = guild.members.find(m => {
      if (m.nick && isInString(m.nick.toLowerCase(), query)) return true
      return isInString(m.user.username.toLowerCase(), query)
    })
    return member ? member.user : null
  }

  logError (err) {
    logger.error(`Error running ${this.labels[0]} command: ${err}`)
  }
}

module.exports = Command
