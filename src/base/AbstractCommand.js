import fs from 'fs'
import path from 'path'
import jsonfile from 'jsonfile'

const Tatsumaki = require('../')

class AbstractCommand {
  constructor () {
    if (this.constructor === AbstractCommand) {
      throw new Error('Can\'t instantiate abstract command!')
    }
    this.timer = {}
    this.bot = Tatsumaki
    this.logger = Tatsumaki.logger
    this.db = Tatsumaki.db
    this.init()
  }

  get name () {
    throw new Error('Names must be overwritten')
  }

  get description () {
    throw new Error('Description must be overwritten')
  }

  get aliases () {
    return []
  }

  get usage () {
    return ''
  }

  get cooldown () {
    return 5
  }

  get hidden () {
    return false
  }

  get gif () {
    return null
  }

  get noPMs () {
    return false
  }

  init () {}

  handle (args) {}

  send (dest, content, delay = 0, deleteDelay = 0) {
    if (content.length > 20000) {
      this.logger.error(
        'Error sending a message larger than the character and rate limit\n' +
        content
      )
      return
    }
    if (delay) {
      return setTimeout(() => {
        this.send(dest, content, 0, deleteDelay)
      }, delay)
    }

    let msgRem = ''
    if (content.length > 2000) {
      content = content.match(/.{1,20000}/g)
      msgRem = content.shift()
      content = content.join('')
    }

    return new Promise((res, rej) => {
      this.client.createMessage(dest, content)
      .then(msg => {
        if (deleteDelay) {
          setTimeout(() => {
            this.client.deleteMessage(dest, msg.id)
            .then(() => {
              if (!msgRem) res(msg)
            })
            .catch(err => rej(err))
          }, deleteDelay)
        }
        if (msgRem) {
          return this.send(dest, msgRem, 0, deleteDelay)
            .then(msg => res(Array.isArray(msg) ? msg.concat(msg) : [msg]))
            .catch(rej)
        }
        return res(msg)
      })
      .catch(err => rej(err))
    })
  }

  reply (content, delay, deleteDelay) {
    return new Promise((res, rej) => {
      this.send(this.message.channel.id, content, delay, deleteDelay).then(res).catch(rej)
    })
  }

  upload (filepath, filename, caption) {
    return new Promise((res, rej) => {
      fs.stat(filepath, err => {
        if (err) return rej(err)
        fs.readFile(filepath, (err, data) => {
          if (err) return rej(err)
          this.client.createMessage(this.message.channel.id, caption, {
            file: new Buffer(data),
            name: filename
          })
          .then(res)
          .catch(rej)
        })
      })
    })
  }

  await (prompt, check, errMsg) {
    return new Promise((res, rej) => {
      const callback = msg => {
        if (msg.author.id !== this.message.author.id) return
        this.client.removeListener('messageCreate', callback)
        if (check(msg)) return res(msg)
        errMsg = errMsg ||
        'That is an invalid response. Please try again.'
        return this.await(errMsg, check, errMsg).then(res).catch(rej)
      }
      this.reply(prompt)
      .then(msg => {
        this.client.on('messageCreate', callback)
      })
      .catch(err => rej(err))
    })
  }

  wrongUsage () {
    const guildSettings = path.join(this.bot.dbPath, 'guild-settings', `${this.message.channel.guild.id}.json`)
    jsonfile.readFile(guildSettings, (err, data) => {
      if (err) {
        this.logger.error(`Error reading ${guildSettings}: ${err}`)
        return
      }
      this.reply(`❎  **${this.message.author.username}**, the correct usage is: \`${data.prefix}${this.name} ${this.usage || ''}\``)
    })
  }

  getSettings () {
    return this.bot.guildSettings.get(this.message.channel.guild.id)
  }

  saveSettings (data) {
    return new Promise((res, rej) => {
      const guildSettings = path.join(this.bot.dbPath, 'guild-settings', `${this.message.channel.guild.id}.json`)
      jsonfile.writeFile(guildSettings, data, { spaces: 2 }, err => {
        if (err) {
          this.logger.error(`Error writing to ${guildSettings}: ${err}`)
          return rej(err)
        }
        return res()
      })
      this.bot.guildSettings.delete(this.message.channel.guild.id)
      this.bot.guildSettings.set(this.message.channel.guild.id, data)
    })
  }
}

module.exports = AbstractCommand
