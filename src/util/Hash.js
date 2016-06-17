import redis from 'redis'

class Hash {
  constructor (options) {
    this.client = redis.createClient(options)
  }

  set (key, field, value) {
    return new Promise((resolve, reject) => {
      if (typeof value === 'object') value = JSON.stringify(value)
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
        return resolve(JSON.parse(res))
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
