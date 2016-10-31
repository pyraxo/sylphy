const winston = require('winston')
const redis = require('redis')

const bluebird = require('bluebird')
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

class Database {
  constructor (opts) {
    for (let key in opts) {
      this.create(key, opts[key])
    }
  }

  create (name, opts = {}) {
    opts.retryStrategy = function (opt) {
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
    let client = redis.createClient(opts)
    client.on('ready', () => `Redis DB ${name} is ready`)
    client.on('error', err => winston.error(err))
    client.on('end', () => `Redis DB ${name} has closed its connection`)
    this[`${name}DB`] = client
  }

  remove (name) {
    delete this[`${name}DB`]
  }
}

const opts = {}
for (const key in process.env) {
  if (!key.startsWith('DB_')) continue
  if (!process.env[key]) winston.warn(`${key} has no specified port`)
  const [port, db] = process.env[key].split(':')
  opts[key.replace('DB_', '').toLowerCase()] = { port: port || 6379, db: db || 0 }
}

module.exports = new Database(opts)
