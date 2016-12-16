const emojis = require('node-emoji')
const { padEnd } = require('./Util')
const emoji = require('./Emojis')

class Responder {
  constructor (command) {
    this.command = command
    this.i18n = command.i18n

    this.responseMethods = {
      send: (msg, res) => res,
      reply: (msg, res) => `**${msg.author.username}**, ${res}`,
      success: (msg, res) => `${emoji.success}  |  **${msg.author.username}**, ${res}`,
      error: (msg, res) => `${emoji.error}  |  **${msg.author.username}**, ` + (res || '{{%ERROR}}')
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

  create ({ msg: message, settings }, data) {
    let responder = (...args) => responder.send(...args)
    responder.command = this.command
    responder.message = message
    responder.settings = settings
    responder.data = data
    responder._options = {}

    responder.responseMethods = this.responseMethods
    responder.formatMethods = this.formatMethods

    const copy = ['_send', 't', 'clean', 'typing', 'format', 'file', 'embed', 'dialog', 'selection']
    copy.forEach(prop => { responder[prop] = this[prop].bind(responder) })

    for (let method in this.responseMethods) {
      responder[method] = responder._send.bind(responder, method)
    }

    return responder
  }

  t (content = '', tags = {}) {
    const cmd = this.command
    const file = cmd.name ? cmd.name.split(':')[0] : (cmd.labels ? cmd.labels[0] : 'common')
    return cmd.i18n.parse(content, cmd.localeKey || file || null, this.settings.lang, tags)
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

    const promise = (options.DM ? this.command.bot.getDMChannel(message.author.id) : Promise.resolve(message.channel))
    .then(channel => this.command.send(channel, response, options))

    delete this._formats
    this._options = {}

    return promise
  }

  clean () {
    delete this._formats
    return this
  }

  typing () {
    return this.message.channel.sendTyping()
  }

  format (formats) {
    this._formats = (formats instanceof Array) ? formats : [formats]
    return this
  }

  file (name, file) {
    this._options.file = { name, file }
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
      const input = this.command.resolver
      if (Array.isArray(prompt) && prompt.length) {
        prompt[0] = `**${prompt[0]}**`
      }

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
        try {
          var ans = await collector.next()
          if (ans.content.toLowerCase() === cancel) return Promise.reject()
          try {
            return await input.resolve(ans, [ans.cleanContent], data, dialog.input)
          } catch (err) {
            let p2 = await this.format('emoji:error').send(
              `${err.err || err.message || err || '{{%menus.ERROR}}'}\n\n{{%menus.EXIT}}`,
              Object.assign(err, { cancel: `\`${cancel}\`` })
            )
            return awaitMessage(p2)
          }
        } catch (o) {
          return Promise.reject(o)
        } finally {
          this.command.deleteMessages(msg, ans)
        }
      }

      try {
        Object.assign(args, await awaitMessage())
        collector.stop()
      } catch (err) {
        if (typeof err !== 'undefined') {
          this.error(`{{%menus.ERRORED}} **{{%collector.${err.reason}}}**`, {
            [err.reason]: err.arg, err: `**${err.reason}**`
          })
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

  async selection (selections = [], options = {}) {
    if (!Array.isArray(selections)) return [selections, 0]
    if (!selections.length) return []
    if (selections.length === 1) return [selections[0], 0]

    const { title = '{{%menus.SELECTION}}', footer = '{{%menus.INPUT}}', mapFunc } = options
    const choices = (mapFunc ? selections.map(mapFunc) : selections).splice(0, 10)

    try {
      const { reply } = await this.dialog([{
        prompt: [
          '```markdown',
          `### ${title} ###\n`,
          choices.map((c, i) => `${padEnd(`[${i + 1}]:`, 4)} ${c}`).join('\n'),
          selections.length > 10 ? '{{%menus.MORE_RESULTS}}\n' : '',
          Array.isArray(footer) ? footer.join('\n') : '> ' + footer,
          '```'
        ].join('\n'),
        input: { type: 'int', name: 'reply', min: 1, max: choices.length }
      }], Object.assign(options, {
        num: selections.length - 10, cancel: options.cancel || 'cancel'
      }))
      return [selections[reply - 1], reply - 1]
    } catch (err) {
      return []
    }
  }
}

module.exports = Responder
