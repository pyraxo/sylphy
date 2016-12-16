const emoji = require('node-emoji')
const logger = require('winston')
const { Emojis } = require('../util')

const colours = {
  blue: '#117ea6',
  green: '#1f8b4c',
  red: '#be2626',
  pink: '#E33C96',
  gold: '#d5a500',
  silver: '#b7b7b7',
  bronze: '#a17419',
  orange: '#c96941'
}

class Base {
  constructor (bot) {
    if (this.constructor === Base) {
      throw new Error('Must extend abstract Base')
    }

    this.bot = bot
    this.i18n = bot.engine.i18n

    this.colours = {}
    for (const colour in colours) {
      this.colours[colour] = this.hexToInt(colours[colour])
    }
  }

  getColour (colour) {
    return this.colours[colour] || this.colours.blue
  }

  parseNumber (number) {
    if (typeof number === 'number') number = number.toString()
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  hasRoleHierarchy (guild, user, role) {
    if (!guild) return false

    const member = guild.members.get(user.id)
    if (!member) return false
    for (let r of member.roles) {
      r = guild.roles.get(r)
      if (r.id === role.id) continue
      if (r.position > role.position) return true
    }

    return false
  }

  hasPermissions (channel, user, ...perms) {
    const member = channel.guild.members.get(user.id)

    if (!perms.every(p => member.permission.has(p))) return false
    return perms.every(perm => (
      !channel.permissionOverwrites.find(p => (member.roles.includes(p.id) || p.id === user.id) && p.json[perm] === false)
    ))
  }

  t (content = '', lang = 'en', tags = {}) {
    const file = this.name ? this.name.split(':')[0] : (this.labels ? this.labels[0] : 'common')
    return this.i18n.parse(content, this.localeKey || file || null, lang, tags)
  }

  async send (channel, content, options = {}) {
    if (typeof channel === 'string') {
      channel = this.bot.getChannel(channel)
    }
    if (!channel) return null

    let { file = null, lang, delay = 0, deleteDelay = 0, embed } = options
    if (channel.guild) {
      const guild = channel.guild
      if (!this.hasPermissions(channel, this.bot.user, 'sendMessages')) {
        logger.error(`Channel ${channel.name} (${channel.id}) in ${guild.name} (${guild.id}) denies message sending`)
        return Promise.reject('403_SEND_MSG')
      }
    }

    if (delay) {
      await Promise.delay(delay)
    }

    lang = !lang && channel.guild ? (await this.bot.engine.db.data.Guild.fetch(channel.guild.id)).lang : 'en'

    if (Array.isArray(content)) content = content.join('\n')
    content = this.t(content, lang, options)
    content = content.replace(/:(\S+):/gi, (matched, name) => (
      this.i18n.locate(name, Emojis) || emoji.get(name) || matched
    ))
    content = content.match(/(.|[\r\n]){1,2000}/g)

    try {
      if (!content || !content.length) {
        let msg = await channel.createMessage({ embed, content: '' }, file)
        if (deleteDelay) {
          setTimeout(() => {
            msg.delete().catch(err => logger.error(`Could not delete message ${msg.id} - ${err}`))
          }, deleteDelay)
        }
        return msg
      }
      let replies = await Promise.mapSeries(content, (c, idx) => {
        return channel.createMessage(!idx ? { embed, content: c } : c, !idx ? file : null).then(msg => {
          if (deleteDelay) setTimeout(() => msg.delete(), deleteDelay)
          return msg
        })
      })
      return replies[0]
    } catch (err) {
      logger.error(`Error sending message to ${channel.name} (${channel.id})`)
      if (err.response) {
        logger.error(JSON.parse(err.response).message)
        return
      }
      throw err
    }
  }

  async edit (msg, content, options) {
    let { lang, delay = 0 } = options
    if (delay) {
      await Promise.delay(delay)
    }

    if (!lang && msg.channel.guild) {
      lang = (await this.bot.engine.db.data.Guild.fetch(msg.channel.guild.id)).lang
    } else {
      lang = 'en'
    }

    if (Array.isArray(content)) content = content.join('\n')
    content = this.t(content, lang, options)
    content = content.replace(/:(\S+):/gi, (matched, name) => {
      return this.i18n.locate(name, Emojis) || emoji.get(name) || matched
    })

    return msg.edit(content)
  }

  deleteMessages (...msgs) {
    const id = this.bot.user.id
    for (let msg of msgs.filter(m => m)) {
      if (msg.author.id === id || msg.channel.permissionsOf(id).has('manageMessages')) {
        msg.delete()
      }
    }
  }

  hexToInt (colour) {
    return parseInt(colour.replace('#', ''), 16)
  }
}

module.exports = Base
