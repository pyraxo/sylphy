const path = require('path')
const logger = require('winston')
const EventEmitter = require('eventemitter3')
const requireAll = require('require-all')

const Bridge = require('./Bridge')
const Commander = require('./Commander')
const Router = require('./Router')

const IPC = require('../managers/Transmitter')
const ModelManager = require('../managers/ModelManager')
const { Parser, Cache, readdirRecursive } = require('../util')

class Engine extends EventEmitter {
  constructor (bot) {
    super()

    this.bot = bot
    this.paths = bot.paths

    let ipc = this.ipc = new IPC(bot.shardIDs, bot)
    let db = this.db = new ModelManager(bot.dbOptions)
    let cache = this.cache = new Cache()

    this.commands = new Commander(bot)
    this.modules = new Router(bot)
    this.bridge = new Bridge(this.commands)
    this.i18n = new Parser(path.join(bot.paths.resources, 'i18n'))

    ipc.on('registered', command => this.emit('register:ipc', command))
    db.on('loaded', id => this.emit('register:db', id))
    cache.on('error', err => logger.error(err))
  }

  run () {
    this.loadAll()

    const admins = process.env.ADMIN_IDS.split(', ')
    this.bot.on('messageCreate', msg => {
      if (msg.author.id === this.bot.user.id || msg.author.bot) return
      this.bridge.handle({
        msg,
        admins,
        commander: this.commands,
        modules: this.modules,
        client: this.bot,
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

  loadCommands (mod, cmd) {
    let count = 0
    this.commands.eject(mod)

    const commands = requireAll(this.paths.commands)
    for (let group in commands) {
      if (typeof mod === 'string' && group !== mod) continue
      for (let command in commands[group]) {
        if (typeof cmd === 'string' && cmd !== command) continue
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

  loadMiddleware (group = '.', file) {
    this.bridge.destroy()

    let count = 0
    readdirRecursive(this.paths.middleware, group).then(mw => {
      if (typeof file === 'string') mw = mw.filter(m => path.basename(m).startsWith(file))
      mw = mw.map(mw => require(mw))
      mw = Object.keys(mw).sort((a, b) => mw[a].priority - mw[b].priority).map(m => mw[m])
      mw.forEach(m => {
        this.bridge.push(m)
        count++
      })
      this.emit('loaded:middleware', count)
    })
  }

  loadModules (group = '.', file) {
    this.modules.destroy()

    let count = 0
    readdirRecursive(this.paths.modules, group).then(mod => {
      if (typeof file === 'string') mod = mod.filter(m => path.basename(m).startsWith(file))
      mod = mod.map(m => require(m))
      for (let module in mod) {
        this.modules.attach(mod, mod[module])
        count++
      }
      this.modules.initAll()
      this.emit('loaded:modules', count)
    })
  }

  loadIpc (group = '.', file) {
    let count = 0
    readdirRecursive(this.paths.ipc, group).then(prcs => {
      if (typeof file === 'string') prcs = prcs.filter(m => path.basename(m).startsWith(file))
      prcs = prcs.map(i => require(i))
      for (let proc in prcs) {
        this.ipc.register(prcs[proc])
        count++
      }
      this.emit('loaded:ipc', count)
    })
  }

  async reload (type = 'commands', cat = '.', file = '.') {
    this.i18n.reload()

    const dir = this.paths[type]
    if (!dir) {
      const err = new TypeError(`"${type}" not found`)
      this.emit('error', err)
      throw err
    }

    let count = 0
    Object.keys(require.cache).forEach(filepath => {
      if (!filepath.startsWith(path.join(dir, cat, file))) return
      delete require.cache[require.resolve(filepath)]
      count++
    })
    this.emit(`reload:${type}`, count)
    return count
  }
}

module.exports = Engine
