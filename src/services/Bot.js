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
    this.logger = new Logger()
    this.configPath = options.configPath || path.join(process.cwd(), 'config')
    this.modulesPath = options.modulesPath || path.join(process.cwd(), 'modules')
    this.dbPath = options.dbPath || path.join(process.cwd(), 'db')
    this.shardID = options.shardID || 0
    this.shardCount = options.shardCount || 1

    this.once('loaded:configs', () => this.login())
    this.once('loaded:discord', () => this.attachModules())
    this.on('loaded:modules', () => this.runModules())
    this.on('clear:modules', () => this.attachModules())
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
      this.logger.info(`${chalk.red.bold('TatsuBot')} is ready! Logging in as ${chalk.cyan.bold(client.user.name)}`)
      this.logger.info(`Listening to ${chalk.magenta.bold(client.channels.length)} channels, on ${chalk.green.bold(client.servers.length)} servers`)
    })

    client.on('message', msg => {
      if (msg.content.startsWith(this.config.prefix)) {
        this.logger.heard(msg)
        const trigger = msg.content.split(' ')[0].substring(this.config.prefix.length)
        const suffix = msg.content.split(' ').splice(1).join(' ')
        this.emit(trigger, suffix, msg, client)
      }
    })

    client.loginWithToken(this.config.token)
    this.client = client
  }

  attachModules () {
    this.modules = rq(this.modulesPath)
    this.emit('loaded:modules')
  }

  runModules () {
    for (let module in this.modules) {
      for (let command in this.modules[module]) {
        this.modules[module][command] = new this.modules[module][command]()
      }
    }
  }

  reloadModules () {
    Object.keys(require.cache).forEach(key => {
      if (key.startsWith(path.join(process.cwd(), 'modules'))) cr(key)
    })
    this.emit('clear:modules')
    this.attachModules()
  }
}

module.exports = Bot
