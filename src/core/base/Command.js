const logger = require('winston')
const moment = require('moment')

const { Emojis: emoji } = require('../util')
const UsageManager = require('../managers/UsageManager')

class Command {
  constructor (bot, options) {
    if (this.constructor === Command) {
      throw new Error('Must extend abstract Command')
    }

    this.bot = bot
    this.client = bot.client
    this.usageParser = new UsageManager()
    this._verify(options)

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

    this.usage = usage
    this.usageParser.load(usage)
  }

  generateExample (msg) {
    let ex = this.examples[~~(Math.random() * this.examples.length)]
    ex = this.usageParser.replace(ex, msg)
    return ex
  }

  _createResponder ({ msg, rawArgs }) {
    let responder = (...args) => responder.send(...args)

    const construct = (m, c, r, o, a) => {
      r = this.responseMethods[m](msg, r)
      const formats = responder._formats
      if (formats) {
        for (let format of formats) {
          format = format.split(':')
          if (this.formatMethods[format[0]]) {
            r = this.formatMethods[format[0]](r, format[1])
          }
        }
      }
      if (responder._file) o.file = responder._file

      delete responder._formats
      delete responder._file
      return this.send(c, r, o, ...a)
    }

    for (let method in this.responseMethods) {
      responder[method] = (response, options = {}, ...args) => {
        let prom = construct(method, msg.channel, response, options, args)
        prom.catch(err => logger.error(`${this.labels[0]} command failed to call ${method} - ${err}`))

        return prom
      }
    }
    responder.DM = (response, options = {}, ...args) => {
      let method = options.method && this.responseMethods[options.method] ? options.method : 'send'
      delete options.method
      let prom = this.client.getDMChannel(msg.author.id)
      .then(channel => construct(method, channel, response, options, args))

      prom.catch(err => logger.error(`${this.labels[0]} command failed to DM with method ${method} - ${err}`))
      return prom
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

    return responder
  }

  _execute (container) {
    const responder = this._createResponder(container)

    this.usageParser.resolve(container.message, container.rawArgs, {
      prefix: container.settings.prefix,
      command: container.trigger
    }).then((args = {}) => {
      container.args = args
      if (!this._execCheck(container, responder)) return

      this.handle(container, responder)
    }).catch(err => responder.format('emoji:fail').send(`Error resolving command: ${err.message || err}`))
  }

  _execCheck ({ msg, isPrivate }, responder) {
    const awaitID = msg.channel.id + msg.author.id

    if (this.cooldown > 0) {
      if (!this.timers.has(awaitID)) {
        this.timers.set(awaitID, +moment())
      } else {
        const diff = moment().diff(moment(this.timers.get(awaitID)), 'seconds')
        if (diff < this.cooldown) {
          responder.reply(
            `please cool down! (**${this.cooldown - diff}** seconds left)`,
            null, { delay: 0, deleteDelay: 5000 }
          )
          return false
        } else {
          this.timers.delete(awaitID)
          this.timers.set(awaitID, +moment())
        }
      }
    }
    if (this.guildOnly && isPrivate) return false
    return true
  }

  handle () { return true }

  async send (channel, content, file = null, { delay = 0, deleteDelay = 0 } = {}) {
    if (delay) {
      await Promise.delay(delay)
    }

    if (Array.isArray(content)) {
      content = content.join('\n')
    }
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
      // Might resolve the array directly instead of checking if length is 1 then resolve first msg
      return replies.length > 1 ? replies : replies[0]
    } catch (err) {
      throw err
    }
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
