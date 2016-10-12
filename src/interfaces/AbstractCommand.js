const path = require('path')
const logger = require('winston')

const emoji = require('./Emojis')
const { Localisation } = require('../util/Localisation')

class AbstractCommand {
  constructor (client) {
    if (this.constructor === AbstractCommand) {
      throw new Error('Must extend AbstractCommand')
    }

    this.client = client

    this.responseMethods = {
      send: (msg, res) => res,
      reply: (msg, res) => `**${msg.author.username}**, ${res}`,
      success: (msg, res) => `${emoji.success}  |  **${msg.author.username}**, ${res}`,
      error: (msg, res) => `${emoji.error}  |  **${msg.author.username}**, ` +
      res || 'an error occurred! Please try again later.'
    }

    this.formatMethods = {
      bold: (res) => `**${res}**`,
      italic: (res) => `*${res}*`,
      underline: (res) => `__${res}__`,
      strikethrough: (res) => `~~${res}~~`,
      inlineCode: (res) => `\`${res}\``,
      code: (res, type) => `${'```'}${type}\n${res}${'```'}`,
      emoji: (res, type) => `${emoji[type || 'success']}  |  ${res}`
    }
  }

  get name () { throw new Error('Command must be named') }
  get aliases () { return [] }
  get cooldown () { return 5 }
  get noPMs () { return false }
  get hidden () { return false }
  get botPerms () { return [] }
  get localeFile () { return this.name }

  loadLocales () {
    this.locales = new Localisation(path.join(process.cwd(), 'resources/strings', this.localeFile))
    this.locales.init()
  }

  createResponder ({ msg }) {
    let responder = (...args) => responder.send(...args)
    for (let method in this.responseMethods) {
      responder[method] = (response, options = {}, ...args) => {
        let promise = new Promise((resolve, reject) => {
          const formats = responder._formats
          response = this.responseMethods[method](msg, response)

          if (formats) {
            for (let format of formats) {
              format = format.split(':')
              response = this.formatMethods[format[0]](response, format[1])
            }
          }
          if (responder._file) options.file = responder._file

          delete responder._formats
          delete responder._file
          this.send(msg.channel, response, options, ...args).then(resolve).catch(reject)
        })

        promise.catch(logger.error)

        return promise
      }
    }
    responder.DM = (response, options = null, ...args) => {
      let promise = new Promise((resolve, reject) => {
        this.client.getDMChannel(msg.author.id)
        .then(channel => {
          const formats = responder._formats

          if (formats) {
            for (let format of formats) {
              format = format.split(':')
              response = this.formatMethods[format[0]](response, format[1])
            }
          }
          if (responder._file) options.file = responder._file

          delete responder._formats
          delete responder._file
          this.send(channel, response, options, ...args).then(resolve).catch(reject)
        })
      })

      promise.catch(logger.error)

      return promise
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

  execute (container) {
    this.handle(container, this.createResponder(container))
  }

  handle () { return false }

  send (channel, content, file = null, { delay = 0, deleteDelay = 0 } = {}) {
    if (delay) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          this.send(channel, content, file, { delay, deleteDelay })
          .then(resolve).catch(reject)
        }, delay)
      })
    }

    let msgRem = ''
    if (content.length > 2000) {
      content = content.match(/(.|[\r\n]){1,2000}/g)
      msgRem = content.shift()
      content = content.join('')
    }

    return new Promise((resolve, reject) => {
      if (content instanceof Array) content = content.join('\n')

      if (msgRem) {
        return this.send(channel, msgRem, 0, deleteDelay)
        .then(msg => resolve(Array.isArray(msg) ? msg.concat(msg) : [msg]))
        .catch(reject)
      }

      channel.createMessage(content, file)
      .then(msg => {
        if (deleteDelay) {
          setTimeout(() => {
            msg.delete()
            .then(() => {
              if (!msgRem) return resolve(msg)
            })
            .catch(err => reject(err))
          }, deleteDelay)
        }
        if (msgRem) {
          this.send(channel, msgRem, { delay: 0, deleteDelay })
          .then(msg => resolve(Array.isArray(msg) ? msg.concat(msg) : [msg]))
          .catch(reject)
          return
        }
        return resolve(msg)
      })
      .catch(reject)
    })
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
}

module.exports = AbstractCommand
