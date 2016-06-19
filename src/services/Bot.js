import { Client as Discord } from 'discord.js'
import { EventEmitter } from 'events'
import path from 'path'
import chalk from 'chalk'
import rq from 'require-all'
import cr from 'clear-require'
import async from 'async'

import Logger from './Logger'
import Configs from './Configurator'
import Hash from './util/Hash'

class Bot extends EventEmitter {
  constructor (options) {
    options = options || {}
    super()
    this.logger = new Logger('BOT')

    this.configPath = options.configPath || path.join(process.cwd(), 'config')
    this.pluginsPath = options.pluginsPath || path.join(process.cwd(), 'lib/plugins')
    this.modPluginsPath = options.modPluginsPath || path.join(process.cwd(), 'lib/mod-plugins')
    this.dbPath = options.dbPath || path.join(process.cwd(), 'db')

    this.shardID = options.shardID || 0
    this.shardCount = options.shardCount || 1

    this.once('loaded:configs', () => this.login())
    this.once('loaded:discord', () => this.attachPlugins())
    this.on('loaded:plugins', () => this.runPlugins())
    this.on('clear:plugins', () => this.attachPlugins())
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
      async.series([
        cb => {
          this.db.get(`server:${msg.server.id}:settings`, 'prefix')
          .then(prefix => {
            if (prefix === null) {
              this.db.set(`server:${msg.server.id}:settings`, 'prefix', this.config.discord.prefix)
              prefix = this.config.discord.prefix
            }
            if (msg.content.startsWith(prefix)) {
              const trigger = msg.content.toLowerCase().split(' ')[0].substring(prefix.length)
              const args = msg.content.toLowerCase().split(' ').splice(1)
              this.emit(trigger, args, msg, client)
            }
            return cb(null)
          })
          .catch(err => cb(err))
        },
        cb => {
          this.db.get(`server:${msg.server.id}:settings`, 'admin_prefix')
          .then(prefix => {
            if (prefix === null) {
              this.db.set(`server:${msg.server.id}:settings`, 'admin_prefix', this.config.discord.admin_prefix)
              prefix = this.config.discord.admin_prefix
            }
            if (msg.content.startsWith(prefix)) {
              const trigger = msg.content.toUpperCase().split(' ')[0].substring(prefix.length)
              const args = msg.content.toLowerCase().split(' ').splice(1)
              this.emit(trigger, args, msg, client)
            }
            return cb(null)
          })
        }
      ])
    })

    client.loginWithToken(this.config.discord.token)
    this.client = client
  }

  attachPlugins () {
    this.plugins = rq(this.pluginsPath)
    this.emit('loaded:plugins')
  }

  runPlugins () {
    for (let plugin in this.plugins) {
      for (let command in this.plugins[plugin]) {
        this.plugins[plugin][command] = new this.plugins[plugin][command]()
      }
    }
  }

  reloadPlugins () {
    Object.keys(require.cache).forEach(key => {
      if (key.startsWith(this.pluginsPath) || key.startsWith(this.modPluginsPath)) cr(key)
    })
    this.emit('clear:plugins')
  }
}

module.exports = Bot
