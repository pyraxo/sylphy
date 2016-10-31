const path = require('path')
const logger = require('winston')
const EventEmitter = require('eventemitter3')
const requireAll = require('require-all')

const Manager = require('./Manager')
const Bridge = require('./Bridge')
const IPC = require('../shards/IPCManager')

class Engine extends EventEmitter {
  constructor (bot) {
    super()

    this.client = bot.client
    this.config = bot.config

    this.stations = bot.shardIDs.map(i => new IPC(i))
    this.commands = new Manager(bot)
    this.handlers = new Manager(bot)
    this.bridge = new Bridge(this.commands)
  }

  run () {
    this.loadBatch()

    this.client.on('messageCreate', msg => {
      this.bridge.handle({ msg, manager: this.commands })
      .catch(err => {
        if (err) logger.error(`Failed to run command: ${err}`)
      })
    })
  }

  loadBatch () {
    this.loadCommands()
    this.loadMiddleware()
    this.loadHandlers()
    this.loadIPC()
  }

  loadCommands () {
    let count = 0
    const commands = requireAll(this.config.commands)
    for (let module in commands) {
      for (let command in commands[module]) {
        this.commands.attach(module, commands[module][command])
        count++
      }
    }
    this.emit('loaded:commands', count)
  }

  loadMiddleware () {
    let count = 0
    let mw = requireAll(this.config.middleware)
    mw = Object.keys(mw).sort((a, b) => mw[a].priority - mw[b].priority).map(m => mw[m])
    mw.forEach(m => {
      this.bridge.push(m)
      count++
    })
    this.emit('loaded:middleware', count)
  }

  loadHandlers () {
    let count = 0
    const handlers = requireAll(this.config.handlers)
    for (let handler in handlers) {
      this.handlers.attach(handler, handlers[handler])
      count++
    }
    this.emit('loaded:handlers', count)
  }

  loadIPC () {
    let count = 0
    const processes = requireAll(this.config.ipc)
    for (let proc in processes) {
      this.stations.forEach(s => s.register(processes[proc]))
      count++
    }
    this.emit('loaded:ipc', count)
  }

  reload (dir = this.config.commands, cat = '.') {
    Object.keys(require.cache).forEach(filepath => {
      if (!filepath.startsWith(path.join(this.commandsPath, cat))) return
      delete require.cache[require.resolve(filepath)]
    })
  }

  reloadCommands (module) {
    this.reload(this.config.commands, module)
    this.emit('reload:commands')
  }

  reloadMiddleware () {
    this.reload(this.config.middleware)
    this.emit('reload:middleware')
  }

  reloadHandler () {
    this.reload(this.config.handlers)
    this.emit('reload:handlers')
  }

  reloadIPC () {
    this.reload(this.config.ipc)
    this.emit('reload:ipc')
  }
}

module.exports = Engine
