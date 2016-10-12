const EventEmitter = require('eventemitter3')
const path = require('path')
const logger = require('winston')
const requireAll = require('require-all')

const Engine = require('./system/Engine')
const PLUGIN_PATH = path.join(__dirname, 'plugins')
const MIDDLEWARE_PATH = path.join(__dirname, 'middleware')

class Automaton extends EventEmitter {
  constructor (options) {
    super()
    this.shardID = options.shardID
    this.shardCounts = options.shardCounts
  }

  run () {
    let engine = new Engine({ shardID: this.shardID, shardCounts: this.shardCounts }, process.env.CLIENT_TOKEN)
    engine.on('connecting', () => this.emit('connecting'))
    engine.on('error', err => this.emit('error', err))
    engine.on('ready', user => this.emit('ready', user))
    engine.login()

    this.engine = engine
    this.loadPlugins()
    this.loadMiddleware()

    process.on('message', ({ title, body }) => {
      if (!title) return
      if (title === 'reload_plugins') return this.reloadPlugins(body)
      if (title === 'reload_middleware') return this.reloadMiddleware()
    })
  }

  loadPlugins () {
    let count = 0
    let plugins = requireAll(PLUGIN_PATH)
    for (let category in plugins) {
      if (!['moderator', 'standard'].find(c => c === category)) return
      for (let module in plugins[category]) {
        this.engine.attachModule(`${category}:${module}`, plugins[category][module])
        count++
      }
    }
    this.emit('loaded:plugins', count)
  }

  loadMiddleware () {
    let count = 0
    let mw = requireAll(MIDDLEWARE_PATH)
    mw = Object.keys(mw).sort((a, b) => mw[a].priority - mw[b].priority).map(m => mw[m])
    mw.forEach(m => {
      this.engine.attachMiddleware(m)
      count++
    })
    this.emit('loaded:middleware', count)
  }

  reloadPlugins ({ category = '.', module = '.' } = {}) {
    let count = Object.keys(require.cache).reduce((num, filepath) => {
      if (!filepath.startsWith(path.join(PLUGIN_PATH, category, module))) return num
      delete require.cache[require.resolve(filepath)]
      return ++num
    }, 0)
    this.emit('reload:plugins', count)
  }

  reloadMiddleware () {
    let count = Object.keys(require.cache).reduce((num, filepath) => {
      if (!filepath.startsWith(MIDDLEWARE_PATH)) return num
      delete require.cache[require.resolve(filepath)]
      return ++num
    }, 0)
    this.emit('reload:middleware', count)
  }
}

module.exports = Automaton
