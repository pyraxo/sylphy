const logger = require('winston')
const cluster = require('cluster')
const os = require('os')

const Collection = require('../util/Collection')

class Shard {
  constructor (id) {
    this.worker = cluster.fork({ BASE_SHARD_ID: id })

    this.id = id
    this.process = this.worker.process
    this.pid = this.process.pid
  }

  awaitResponse (message) {
    return new Promise((resolve, reject) => {
      const awaitListener = (msg) => {
        if (!['resp', 'error'].includes(msg.op)) return
        return resolve({ id: this.id, result: msg.d })
      }

      this.worker.once('message', awaitListener)
      this.worker.send(message)

      setTimeout(() => {
        this.worker.removeListener('message', awaitListener)
        return reject('IPC request timed out.')
      }, 1000)
    })
  }
}

class ShardManager {
  constructor (processCount = os.cpus().length) {
    this.shards = new Collection()
    this.processCount = processCount
  }

  async createShards () {
    cluster.on('exit', this.handleExit.bind(this))
    cluster.on('online', this.onReady.bind(this))
    cluster.on('message', this.onMessage.bind(this))

    for (let i = 0; i < this.processCount; i++) {
      this.createShard(i)
      await Promise.delay(6000)
    }
  }

  createShard (id) {
    const shard = new Shard(id, this)
    this.shards.set(shard.id, shard)
  }

  getShard (worker) {
    return this.shards.find(s => s.pid === worker.process.pid)
  }

  handleExit (worker) {
    const shard = this.getShard(worker)
    logger.info(`WORKER ${worker.process.pid} EXITED: Process ${shard.id}`)
    this.shards.delete(shard.id)
    this.createShard(shard.id)
  }

  onReady (worker) {
    const shard = this.getShard(worker)
    logger.info(`WORKER ${worker.process.pid} ONLINE: Process ${shard.id}`)
  }

  onMessage (worker, message) {
    if (!message.op) return
    if (message.op === 'resp') return
    if (this[message.op]) {
      return this[message.op](message)
    }

    this.awaitResponse(worker, message)
  }

  awaitResponse (worker, message) {
    const promises = []

    for (const shard of this.shards.values()) {
      promises.push(shard.awaitResponse(message))
    }

    Promise.all(promises)
    .then(results => worker.send({ op: 'resp', d: results }))
    .catch(err => worker.send({ op: 'error', d: err }))
  }

  broadcast (message) {
    if (message.op === 'broadcast') {
      message = message.d
    }

    for (const shard of this.shards.values()) {
      shard.worker.send(message)
    }
  }

  async restart (message) {
    if (message.hasOwnProperty('d') && !isNaN(message.d)) {
      const shard = this.shards.get(message.d)
      if (!shard) return
      shard.worker.kill()
    } else {
      for (let shard of this.shards.values()) {
        shard.worker.kill()
        await Promise.delay(6000)
      }
    }
  }
}

module.exports = ShardManager
