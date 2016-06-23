import redis from 'redis'

class Hash {
  constructor (options) {
    options = options || {}
    options.retryStrategy = function (opt) {
      if (opt.error.code === 'ECONNREFUSED') {
        return new Error('The server refused the connection')
      }
      if (opt.total_retry_time > 1000 * 60 * 60) {
        return new Error('Retry time exhausted')
      }
      if (opt.times_connected > 10) {
        return undefined
      }
      return Math.max(options.attempt * 100, 3000)
    }
    this.client = redis.createClient(options)
    this.client.on('error', err => { throw err })
  }

  set (key, field, value) {
    return new Promise((resolve, reject) => {
      this.client.hset(key, field, value, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  get (key, field) {
    return new Promise((resolve, reject) => {
      this.client.hget(key, field, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  has (key, field) {
    return new Promise((resolve, reject) => {
      this.client.hexists(key, field, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  del (key, field) {
    return new Promise((resolve, reject) => {
      this.client.hdel(key, field, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  getKeys (key) {
    return new Promise((resolve, reject) => {
      this.client.hkeys(key, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }
}

module.exports = Hash
