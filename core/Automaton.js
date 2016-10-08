const EventEmitter = require('eventemitter3')
const _ = require('lodash')
const path = require('path')
const logger = require('winston')
const requireAll = require('require-all')
const clearRequire = require('clear-require')

const Engine = require('./system/Engine')
const PLUGIN_PATH = path.join(process.cwd(), 'plugins')
const MIDDLEWARE_PATH = path.join(process.cwd(), 'middleware')

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

    process.on('message', ({ title }) => {
      if (!title) return
      if (title === 'reload_plugins') return this.reloadPlugins()
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
    let middleware = requireAll(MIDDLEWARE_PATH)
    middleware = _.sortBy(middleware, 'priority')
    middleware.forEach(m => {
      this.engine.attachMiddleware(m)
      count++
    })
    this.emit('loaded:middleware', count)
  }

  reloadPlugins () {
    let count = Object.keys(require.cache).reduce((num, filepath) => {
      if (!filepath.startsWith(PLUGIN_PATH)) return num
      clearRequire(filepath)
      return ++num
    }, 0)
    this.emit('reload:plugins', count)
  }

  reloadMiddleware () {
    let count = Object.keys(require.cache).reduce((num, filepath) => {
      if (!filepath.startsWith(MIDDLEWARE_PATH)) return num
      clearRequire(filepath)
      return ++num
    }, 0)
    this.emit('reload:middleware', count)
  }
}

module.exports = Automaton
