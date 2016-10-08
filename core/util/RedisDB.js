const redis = require('redis')
const logger = require('winston')

/**
 * Represents a RedisDB instance
 *
 * @prop {Client} client A {@link https://github.com/NodeRedis/node_redis Redis} client
 */
class RedisDB {
  /**
   * Creates a new RedisDB instance connecting to a Redis server
   *
   * @arg {Object} options Options required to connect to an existing Redis server
   * @returns {RedisDB} A RedisDB instance
   */
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
    this.client.on('error', err => logger.error(err))

    this.applyMethods([
      'set', 'get', 'exists', 'keys', 'del',
      'hset', 'hget', 'hexists', 'hkeys', 'hincrby', 'hdel', 'hgetall', 'hlen', 'hvals',
      'expire', 'ttl',
      'sismember', 'sadd', 'srem', 'smembers', 'scard',
      'zrevrange', 'zrevrank', 'zrem', 'zincrby', 'zscore'
    ])
  }

  applyMethods (methods) {
    for (let method of methods) {
      this[method] = (...params) => {
        return new Promise((resolve, reject) => {
          this.client[method](params, (err, res) => {
            if (err) return reject(err)
            return resolve(res)
          })
        })
      }
    }
  }

  multi () {
    return this.client.multi()
  }
}

module.exports = RedisDB
