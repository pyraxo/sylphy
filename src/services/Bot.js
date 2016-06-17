import { Client as Discord } from 'discord.js'
import { EventEmitter } from 'events'
import path from 'path'
import chalk from 'chalk'
import rq from 'require-all'
import cr from 'clear-require'

import Logger from './Logger'
import Configs from './Configurator'

class Bot extends EventEmitter {
  constructor (options) {
    options = options || {}
    super()
    this.logger = new Logger('BOT')
    this.configPath = options.configPath || path.join(process.cwd(), 'config')
    this.pluginsPath = options.pluginsPath || path.join(process.cwd(), 'lib/plugins')
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
    })
  }

  login () {
    if (typeof this.config.token === 'undefined') {
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
      if (msg.content.startsWith(this.config.prefix)) {
        this.logger.heard(msg)
        const trigger = msg.content.toLowerCase().split(' ')[0].substring(this.config.prefix.length)
        const args = msg.content.toLowerCase().split(' ').splice(1)
        this.emit(trigger, args, msg, client)
      }
    })

    client.loginWithToken(this.config.token)
    this.client = client
  }

  attachPlugins () {
    this.plugins = rq(this.pluginsPath)
    this.emit('loaded:plugins')
  }

  runPlugins () {
    for (let mod in this.plugins) {
      for (let command in this.plugins[mod]) {
        this.plugins[mod][command] = new this.plugins[mod][command]()
      }
    }
  }

  reloadPlugins () {
    Object.keys(require.cache).forEach(key => {
      if (key.startsWith(path.join(process.cwd(), 'plugins'))) cr(key)
    })
    this.emit('clear:plugins')
    this.attachPlugins()
  }
}

module.exports = Bot
