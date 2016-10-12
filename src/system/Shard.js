const cluster = require('cluster')

class Shard {
  constructor (id, { count }) {
    this.worker = cluster.fork({ SHARD_ID: id })

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

module.exports = Shard
