import fs from 'fs'
import path from 'path'
import jsonfile from 'jsonfile'
import moment from 'moment'

import Redis from '../services/database/RedisDB'
import Localization from '../services/Localization'

const Tatsumaki = require('../')

class AbstractCommand {
  constructor () {
    if (this.constructor === AbstractCommand) {
      throw new Error('Can\'t instantiate abstract command!')
    }
    this.timer = new Map()
    this.bot = Tatsumaki
    this.commander = Tatsumaki.commander
    this.logger = Tatsumaki.logger
    this.redisdb = Tatsumaki.redisdb

    if (this.bot.config.hasOwnProperty('redis')) {
      if (this.bot.config.redis.statistics) {
        this.stats = new Redis(this.bot.config.redis.statistics)
      }
    }
    this.loadLocale()
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

  get localeFile () {
    return null
  }

  get noPMs () {
    return false
  }

  loadLocale () {
    if (this.localeFile) {
      this.locale = new Localization(path.join(this.bot.dbPath, 'strings', this.localeFile))
      this.locale.init()
    } else {
      this.logger.info(`No locale found for ${this.name} command`)
    }
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

  await (prompt, check, errMsg, expireTime = 60) {
    return new Promise((res, rej) => {
      this.reply(prompt)
      .then(msg => {
        const late = +moment()
        this.commander.ignoredUsers.add(this.message.author.id)
        const expire = () => {
          if (moment().diff(late, 'seconds') >= expireTime) {
            this.reply(`❎  |  The command menu for **${this.name}** has closed due to inactivity.`)
            this.commander.ignoredUsers.delete(this.message.author.id)
            this.client.removeListener('messageCreate', callback)
          }
        }
        let expiry = setTimeout(expire, expireTime * 1000)
        const callback = msg => {
          if (msg.author.id !== this.message.author.id) return
          clearTimeout(expiry)
          if (check(msg)) {
            this.commander.ignoredUsers.delete(this.message.author.id)
            return res(msg)
          }
          errMsg = errMsg ||
          '❎  |  That is an invalid response. Please try again.'
          return this.await(errMsg, check, errMsg, expireTime).then(res).catch(rej)
        }
        this.client.once('messageCreate', callback)
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

  locateUser (query) {
    return new Promise((res, rej) => {
      if (this.message.isPrivate) return res(this.message.author)
      const guild = this.message.channel.guild
      query = query.toLowerCase()
      guild.members.forEach(m => {
        if (m.user.username.toLowerCase() === query) return res(m)
        if (m.user.username.toLowerCase().indexOf(query) === 0) return res(m)
        if (m.user.username.toLowerCase().includes(query)) return res(m)
        if (m.nick !== null) {
          if (m.nick.toLowerCase() === query) return res(m)
          if (m.nick.toLowerCase().indexOf(query)) return res(m)
          if (m.nick.toLowerCase().includes(query)) return res(m)
        }
      })
      return rej()
    })
  }
}

module.exports = AbstractCommand
