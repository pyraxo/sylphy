import { Client as Discord } from 'eris'
import { EventEmitter2 as EventEmitter } from 'eventemitter2'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import jsonfile from 'jsonfile'
import rq from 'require-all'
import cr from 'clear-require'

import Logger from './Logger'
import Commander from './Commander'
import Configs from './database/Configurator'
import Redis from './database/RedisDB'

class Bot extends EventEmitter {
  constructor (options) {
    options = options || {}
    super({ wildcard: true })
    this.logger = new Logger('BOT')
    this.guildSettings = new Map()

    this.configPath = options.configPath || path.join(process.cwd(), 'config')
    this.handlersPath = options.handlersPath || path.join(process.cwd(), 'lib/handlers')
    this.pluginsPath = options.pluginsPath || path.join(process.cwd(), 'lib/plugins')
    this.modPluginsPath = options.modPluginsPath || path.join(process.cwd(), 'lib/mod-plugins')
    this.dbPath = options.dbPath || path.join(process.cwd(), 'resources')

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

    this.on('loaded.configs', () => this.login())
    this.on('loaded.discord', () => {
      this.cachePlugins()
      this.cacheHandlers()
      this.loadSettings()
    })

    this.on('clear.plugins', () => this.cachePlugins())
    this.on('clear.handlers', () => this.cacheHandlers())

    this.on('cached.plugins', () => this.runPlugins())
    this.on('cached.handlers', () => this.runHandlers())

    this.on('loaded.*', () => {
      if (this.loaded[this.event.replace('loaded.', '')] === true) return
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

      this.redisdb = new Redis(this.config.redis.base)
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

    this.commander = new Commander(client, this.config, this.guildSettings)

    client.on('ready', () => {
      this.emit('loaded.discord', Object.keys(client.guildShardMap))
      this.logger.info(`${chalk.red.bold('iris')} is ready! Logging in as ${chalk.cyan.bold(client.user.username)} on shard ${chalk.red.bold(this.shardID)}`)
      this.logger.info(`Listening to ${chalk.green.bold(client.guilds.size)} guilds, with ${chalk.green.bold(Object.keys(client.channelGuildMap).length)} channels`)
    })

    client.on('guildCreate', guild => this.emit('cache.guild.create', guild))
    client.on('guildDelete', guild => this.emit('cache.guild.delete', guild))

    this.on('ready', () => {
      setTimeout(() => {
        this.client.on('messageCreate', msg => {
          this.commander.handle(msg)
        })
      }, 2000)
    })

    client.connect()
    this.client = client
  }

  cachePlugins () {
    this.plugins = rq(this.pluginsPath)
    this.modPlugins = rq(this.modPluginsPath)
    this.emit('cached.plugins')
  }

  cacheHandlers () {
    this.handlers = rq(this.handlersPath)
    this.emit('cached.handlers')
  }

  reloadPlugins () {
    let pluginCount = Object.keys(require.cache).reduce((p, c) => {
      if (c.startsWith(this.pluginsPath) || c.startsWith(this.modPluginsPath)) {
        cr(c)
        return ++p
      }
      return p
    }, 0)
    this.plugins = {}
    this.modPlugins = {}
    this.commander.removeAllListeners('msg.*')
    this.logger.log(`${pluginCount} plugins reloaded`)
    this.emit('clear.plugins', pluginCount)
  }

  reloadHandlers () {
    let handlerCount = Object.keys(require.cache).reduce((p, c) => {
      if (c.startsWith(this.handlersPath)) {
        cr(c)
        return ++p
      }
      return p
    }, 0)
    this.handlers = {}
    this.emit('clear.handlers', handlerCount)
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

    this.emit('loaded.plugins')
  }

  runHandlers () {
    for (let handler in this.handlers) {
      this.handlers[handler] = this.handlers[handler].bind(this)
      this.handlers[handler]()
    }
    this.emit('loaded.handlers')
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
