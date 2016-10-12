const { Client } = require('eris')
const EventEmitter = require('eventemitter3')

const IPC = require('./IPCManager')
const Processor = require('./Processor')
const Chain = require('../util/Chain')
const Collection = require('../util/Collection')

class Engine extends EventEmitter {
  constructor ({ shardID, shardCounts }, token) {
    super()
    if (typeof token !== 'string') {
      throw new Error('Unable to resolve Discord token')
    }

    this.shardID = shardID
    this.shardCounts = shardCounts

    this._createClient(token)

    this.manager = new Chain()
    this.processor = new Processor(this)
    this.ipc = new IPC(this.shardID)
  }

  createClient (token, shardID, shardCounts) {
    return new Client(token, {
      messageLimit: 0,
      getAllUsers: true,
      disableEveryone: true,
      firstShardID: shardID,
      lastShardID: shardID,
      maxShards: shardCounts,
      disableEvents: {
        TYPING_START: true,
        MESSAGE_UPDATE: true,
        MESSAGE_DELETE: true,
        MESSAGE_DELETE_BULK: true
      }
    })
  }

  _createClient (token) {
    this.events = new Collection()
    this.client = this.createClient(token, this.shardID, this.shardCounts)

    this.addListener('ready', '__ready', () => this.emit('ready', this.client.user))
    this.addListener('error', '__error', err => this.emit('error', err))
    this.addListener('shardReady', '__shardReady', id => this.emit('shardReady', id))
    this.addListener('disconnect', '__disconnected', () => this.emit('disconnected'))
    this.addListener('messageCreate', '__commander', msg => {
      if (msg.author.id === this.client.user.id) return
      this.manager.handle({ msg, processor: this.processor }, (err, container) => {
        if (err && err !== true) return this.emit('messageError', err)
      })
    })
  }

  addListener (event, name, process) {
    if (typeof event !== 'string') throw new Error('Listener must have an event')
    if (typeof name !== 'string') throw new Error('Listener must have a name')
    if (typeof process !== 'function') throw new Error('Listener must be a function')
    if (this.events.has(event)) {
      this.events.get(event).set(name, process)
      return
    }
    this.events.set(event, new Collection().set(name, process))
  }

  removeListener (event, name = '*') {
    if (name === '*') {
      this.events.get(event).clear()
    } else if (this.events.has(event)) {
      this.events.get(event).delete(name)
    }
  }

  clearListeners (event) {
    if (event.startsWith('__')) return
    this.events.delete(event)
  }

  refreshListeners () {
    this.events.forEach((event, name) => {
      this.client.removeListener(event)
      this.client.on(name, (...args) => {
        event.forEach(e => e(...args))
      })
    })
  }

  login () {
    this.refreshListeners()
    this.emit('connecting')
    this.client.connect()

    this.manager.setEndpoint(container => {
      try {
        container.processor.runPlugin(container.trigger, container)
      } catch (err) {
        this.emit('error', err)
      }
    })
  }

  fetchCounts () {
    return {
      guilds: this.client.guilds.size,
      channels: Object.keys(this.client.channelGuildMap).length,
      users: this.client.users.size
    }
  }

  attachModule (...args) {
    this.processor.attachModule(...args)
  }

  ejectModule (...args) {
    this.processor.ejectModule(...args)
  }

  attachMiddleware (middleware) {
    if (!middleware.hasOwnProperty('process')) {
      throw new Error('Middleware must contain the process method')
    }
    if (typeof middleware.process !== 'function') {
      throw new Error('Middleware process must be a function')
    }
    this.manager.push(middleware.process)
  }
}

module.exports = Engine
