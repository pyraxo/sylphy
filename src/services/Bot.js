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

/**
 * Represents the main Bot instance
 *
 * @extends EventEmitter2
 * @prop {Client} client The connected Eris client
 * @prop {Object} plugins All plugin instances
 * @prop {Object} modPlugins All mod plugin instances
 * @prop {Object} handlers All handler instances
 * @prop {Number} shardID The shard ID for the bot instance
 * @prop {Number} shardCount The total number of shards
 * @prop {String} dbPath The path to all resources
 * @prop {String} configPath The path to the config files
 * @prop {String} handlersPath The path to the handlers
 * @prop {String} pluginsPath The path to the plugins
 * @prop {String} modPluginsPath The path to the mod plugins
 * @prop {Logger} logger The bot logger
 * @prop {Map} guildSettings Map of all parsed guild settings
 * @prop {Object} db An object containing all the databases configured in Redis settings
 */
class Bot extends EventEmitter {
  /**
   * Creates a Bot instance
   *
   * @arg {Object} [options] Bot options (optional for all)
   * @arg {String} [options.dbPath=resources] The path to all resources, default to 'resources' in the root folder
   * @arg {String} [options.configPath=config] The path to the config files, default to 'config' in the root folder
   * @arg {String} [options.handlersPath=lib/handlers] The path to the handlers, default to 'handlers' in the lib folder
   * @arg {String} [options.pluginsPath=lib/plugins] The path to the mod plugins, default to 'mod-plugins' in the lib folderlugins, default to 'plugins' in the lib folder
   * @arg {String} [options.modPluginsPath=lib/mod-plugins] The path to the mod plugins, default to 'mod-plugins' in the lib folder
   * @arg {Number} [options.shardID=0] The shard ID for the bot instance
   * @arg {Number} [options.shardCount=1] The total number of shards
   * @returns {Bot} A Bot instance
   */
  constructor (options) {
    options = options || {}
    super({ wildcard: true, delimiter: ':' })
    this.logger = new Logger('BOT')
    this.guildSettings = new Map()

    this.configPath = options.configPath || path.join(process.cwd(), 'config')
    this.handlersPath = options.handlersPath || path.join(process.cwd(), 'lib/events')
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

    this.on('loaded:configs', () => this.login())
    this.on('loaded:discord', () => {
      this.cachePlugins()
      this.cacheHandlers()
      this.loadSettings()
    })

    this.on('clear:plugins', () => this.cachePlugins())
    this.on('clear:handlers', () => this.cacheHandlers())

    this.on('cached:plugins', () => this.runPlugins())
    this.on('cached:handlers', () => this.runHandlers())

    this.on('loaded:*', () => {
      /**
       * Event fired when the bot is ready
       *
       * @event Bot#ready
       */
      if (this.loaded[this.event.replace('loaded:', '')] === true) return
      this.loaded[this.event.replace('loaded:', '')] = true
      if (this.checkLoaded()) this.emit('ready')
    })
  }

  /**
   * Checks if the bot is fully loaded
   *
   * @returns {Boolean}
   */
  checkLoaded () {
    for (let val in this.loaded) {
      if (this.loaded[val] === false) return false
    }
    return true
  }

  /**
   * Starts the bot running
   *
   * @fires Bot#loaded:configs
   */
  run () {
    Configs.get(this.configPath)
    .then(results => {
      /**
       * Config loaded event
       *
       * @event Bot#loaded:configs
       */
      this.config = results
      this.emit('loaded:configs')

      if (this.config.hasOwnProperty('redis')) {
        this.db = {}
        for (let db in this.config.redis) {
          this.db[`${db}DB`] = new Redis(this.config.redis[db])
        }
      }
    })
  }

