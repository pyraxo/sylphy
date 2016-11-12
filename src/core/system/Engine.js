const path = require('path')
const logger = require('winston')
const EventEmitter = require('eventemitter3')
const requireAll = require('require-all')

const Cache = require('./Cache')
const Bridge = require('./Bridge')
const Commander = require('./Commander')
const Router = require('./Router')

const IPC = require('../managers/IPCManager')
const ModelManager = require('../managers/ModelManager')

class Engine extends EventEmitter {
  constructor (bot) {
    super()

    this.client = bot.client
    this.paths = bot.paths

    let ipc = this.ipc = new IPC(bot.shardIDs, bot)
    let db = this.db = new ModelManager(bot.dbOptions)
    let cache = this.cache = new Cache()

    this.commands = new Commander(bot)
    this.modules = new Router(bot.client, bot)
    this.bridge = new Bridge(this.commands)

    ipc.on('registered', command => this.emit('register:ipc', command))
    db.on('loaded', id => this.emit('register:db', id))
    cache.on('error', err => logger.error(err))
  }

  run () {
    this.loadAll()

    const admins = process.env.ADMIN_IDS.split(', ')
    this.client.on('messageCreate', msg => {
      if (msg.author.id === this.client.id || msg.author.bot) return
      this.bridge.handle({
        msg,
        admins,
        commander: this.commands,
        modules: this.modules,
        client: this.client,
        cache: this.cache,
        db: this.db.models,
        data: this.db.data
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
    this.loadModules()
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
    for (let group in commands) {
      if (typeof mod === 'string' && group !== mod) continue
      for (let command in commands[group]) {
        let cmds = commands[group][command]
        cmds = Array.isArray(cmds) ? cmds : [cmds]

        cmds.forEach(c => {
          this.commands.attach(group, c)
          count++
        })
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

  loadModules () {
    let count = 0
    const modules = requireAll(this.paths.modules)
    for (let module in modules) {
      this.modules.attach(modules, modules[module])
      count++
    }
    this.modules.setup()

    this.emit('loaded:modules', count)
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
      const err = new TypeError(`"${type}" not found`)
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
