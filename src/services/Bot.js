import { Client as Discord } from 'eris'
import { EventEmitter2 as EventEmitter } from 'eventemitter2'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import jsonfile from 'jsonfile'
import rq from 'require-all'
import cr from 'clear-require'

import Logger from './Logger'
import Configs from './Configurator'
import Hash from './util/Hash'

class Bot extends EventEmitter {
  constructor (options) {
    options = options || {}
    super({ wildcard: true })
    this.logger = new Logger('BOT')

    this.ignoredUsers = new Set()
    this.guildSettings = new Map()

    this.configPath = options.configPath || path.join(process.cwd(), 'config')
    this.handlersPath = options.handlersPath || path.join(process.cwd(), 'lib/handlers')
    this.pluginsPath = options.pluginsPath || path.join(process.cwd(), 'lib/plugins')
    this.modPluginsPath = options.modPluginsPath || path.join(process.cwd(), 'lib/mod-plugins')
    this.dbPath = options.dbPath || path.join(process.cwd(), 'db')

    this.shardID = options.shardID || 0
    this.shardCount = options.shardCount || 1

    this.loaded = {
      configs: false,
      plugins: false,
      handlers: false,
      settings: false,
      discord: false
    }

    this.setMaxListeners(0) // unlimited listeners

    this.once('loaded.configs', () => this.login())
    this.once('loaded.discord', () => {
      this.attachPlugins()
      this.attachHandlers()
      this.loadSettings()
    })
    this.on('loaded.plugins', () => this.runPlugins())
    this.on('loaded.handlers', () => this.enableHandlers())

    this.on('reload.plugins', () => this.reloadPlugins())

    this.on('clear.plugins', () => this.attachPlugins())
    this.on('clear.handlers', () => this.attachHandlers())

    this.on('loaded.*', () => {
      this.loaded[this.event.replace('loaded.', '')] = true
      if (this.checkLoaded()) this.emit('ready')
    })
  }

  checkLoaded () {
    for (let val in this.loaded) {
      if (this.loaded[val] === false) return false
    }
    return true
  }

  run () {
    Configs.get(this.configPath, results => {
      this.config = results
      this.emit('loaded.configs')

      this.db = new Hash()
    })
  }

  login () {
    if (typeof this.config.discord.token === 'undefined') {
      throw new Error('Unable to resolve Discord token')
    }

    let client = new Discord(this.config.discord.token, {
      messageLimit: 1,
      sequencerWait: 2,
      getAllUsers: true,
      disableEveryone: true,
      firstShardID: this.shardID,
      lastShardID: this.shardID,
      maxShards: this.shardCount,
      disabledEvents: {
        CHANNEL_DELETE: true,
        CHANNEL_UPDATE: true,
        GUILD_BAN_REMOVE: true,
        GUILD_EMOJI_UPDATE: true,
        TYPING_START: true,
        VOICE_SERVER_UPDATE: true,
        VOICE_STATE_UPDATE: true
      }
    })

    client.on('ready', () => {
      this.emit('loaded.discord', client.guilds.size)
      this.logger.info(`${chalk.red.bold('iris')} is ready! Logging in as ${chalk.cyan.bold(client.user.username)} on shard ${chalk.red.bold(this.shardID)}`)
      this.logger.info(`Listening to ${chalk.green.bold(client.guilds.size)} guilds, with ${chalk.green.bold(Object.keys(client.channelGuildMap).length)} channels`)
    })

    this.once('ready', () => {
      this.client.on('messageCreate', msg => {
        if (msg.author.bot === true || this.ignoredUsers.has(msg.author.id)) return
        if (msg.channel.id === msg.author.id) { // isPrivate
          if (msg.content.startsWith(this.config.discord.prefix)) {
            const trigger = msg.content.toLowerCase().split(' ')[0].substring(this.config.discord.prefix.length)
            const args = msg.content.split(' ').splice(1)
            this.emit(trigger, args, msg, client)
            return
          }
        }
        let trigger = ''

        const settings = this.guildSettings.get(msg.channel.guild.id)
        if (msg.content.startsWith(settings.prefix)) {
          trigger = msg.content.toLowerCase().split(' ')[0].substring(settings.prefix.length)
        } else if (msg.content.startsWith(settings.admin_prefix)) {
          trigger = msg.content.toUpperCase().split(' ')[0].substring(settings.admin_prefix.length)
        } else if (msg.content.startsWith(this.config.discord.prefix)) {
          trigger = msg.content.toLowerCase().split(' ')[0].substring(this.config.discord.prefix.length)
        } else if (msg.content.startsWith(this.config.discord.admin_prefix)) {
          trigger = msg.content.toUpperCase().split(' ')[0].substring(this.config.discord.admin_prefix.length)
        }

        if (settings.ignored[msg.channel.id] === true && trigger !== trigger.toUpperCase()) return

        if (Array.isArray(settings.ignored[msg.channel.id]) && settings.ignored[msg.channel.id].find(c => c === trigger)) return
        const args = msg.content.split(' ').splice(1)
        this.emit(trigger, args, msg, client)
      })
    })

    client.connect()
    this.client = client
  }

