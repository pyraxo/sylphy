import redis from 'redis'

class RedisDB {
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

  set (key, field) {
    return new Promise((resolve, reject) => {
      this.client.set(key, field, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  hset (key, field, value) {
    return new Promise((resolve, reject) => {
      this.client.hset(key, field, value, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  hincrby (key, field, value) {
    return new Promise((resolve, reject) => {
      this.client.hincrby(key, field, value, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  hget (key, field) {
    return new Promise((resolve, reject) => {
      this.client.hget(key, field, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  hexists (key, field) {
    return new Promise((resolve, reject) => {
      this.client.hexists(key, field, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  hdel (key, field) {
    return new Promise((resolve, reject) => {
      this.client.hdel(key, field, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  hkeys (key) {
    return new Promise((resolve, reject) => {
      this.client.hkeys(key, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  expire (key, value) {
    return new Promise((resolve, reject) => {
      this.client.expire(key, value, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  ttl (key) {
    return new Promise((resolve, reject) => {
      this.client.ttl(key, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  multi () {
    return this.client.multi()
  }
}

module.exports = RedisDB
