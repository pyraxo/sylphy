let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const { padEnd, emojis } = require('../util')

class Responder {
  constructor (command) {
    this.command = command
    this.i18n = command.i18n

    /** Response methods */
    this.responseMethods = {
      send: (msg, res) => res,
      reply: (msg, res) => `**${msg.author.username}**, ${res}`,
      success: (msg, res) => `${emojis['white_check_mark']}  |  **${msg.author.username}**, ${res}`,
      error: (msg, res) => `${emojis['negative_squared_cross_mark']}  |  **${msg.author.username}**, ` + (res || '{{%ERROR}}')
    }

    /** Formatter methods */
    this.formatMethods = {
      bold: (res) => `**${res}**`,
      italic: (res) => `*${res}*`,
      underline: (res) => `__${res}__`,
      strikethrough: (res) => `~~${res}~~`,
      inlineCode: (res) => `\`${res}\``,
      code: (res, type = '') => `\`\`\`${type}\n${res}\n\`\`\``,
      emoji: (res, type) => `${emojis[type] || emojis['information_source']}  |  ${res}`
    }
  }

  create ({ msg: message, settings = {} }, data) {
    let responder = Object.assign((...args) => responder.send(...args), {
      command: this.command,
      message: message,
      settings: settings,
      data: data,
      _options: {},
      responseMethods: this.responseMethods,
      formatMethods: this.formatMethods
    })

    const copy = ['_send', 't', 'clean', 'typing', 'format', 'file', 'embed', 'dialog', 'selection']
    copy.forEach(prop => { responder[prop] = this[prop].bind(responder) })

    for (let method in this.responseMethods) {
      responder[method] = responder._send.bind(responder, method)
    }

    return responder
  }

  t (content = '', tags = {}) {
    const cmd = this.command
    const file = cmd.name ? cmd.name.split(':')[0] : (cmd.triggers ? cmd.triggers[0] : 'common')
    const res = cmd.i18n.parse(content, cmd.localeKey || file, this.settings.lang || 'en', tags)
    return res.replace(/:(\S+):/gi, (matched, name) => emojis[name] || emojis['information_source'])
  }

  _send (method, response = '', options = {}) {
    const message = this.message
    const formats = this._formats || []

    Object.assign(options, this._options || {})

    if (response instanceof Array) response = response.join('\n')
    response = this.command.t(response, this.settings.lang || 'en', options)
    response = this.responseMethods[method || 'send'](message, response)

    for (let format of formats) {
      format = format.split(':')
      response = this.formatMethods[format[0]](response, format[1])
    }

    const promise = (options.DM ? this.command._client.getDMChannel(message.author.id) : Promise.resolve(message.channel))
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
    const bridge = this.command._client.plugins.get('middleware')
    if (!bridge) {
      throw new Error('Bridge plugin not found')
    }
  
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
      const collector = bridge.collect({
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
          if (ans.content.toLowerCase() === cancel) return Promise.reject()
          try {
            return await input.resolve(ans, [ans.cleanContent], data, dialog.input)
          } catch (err) {
            const display = err.err || err.message || err
            const p2 = await this.error(
              `{{%${display ? 'errors.' + display : 'menus.ERROR'}}}\n\n{{%menus.EXIT}}`,
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
    const choices = (mapFunc ? selections.map(mapFunc) : selections).slice(0, 10)

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