  attachPlugins () {
    this.plugins = rq(this.pluginsPath)
    this.modPlugins = rq(this.modPluginsPath)
    this.emit('loaded.plugins')
  }

  runPlugins () {
    for (let plugin in this.plugins) {
      for (let command in this.plugins[plugin]) {
        this.plugins[plugin][command] = new this.plugins[plugin][command]()
      }
    }

    for (let plugin in this.modPlugins) {
      for (let command in this.modPlugins[plugin]) {
        this.modPlugins[plugin][command] = new this.modPlugins[plugin][command]()
      }
    }
    this.emit('running.plugins')
  }

  reloadPlugins () {
    let pluginCount = 0
    Object.keys(require.cache).forEach(key => {
      if (key.startsWith(this.pluginsPath) || key.startsWith(this.modPluginsPath)) {
        cr(key)
        pluginCount++
      }
    })
    for (let plugin in this.plugins) {
      for (let command in this.plugins[plugin]) {
        this.removeAllListeners(this.plugins[plugin][command].name)
      }
    }
    for (let plugin in this.modPlugins) {
      for (let command in this.modPlugins[plugin]) {
        this.removeAllListeners(this.modPlugins[plugin][command].name)
      }
    }
    this.plugins = {}
    this.modPlugins = {}
    this.logger.log('All plugins reloaded')
    this.emit('clear.plugins', pluginCount)
  }

  attachHandlers () {
    this.handlers = rq(this.handlersPath)
    this.emit('loaded.handlers')
  }

  reloadHandlers () {
    let handlerCount = 0
    this.handlers = {}
    Object.keys(require.cache).forEach(key => {
      if (key.startsWith(this.handlersPath)) {
        cr(key)
        handlerCount++
      }
    })
    this.emit('clear.handlers', handlerCount)
  }

  enableHandlers () {
    for (let handler in this.handlers) {
      this.handlers[handler] = this.handlers[handler].bind(this)
      this.handlers[handler]()
    }
    this.emit('running.handlers')
  }

  getSettings (jsonpath, id) {
    return new Promise((res, rej) => {
      const defaults = {
        id: id,
        prefix: this.config.discord.prefix,
        admin_prefix: this.config.discord.admin_prefix,
        ignored: {},
        welcome: 'Welcome to %server_name%!',
        goodbye: 'We\'re sorry to see you leaving!',
        nsfw: false,
        levelUp: true,
        banAlerts: true,
        nameChanges: true,
        notifyChannel: null,
        lang: 'default'
      }
      fs.stat(jsonpath, err => {
        if (err) {
          jsonfile.writeFile(jsonpath, defaults, { spaces: 2 }, err => {
            if (err) return rej(err)
          })
          return res(defaults)
        }
        jsonfile.readFile(jsonpath, (err, data) => {
          if (err) return rej(err)
          res(data)
        })
      })
    })
  }

  loadSettings () {
    this.client.guilds.map(g => g.id).forEach(id => {
      const settingsPath = path.join(this.dbPath, 'guild-settings', `${id}.json`)
      this.getSettings(settingsPath, id)
      .then(settings => this.guildSettings.set(id, settings))
      .catch(err => this.logger.error(`Error verifying ${settingsPath}: ${err}`))
    })
    this.emit('loaded.settings')
  }
}

module.exports = Bot
