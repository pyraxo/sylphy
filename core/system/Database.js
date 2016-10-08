const winston = require('winston')
const RedisDB = require('../util/RedisDB')

const Database = function (opts) {
  for (let key in opts) {
    this.create(key, opts[key])
  }
}

Database.prototype.create = function (name, opts) {
  this[`${name}DB`] = new RedisDB(opts)
}

Database.prototype.remove = function (name) {
  delete this[`${name}DB`]
}

const opts = {}
for (const key in process.env) {
  if (!key.startsWith('DB_')) continue
  if (!process.env[key]) winston.warn(`${key} has no specified port`)
  opts[key.replace('DB_', '').toLowerCase()] = { port: process.env[key] }
}

module.exports = new Database(opts)
