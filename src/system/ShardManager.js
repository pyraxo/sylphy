const logger = require('winston')
const cluster = require('cluster')

const Shard = require('./Shard')
const Collection = require('../util/Collection')

class ShardManager {
  constructor (shardCount = 2) {
    this.shards = new Collection()
    this.shardCount = shardCount
  }

  async createShards () {
    cluster.on('exit', this.handleExit.bind(this))
    cluster.on('online', this.onReady.bind(this))
    cluster.on('message', this.onMessage.bind(this))

    for (let i = 0; i < this.shardCount; i++) {
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
    logger.debug(`WORKER ${worker.process.pid} EXITED: Shard ${shard.id}`)
    this.shards.delete(shard.id)
    this.createShard(shard.id)
  }

  onReady (worker) {
    const shard = this.getShard(worker)
    logger.info(`WORKER ${worker.process.pid} ONLINE: Shard ${shard.id}`)
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

    Promise.all(promises).then(results => {
      worker.send({ op: 'resp', d: results })
    }).catch(err => {
      worker.send({ op: 'error', d: err })
    })
  }

  broadcast (message) {
    if (message.op === 'broadcast') {
      message = message.d
    }

    for (const shard of this.shards.values()) {
      shard.worker.send(message)
    }
  }
}

module.exports = ShardManager
