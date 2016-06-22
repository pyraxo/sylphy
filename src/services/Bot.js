import { Client as Discord, Cache } from 'discord.js'
import { EventEmitter } from 'events'
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
    super()
    this.logger = new Logger('BOT')

    this.busyUsers = new Cache()
    this.serverSettings = new Cache()

    this.configPath = options.configPath || path.join(process.cwd(), 'config')
    this.handlersPath = options.handlersPath || path.join(process.cwd(), 'lib/handlers')
    this.pluginsPath = options.pluginsPath || path.join(process.cwd(), 'lib/plugins')
    this.modPluginsPath = options.modPluginsPath || path.join(process.cwd(), 'lib/mod-plugins')
    this.dbPath = options.dbPath || path.join(process.cwd(), 'db')

    this.shardID = options.shardID || 0
    this.shardCount = options.shardCount || 1

    this.once('loaded:configs', () => this.login())
    this.once('loaded:discord', () => {
      this.attachPlugins()
      this.attachHandlers()
      this.loadSettings()
    })
    this.on('loaded:plugins', () => this.runPlugins())
    this.on('clear:plugins', () => this.attachPlugins())
    this.on('loaded:handlers', () => this.enableHandlers())
  }

  run () {
    Configs.get(this.configPath, results => {
      this.config = results
      this.emit('loaded:configs')

      this.db = new Hash()
    })
  }

  login () {
    if (typeof this.config.discord.token === 'undefined') {
      throw new Error('Unable to resolve Discord token')
    }

    let client = new Discord({
      maxCachedMessages: 10,
      forceFetchUsers: true,
      disableEveryone: true,
      shardId: this.shardID,
      shardCount: this.shardCount
    })

    client.on('ready', () => {
      this.emit('loaded:discord')
      this.logger.info(`${chalk.red.bold('iris')} is ready! Logging in as ${chalk.cyan.bold(client.user.name)}`)
      this.logger.info(`Listening to ${chalk.magenta.bold(client.channels.length)} channels, on ${chalk.green.bold(client.servers.length)} servers`)
    })

    client.on('message', msg => {
      if (msg.author.bot === true || this.busyUsers.has('id', msg.sender.id)) return
      if (msg.channel.isPrivate) {
        if (msg.content.startsWith(this.config.discord.prefix)) {
          const trigger = msg.content.toLowerCase().split(' ')[0].substring(this.config.discord.prefix.length)
          const args = msg.content.split(' ').splice(1)
          this.emit(trigger, args, msg, client)
          return
        }
      }
      let trigger = ''

      const settings = this.serverSettings.get('id', msg.server.id)
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

    client.loginWithToken(this.config.discord.token)
    this.client = client
  }

  attachPlugins () {
    this.plugins = rq(this.pluginsPath)
    this.modPlugins = rq(this.modPluginsPath)
    this.emit('loaded:plugins')
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
    this.emit('running:plugins')
  }

  reloadPlugins () {
    Object.keys(require.cache).forEach(key => {
      if (key.startsWith(this.pluginsPath) || key.startsWith(this.modPluginsPath)) cr(key)
    })
    this.emit('clear:plugins')
  }

  attachHandlers () {
    this.handlers = rq(this.handlersPath)
    this.emit('loaded:handlers')
  }

  enableHandlers () {
    for (let handler in this.handlers) {
      this.handlers[handler](this.client, this)
    }
    this.emit('running:handlers')
  }

  getSettings (jsonpath, id) {
    return new Promise((res, rej) => {
      const defaults = {
        id: id,
        prefix: this.config.discord.prefix,
        admin_prefix: this.config.discord.admin_prefix,
        ignored: {},
        welcome: 'Welcome to %server%!',
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
    this.client.servers.map(s => {
      const settingsPath = path.join(this.dbPath, 'server-settings', `${s.id}.json`)
      this.getSettings(settingsPath, s.id)
      .then(settings => this.serverSettings.add(settings))
      .catch(err => this.logger.error(`Error verifying ${settingsPath}: ${err}`))
    })
  }
}

module.exports = Bot
