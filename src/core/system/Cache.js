const winston = require('winston')
const redis = require('redis')
const EventEmitter = require('eventemitter3')

const bluebird = require('bluebird')
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

class Cache extends EventEmitter {
  constructor (opts) {
    super()
    this.init(opts)
  }

  init (opts = {}) {
    let options = {
      host: opts.host || process.env.REDIS_HOST,
      port: opts.port || process.env.REDIS_PORT || 6379,
      db: opts.db || 0,
      retryStrategy: function (opt) {
        if (opt.error.code === 'ECONNREFUSED') {
          return new Error('The server refused the connection')
        }
        if (opt.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted')
        }
        if (opt.times_connected > 10) {
          return undefined
        }
        return Math.max(opts.attempt * 100, 3000)
      }
    }

    let pass = opts.password || process.env.REDIS_PASS
    if (pass) {
      options.password = pass
    }

    let client = this.client = redis.createClient(options)

    client.on('ready', () => this.emit('ready'))
    client.on('error', err => winston.error(`Cache met with an error: ${err}`))
    client.on('end', () => this.emit('end'))
  }

  async unwrapValues (key, hash) {
    let multi = this.client.multi()
    for (let field in hash) {
      if (!hash.hasOwnProperty(field)) continue
      multi.hset(key, field, hash[field])
    }
    try {
      let res = await multi.execAsync()
      return res
    } catch (err) {
      throw err
    }
  }

  async unwrapScores (key, hash) {
    let multi = this.client.multi()
    for (let field in hash) {
      if (typeof hash[field] !== 'number') continue
      multi.zadd(key, hash[field], field)
    }
    try {
      let res = await multi.execAsync()
      return res
    } catch (err) {
      throw err
    }
  }
}
module.exports = Cache
