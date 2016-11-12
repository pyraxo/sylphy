const logger = require('winston')
const moment = require('moment')
const Collection = require('./Collection')

class LocalCache extends Collection {
  constructor (model, ttl = 3600 * 1000) {
    super()

    this.ttl = ttl
    this.model = model
    this.timers = new Collection()

    if (model) {
      model.changes().then(feed => {
        feed.each((err, doc) => {
          if (err) return logger.error(err)
          if (doc.isSaved() === false) {
            this.delete(doc.id)
          } else {
            this.store(doc.id, doc)
          }
        })
      }).error(logger.error)
    }
  }

  async fetch (key) {
    let value = this.get(key)
    if (typeof value === 'undefined' && this.model) {
      value = await this.model.get(key).run()
      this.store(key, value)
    }
    return value
  }

  async update (key, newValue) {
    let oldValue = await this.fetch(key)
    this.store(key, newValue)
    return oldValue
  }

  clear (key) {
    this.delete(key)
    this.clearTimer(key)
  }

  store (key, value) {
    this.set(key, value)
    this.refresh(key)
  }

  ttl (key) {
    return this.timers.get(key).expiry - +moment()
  }

  clearTimer (key) {
    if (!this.timers.has(key)) return
    const timer = this.timers.get(key)
    clearTimeout(timer.timer)
  }

  refresh (key) {
    this.clearTimer(key)
    const timer = setTimeout(() => this.clear(key), this.ttl)
    this.timers.set(key, { timer, expiry: +moment() + this.ttl })
  }

  persist (key) {
    this.clearTimer(key)
    let ttl = this.ttl(key)
    this.timers.delete(key)
    return ttl
  }
}

module.exports = LocalCache
