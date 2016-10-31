const { Client } = require('eris')
const path = require('path')
const logger = require('winston')
const EventEmitter = require('eventemitter3')

const Engine = require('./system/Engine')

class Automaton extends EventEmitter {
  constructor (options) {
    super()

    this.firstShardID = options.firstShardID
    this.lastShardID = options.lastShardID
    this.maxShards = options.maxShards

    this.shardIDs = []
    for (let i = this.firstShardID; i <= this.lastShardID; i++) {
      this.shardIDs.push(i)
    }

    this.config = {
      commands: options.commands || path.join(__dirname, '../commands'),
      middleware: options.middleware || path.join(__dirname, '../middleware'),
      handlers: options.middleware || path.join(__dirname, '../handlers'),
      ipc: options.middleware || path.join(__dirname, '../ipc')
    }

    this.init()
  }

  init () {
    let client = new Client(process.env.CLIENT_TOKEN, {
      messageLimit: 0,
      getAllUsers: true,
      disableEveryone: true,
      firstShardID: this.firstShardID,
      lastShardID: this.lastShardID,
      maxShards: this.maxShards,
      disableEvents: {
        TYPING_START: true,
        MESSAGE_UPDATE: true,
        MESSAGE_DELETE: true,
        MESSAGE_DELETE_BULK: true
      }
    })

    client.on('ready', () => this.emit('ready'))
    client.on('error', err => this.emit('error', err))
    client.on('shardReady', id => this.emit('shardReady', id))
    client.on('disconnect', () => this.emit('disconnect'))

    this.client = client
    this.loadEngine()
  }

  loadEngine () {
    let engine = new Engine(this)

    engine.on('loaded:commands', count => logger.info(`Loaded ${count} commands`))
    engine.on('loaded:middleware', count => logger.info(`Loaded ${count} middleware`))

    engine.on('reload:commands', () => logger.info(`Reloading commands`))
    engine.on('reload:middleware', () => logger.info(`Reloading middleware`))

    engine.run()
    this.engine = engine
  }

  run () {
    this.emit('connecting')
    this.client.connect()
  }

  fetchCounts () {
    return {
      guilds: this.client.guilds.size,
      channels: Object.keys(this.client.channelGuildMap).length,
      users: this.client.users.size
    }
  }
}

module.exports = Automaton
