const path = require('path')
const logger = require('winston')
const EventEmitter = require('eventemitter3')
const requireAll = require('require-all')

const Container = require('./Container')
const Bridge = require('./Bridge')
const IPC = require('../managers/IPCManager')
const ModelManager = require('../managers/ModelManager')

class Engine extends EventEmitter {
  constructor (bot) {
    super()

    this.client = bot.client
    this.paths = bot.paths

    let ipc = this.ipc = new IPC(bot.shardIDs, bot)
    let db = this.db = new ModelManager(bot.dbOptions)

    this.commands = new Container(bot)
    this.modules = new Container(bot)
    this.bridge = new Bridge(this.commands)

    ipc.on('registered', command => this.emit('register:ipc', command))
    db.on('loaded', id => this.emit('register:db', id))
  }

  run () {
    this.loadAll()

    this.client.on('messageCreate', msg => {
      this.bridge.handle({
        msg, commander: this.commands, db: this.db.models, client: this.client
      }).catch(err => {
        if (err) logger.error(`Failed to run command: ${err.stack}`)
      })
    })

    this.emit('ready')
  }

  loadAll () {
    this.loadModels()
    this.loadCommands()
    this.loadMiddleware()
    this.loadHandlers()
    this.loadIpc()
  }

  loadModels () {
    this.db.loadFolder(this.paths.models)
    this.emit('loaded:db')
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
    this.bridge.destroy()

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
    this.modules.eject()

    let count = 0
    const handlers = requireAll(this.paths.handlers)
    for (let handler in handlers) {
      this.modules.attach(handler, handlers[handler])
      count++
    }
    this.emit('loaded:handlers', count)
  }

  loadIpc () {
    let count = 0
    const processes = requireAll(this.paths.ipc)
    for (let proc in processes) {
      this.ipc.register(processes[proc])
      count++
    }
    this.emit('loaded:ipc', count)
  }

  async reload (type = 'commands', cat = '.') {
    const dir = this.paths[type]
    if (!dir) {
      const err = new Error(`Cannot reload "${type}": Type not found`)
      this.emit('error', err)
      throw err
    }

    let count = 0
    Object.keys(require.cache).forEach(filepath => {
      if (!filepath.startsWith(path.join(dir, cat))) return
      delete require.cache[require.resolve(filepath)]
      count++
    })
    this.emit(`load:${type}`, count)
    return count
  }
}

module.exports = Engine
