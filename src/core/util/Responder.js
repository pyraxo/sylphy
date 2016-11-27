const emojis = require('node-emoji')

const emoji = require('./Emojis')
const UsageManager = require('../managers/UsageManager')

class Responder {
  constructor (command) {
    this.command = command
    this.i18n = command.i18n

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
      emoji: (res, type) => `${this.i18n.locate(type, emoji) || emojis.get(type) || emoji.success}  |  ${res}`
    }
  }

  create (message, settings, data) {
    let responder = (...args) => responder.send(...args)
    responder.command = this.command
    responder.message = message
    responder.settings = settings
    responder.data = data
    responder._options = {}

    responder.responseMethods = this.responseMethods
    responder.formatMethods = this.formatMethods

    const copy = ['_send', 'format', 'file', 'embed', 'dialog']
    copy.forEach(prop => { responder[prop] = this[prop].bind(responder) })

    for (let method in this.responseMethods) {
      responder[method] = responder._send.bind(responder, method)
    }

    return responder
  }

  _send (method, response = '', options = {}) {
    const message = this.message
    const formats = this._formats || []

    Object.assign(options, this._options || {})

    if (response instanceof Array) response = response.join('\n')
    response = this.command.t(response, this.settings.lang, options)
    response = this.responseMethods[method || 'send'](message, response)

    for (let format of formats) {
      format = format.split(':')
      response = this.formatMethods[format[0]](response, format[1])
    }

    const promise = (options.DM ? this.command.client.getDMChannel(message.author.id) : Promise.resolve(message.channel))
    .then(channel => this.command.send(channel, response, options))

    delete this._formats
    this._options = {}

    return promise
  }

  format (formats) {
    this._formats = (formats instanceof Array) ? formats : [formats]
    return this
  }

  file (attachment, filename) {
    this._options.file = { attachment, filename }
    return this
  }

  embed (embed) {
    this._options.embed = embed
    return this
  }

  async dialog (dialogs = [], options = {}) {
    const { message, data } = this
    const { tries = 10, time = 60, matches = 10, filter, cancel = 'cancel' } = options

    const args = {}
    let cancelled = false
    for (const dialog of dialogs) {
      let prompt = dialog.prompt
      const input = new UsageManager(this.command.bot)
      input.load(dialog.input)

      if (Array.isArray(prompt) && prompt.length) prompt[0] = `**${prompt[0]}**`
      let p1 = await this.send(prompt, options)
      const collector = this.command.bot.engine.bridge.collect({
        channel: message.channel.id,
        author: message.author.id,
        tries,
        time,
        matches,
        filter
      })

      const awaitMessage = async (msg) => {
        let ans
        try {
          ans = await collector.next()
          if (ans.content.toLowerCase() === options.cancel) return Promise.reject()
          try {
            return await input.resolve(ans, [ans.cleanContent], data)
          } catch (err) {
            let tags = err.tags || {}
            tags.cancel = `\`${cancel}\``
            let p2 = await this.format('emoji:fail').send(`${err.message || err}\n\n{{%menus.EXIT}}`, { tags })
            return awaitMessage(p2)
          }
        } catch (o) {
          return Promise.reject(o)
        } finally {
          this.command.deleteMessages([msg, ans])
        }
      }

      try {
        Object.assign(args, await awaitMessage())
        collector.stop()
      } catch (err) {
        if (err) {
          let tags = {}
          tags[err.reason] = err.arg
          this.error(`{{%menus.ERRORED}} **{{%collector.${err.reason}}}**`, { err: `**${err.reason}**`, tags })
        } else {
          this.success('{{%menus.EXITED}}')
        }
        collector.stop()
        cancelled = true
        break
      } finally {
        p1.delete()
      }
    }

    if (cancelled) return Promise.reject()
    return Promise.resolve(args)
  }
}

module.exports = Responder
