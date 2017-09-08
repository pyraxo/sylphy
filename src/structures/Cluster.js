let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const child = require('child_process')

/**
 * Shard cluster structure
 * @prop {ChildProcess} worker The child process being handled
 */
class Cluster {
  /**
   * Creates a new Cluster instance
   * @arg {String} file Path to file to run
   * @arg {Number} id ID of the cluster
   */
  constructor (file, id) {
    this.worker = child.fork(file, { env: Object.assign(process.env, { PROCESS_ID: id }) })
    this.id = id
  }

  /**
   * Awaits for a certain response
   * @arg {String} message Message to send
   * @returns {Promise<Object>}
   */
  awaitResponse (message) {
    return new Promise((resolve, reject) => {
      const awaitListener = (msg) => {
        if (!['resp', 'error'].includes(msg.op)) return
        return resolve({ id: this.id, result: msg.d, code: msg.code })
      }

      this.worker.once('message', awaitListener)
      this.worker.send(message)

      setTimeout(() => {
        this.worker.removeListener('message', awaitListener)
        return reject('IPC request timed out after 5000ms')
      }, 5000)
    })
  }
}

module.exports = Cluster
