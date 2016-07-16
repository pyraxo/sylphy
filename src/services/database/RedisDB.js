import redis from 'redis'

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
    this.client.on('error', err => { throw err })
  }

  /**
   * Sets a key-value pair
   *
   * @arg {String} key
   * @arg {(String|Number)} field
   * @returns {Promise.<Number>}
   */
  set (key, value) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  /**
   * Checks if a key-value pair exists
   *
   * @arg {String} key
   * @returns {Promise.<?Boolean>}
   */
  exists (key) {
    return new Promise((resolve, reject) => {
      this.client.exists(key, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  /**
   * Sets a field-value pair in a hash
   *
   * @arg {String} key The key of the hash
   * @arg {String} field The field of the field-value pair
   * @arg {(String|Number)} value The value of the field
   * @returns {Promise.<Number>}
   */
  hset (key, field, value) {
    return new Promise((resolve, reject) => {
      this.client.hset(key, field, value, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  /**
   * Increments a value of a field in a hash
   *
   * @arg {String} key The key of the hash
   * @arg {String} field The field of the field-value pair
   * @arg {String|Number} value The number you want to increment by
   * @returns {Promise.<Number>}
   */
  hincrby (key, field, value) {
    return new Promise((resolve, reject) => {
      this.client.hincrby(key, field, value, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  /**
   * Gets the value of a field in a hash
   *
   * @arg {String} key
   * @arg {String} field
   * @returns {Promise.<?(String|Number)>}
   */
  hget (key, field) {
    return new Promise((resolve, reject) => {
      this.client.hget(key, field, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  /**
   * Checks if a field exists in a hash
   *
   * @arg {String} key
   * @arg {String} field
   * @returns {Promise.<?Boolean>}
   */
  hexists (key, field) {
    return new Promise((resolve, reject) => {
      this.client.hexists(key, field, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  /**
   * Removes a field from a hash
   *
   * @arg {String} key
   * @arg {String} field
   * @returns {Promise.<Number>}
   */
  hdel (key, field) {
    return new Promise((resolve, reject) => {
      this.client.hdel(key, field, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  /**
   * Gets all fields of a hash key
   *
   * @arg {String} key
   * @returns {Promise.<?(String|Number)>}
   */
  hkeys (key) {
    return new Promise((resolve, reject) => {
      this.client.hkeys(key, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  /**
   * Expires a key
   *
   * @arg {String} key
   * @arg {Number} value The time till expiry
   * @returns {Promise.<Number>}
   */
  expire (key, value) {
    return new Promise((resolve, reject) => {
      this.client.expire(key, value, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  /**
   * Gets the TTL of a key
   *
   * @arg {String} key
   * @returns {Promise.<Number>}
   */
  ttl (key) {
    return new Promise((resolve, reject) => {
      this.client.ttl(key, (err, res) => {
        if (err) return reject(err)
        return resolve(res)
      })
    })
  }

  /**
   * Returns the multi object
   *
   * @returns {Redis.Client.multi}
   */
  multi () {
    return this.client.multi()
  }
}

module.exports = RedisDB
