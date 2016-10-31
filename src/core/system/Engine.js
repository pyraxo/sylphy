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
    this.paths = bot.paths

    this.ipc = new IPC(bot.shardIDs, bot)
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

  loadCommands (mod) {
    let count = 0
    this.commands.eject(mod)

    const commands = requireAll(this.paths.commands)
    for (let module in commands) {
      if (typeof mod === 'string' && module !== mod) continue
      for (let command in commands[module]) {
        this.commands.attach(module, commands[module][command])
        count++
      }
    }
    this.emit('loaded:commands', count)
  }

  loadMiddleware () {
    let count = 0
    let mw = requireAll(this.paths.middleware)
    mw = Object.keys(mw).sort((a, b) => mw[a].priority - mw[b].priority).map(m => mw[m])
    mw.forEach(m => {
      this.bridge.push(m)
      count++
    })
    this.emit('loaded:middleware', count)
  }

  loadHandlers () {
    let count = 0
    this.handlers.eject()

    const handlers = requireAll(this.paths.handlers)
    for (let handler in handlers) {
      this.handlers.attach(handler, handlers[handler])
      count++
    }
    this.emit('loaded:handlers', count)
  }

  loadIPC () {
    let count = 0
    const processes = requireAll(this.paths.ipc)
    for (let proc in processes) {
      this.ipc.register(processes[proc])
      count++
    }
    this.emit('loaded:ipc', count)
  }

  reload (dir = this.paths.commands, cat = '.') {
    let count = 0
    Object.keys(require.cache).forEach(filepath => {
      if (!filepath.startsWith(path.join(dir, cat))) return
      delete require.cache[require.resolve(filepath)]
      count++
    })

    return count
  }

  reloadCommands (module) {
    let cmd = this.reload(this.paths.commands, module)
    this.emit('reload:commands', cmd)
  }

  reloadMiddleware () {
    let mw = this.reload(this.paths.middleware)
    this.emit('reload:middleware', mw)
  }

  reloadHandler () {
    let count = this.reload(this.paths.handlers)
    this.emit('reload:handlers', count)
  }

  reloadIPC () {
    let count = this.reload(this.paths.ipc)
    this.emit('reload:ipc', count)
  }
}

module.exports = Engine
