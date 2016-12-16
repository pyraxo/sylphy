const { Client } = require('eris')
const path = require('path')
const logger = require('winston')

const Engine = require('./system/Engine')

class Automaton extends Client {
  constructor (options) {
    super(process.env.CLIENT_TOKEN, {
      messageLimit: 0,
      getAllUsers: true,
      disableEveryone: true,
      firstShardID: options.firstShardID,
      lastShardID: options.lastShardID,
      maxShards: options.maxShards,
      disableEvents: {
        TYPING_START: true,
        MESSAGE_UPDATE: true,
        MESSAGE_DELETE: true,
        MESSAGE_DELETE_BULK: true
      }
    })

    this.shardIDs = []
    for (let i = this.firstShardID; i <= this.lastShardID; i++) {
      this.shardIDs.push(i)
    }

    this.paths = {
      commands: options.commands || path.join(__dirname, '../commands'),
      middleware: options.middleware || path.join(__dirname, '../middleware'),
      modules: options.middleware || path.join(__dirname, '../modules'),
      ipc: options.middleware || path.join(__dirname, '../ipc'),
      models: options.models || path.join(__dirname, '../models'),
      resources: options.resources || path.join(process.cwd(), 'resources')
    }

    this.dbOptions = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      db: process.env.DB_DBNAME,
      authKey: process.env.DB_AUTHKEY
    }

    this.init()
  }

  init () {
    let engine = this.engine = new Engine(this)

    engine.on('loaded:commands', count => logger.info(`Loaded ${count} commands`))
    engine.on('loaded:middleware', count => logger.info(`Loaded ${count} middleware`))
    engine.on('loaded:modules', count => logger.info(`Loaded ${count} modules`))

    engine.on('register:ipc', command => logger.debug(`Registering IPC command '${command}'`))
    engine.on('register:db', id => logger.debug(`Registering DB model '${id}'`))

    engine.run()
  }

  run () {
    this.emit('connecting')
    this.connect()
  }

  fetchCounts () {
    return {
      guilds: this.guilds.size,
      channels: Object.keys(this.channelGuildMap).length,
      users: this.users.size
    }
  }
}

module.exports = Automaton