  /**
   * Connects the bot to Discord servers
   *
   * @fires Bot#loaded:discord
   */
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
        GUILD_EMOJI_UPDATE: true,
        VOICE_SERVER_UPDATE: true,
        VOICE_STATE_UPDATE: true
      }
    })

    this.commander = new Commander(client, this.config, this.guildSettings)

    /**
     * Event fired when the Discord client is connected and ready
     *
     * @event Bot#loaded:discord
     * @type {Array.<String>}
     */
    client.on('ready', () => {
      this.emit('loaded:discord', Object.keys(client.guildShardMap))
      this.logger.info(`${chalk.red.bold('iris')} is ready! Logging in as ${chalk.cyan.bold(client.user.username)} on shard ${chalk.red.bold(this.shardID)}`)
      this.logger.info(`Listening to ${chalk.green.bold(client.guilds.size)} guilds, with ${chalk.green.bold(Object.keys(client.channelGuildMap).length)} channels`)
      this.logger.info(`Prefix: ${this.config.discord.prefix} | Admin Prefix: ${this.config.discord.admin_prefix}`)
    })

    client.on('guildCreate', guild => this.emit('cache:guild.create', guild))
    client.on('guildDelete', guild => this.emit('cache:guild.delete', guild))

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

  /**
   * Cache all plugins by requiring them
   *
   * @fires Bot#cached:plugins
   */
  cachePlugins () {
    /**
     * Event fired when all plugins are cached
     *
     * @event Bot#cached:plugins
     */
    this.plugins = rq(this.pluginsPath)
    this.modPlugins = rq(this.modPluginsPath)
    this.emit('cached:plugins')
  }

  /**
   * Cache all handlers by requiring them
   *
   * @fires Bot#cached:plugins
   */
  cacheHandlers () {
    /**
     * Event fired when all handlers are cached
     *
     * @event Bot#cached:handlers
     */
    this.handlers = rq(this.handlersPath)
    this.emit('cached:handlers')
  }

  /**
   * Reloads all plugins
   *
   * @fires Bot#clear:plugins
   */
  reloadPlugins () {
    /**
     * Event fired when all plugins are cleared
     *
     * @event Bot#clear:plugins
     * @type {Number}
     */
    let pluginCount = Object.keys(require.cache).reduce((p, c) => {
      if (c.startsWith(this.pluginsPath) || c.startsWith(this.modPluginsPath)) {
        cr(c)
        return ++p
      }
      return p
    }, 0)
    this.plugins = {}
    this.modPlugins = {}
    this.commander.removeAllListeners('msg:*')
    this.logger.log(`${pluginCount} plugins reloaded`)
    this.emit('clear:plugins', pluginCount)
  }

  reloadHandlers () {
    /**
     * Event fired when all handlers are cleared
     *
     * @event Bot#clear:handlers
     * @type {Number}
     */
    let handlerCount = Object.keys(require.cache).reduce((p, c) => {
      if (c.startsWith(this.handlersPath)) {
        cr(c)
        return ++p
      }
      return p
    }, 0)
    this.handlers = {}
    this.emit('clear:handlers', handlerCount)
  }

  /**
   * Run all plugins
   *
   * @fires Bot#loaded:plugins
   */
  runPlugins () {
    /**
     * Event fired when all plugins have been run
     *
     * @event Bot#loaded:plugins
     */
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

    this.emit('loaded:plugins')
  }

  /**
   * Run all handlers. Handlers have the Bot instance bounded
   *
   * @fires Bot#loaded:handlers
   */
  runHandlers () {
    /**
     * Event fired when all handlers have been run
     *
     * @event Bot#loaded:handlers
     */
    for (let event in this.handlers) {
      for (let handler in this.handlers[event]) {
        this.handlers[event][handler] = this.handlers[event][handler].bind(this)
        this.client.on(event, this.handlers[event][handler])
      }
    }
    this.emit('loaded:handlers')
  }

  /**
   * Reads and caches a JSON's settings, writing and caching with defaults if the file is not found
   *
   * @arg {String} jsonpath The path to a json file
   * @arg {String} id The ID of the server
   * @arg {Object} defs The default settings
   */
  getSettings (jsonpath, id, defs) {
    defs = defs || {
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
    return new Promise((res, rej) => {
      fs.stat(jsonpath, err => {
        if (err) {
          jsonfile.writeFile(jsonpath, defs, { spaces: 2 }, err => {
            if (err) return rej(err)
          })
          return res(defs)
        }
        jsonfile.readFile(jsonpath, (err, data) => {
          if (err) return rej(err)
          res(data)
        })
      })
    })
  }

  /**
   * Loads all server settings found into memory
   *
   * @fires Bot#loaded:settings
   */
  loadSettings () {
    /**
     * Event fired when all settings have been loaded
     *
     * @event Bot#loaded:settings
     */
    this.client.guilds.map(g => g.id).forEach(id => {
      const settingsPath = path.join(this.dbPath, 'guild-settings', `${id}.json`)
      this.getSettings(settingsPath, id)
      .then(settings => this.guildSettings.set(id, settings))
      .catch(err => this.logger.error(`Error verifying ${settingsPath}: ${err}`))
    })
    this.emit('loaded:settings')
  }
}

module.exports = Bot
