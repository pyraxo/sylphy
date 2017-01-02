const { Collection } = require('../util')
const { Cluster } = require('../structures')

/**
 * Shard cluster manager
 * @prop {Collection} clusters Collection of clusters
 */
class Crystal {
  /**
   * Creates a new Crystal instance
   * @arg {String} file Path to file to run
   * @arg {Number} [count] Number of clusters to create, defaults to number of CPU cores
   */
  constructor (file, count = require('os').cpus().length) {
    this.clusters = new Collection()
    this._count = count
    this._file = file
  }

  /** Spawns new clusters */
  async createClusters () {
    for (let i = 0; i < this.processCount; i++) {
      this.createCluster(i)
      await Promise.delay(6000)
    }
  }

  /**
   * Spawns a cluster
   * @arg {Number} id Cluster ID
   */
  createCluster (id) {
    const cluster = new Cluster(this._file, id)
    cluster.on('exit', this.onExit.bind(this, cluster.worker))
    cluster.on('online', this.onReady.bind(this, cluster.worker))
    cluster.on('message', this.onMessage.bind(this, cluster.worker))
    this.clusters.set(cluster.id, cluster)
  }

  /**
   * Fetches a cluster
   * @arg {Number} pid Process ID to find
   */
  getCluster (pid) {
    return this.clusters.find(s => s.pid === pid)
  }

  onExit (worker) {
    const cluster = this.getCluster(worker)
    console.log(`WORKER ${worker.pid} EXITED: Process ${cluster.id}`)
    this.clusters.delete(cluster.id)
    this.createCluster(cluster.id)
  }

  onReady (worker) {
    const cluster = this.getCluster(worker)
    console.log(`WORKER ${worker.pid} ONLINE: Process ${cluster.id}`)
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

    for (const cluster of this.clusters.values()) {
      promises.push(cluster.awaitResponse(message))
    }

    Promise.all(promises)
    .then(results => worker.send({ op: 'resp', d: results, code: message.code }))
    .catch(err => worker.send({ op: 'error', d: err, code: message.code }))
  }

  broadcast (message) {
    if (message.op === 'broadcast') {
      message = message.d
    }

    for (const cluster of this.clusters.values()) {
      cluster.worker.send(message)
    }
  }

  /**
   * Restarts all clusters, or a specific one
   * @arg {Object} [message] The message sent
   * @arg {Number} [message.d] The cluster ID to restart
   */
  async restart (message = {}) {
    if (typeof message.d === 'number') {
      const cluster = this.clusters.get(message.d)
      if (!cluster) return
      cluster.worker.kill()
    } else {
      for (let cluster of this.clusters.values()) {
        cluster.worker.kill()
        await Promise.delay(6000)
      }
    }
  }
}

module.exports = Crystal
