const chalk = require('chalk')
const cluster = require('cluster')
const winston = require('winston')
const winstonCluster = require('winston-cluster')
const EventEmitter = require('eventemitter3')

const Automaton = require('./Automaton')
const Collection = require('./util/Collection')

class Portal extends EventEmitter {
  constructor () {
    super()
    if (cluster.isMaster) this.initMaster()
    else if (cluster.isWorker) this.initWorker()
  }

  // Master methods
  initMaster () {
    winstonCluster.bindListeners()
    this.workers = new Collection()

    this.spawnWorkers(parseInt(process.env.CLIENT_SHARDS, 10))
  }

  spawnWorkers (counts) {
    for (let i = 0; i < counts; i++) {
      this.workers.set(i, {
        isReady: false,
        counts: {}
      })
      setTimeout(() => this.spawnWorker(i, counts), i * 6 * 1000)
    }
  }

  spawnWorker (count = 0, total = 1) {
    if (count >= total) return
    const worker = cluster.fork({ SHARD_ID: count })
    worker.on('online', () => {
      winston.debug(`WORKER ${worker.process.pid} ONLINE: Shard ${count}`)
    })
    worker.on('exit', () => {
      winston.debug(`WORKER ${worker.process.pid} EXITED: Shard ${count}`)
      setTimeout(() => this.spawnWorker(count), 1000)
    })
    worker.on('message', msg => {
      if (!msg.hasOwnProperty('title')) return
      switch (msg.title) {
        case 'ready': {
          this.workers.set(count, {
            isReady: true,
            counts: msg.counts,
            worker
          })
          if (this.workers.find(w => w.isReady === false)) return
          const counts = this.fetchTotal()
          for (let key in counts) winston.info(`Total ${key} loaded: ${chalk.red.bold(counts[key])}`)
          break
        }
        case '__relay': {
          this.broadcast(msg.relay)
          break
        }
      }
    })
  }

  fetchTotal () {
    return this.workers.map(c => c.counts).reduce((c, s) => {
      for (let key in c) c[key] += s[key]
      return c
    })
  }

  broadcast (...args) {
    if (cluster.isMaster) {
      for (let container of cluster.workers) {
        container.worker.send(...args)
      }
    }
  }

  // Worker methods
  initWorker () {
    winstonCluster.bindTransport()
    const shardID = parseInt(process.env.SHARD_ID, 10)
    const shardCounts = parseInt(process.env.CLIENT_SHARDS, 10)
    const automaton = new Automaton({ shardID, shardCounts })

    automaton.once('ready', user => {
      const counts = automaton.engine.fetchCounts()

      winston.info(`${chalk.red.bold('iris')} - Shard ${shardID} is ready`)
      winston.info(
        `G: ${chalk.green.bold(counts.guilds)} | ` +
        `C: ${chalk.green.bold(counts.channels)} | ` +
        `U: ${chalk.green.bold(counts.users)}`
      )
      winston.info(
        `Prefix: ${chalk.cyan.bold(process.env.CLIENT_PREFIX_STANDARD)} | ` +
        `Admin Prefix: ${chalk.cyan.bold(process.env.CLIENT_PREFIX_ADMIN)}`
      )

      process.send({ title: 'ready', counts })
    })
    automaton.on('error', err => winston.error(err))
    automaton.on('loaded:plugins', count => winston.info(`Loaded ${count} plugins`))
    automaton.on('loaded:middleware', count => winston.info(`Loaded ${count} middleware`))

    automaton.run()
  }

  relay (msg, container) {
    if (cluster.isWorker) {
      process.send({ title: '__relay', relay: msg })
    }
  }
}

module.exports = new Portal()
