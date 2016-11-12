const MessageCollector = require('../util/MessageCollector')

class Bridge {
  constructor (manager) {
    this.manager = manager
    this.tasks = []
    this.collectors = []
  }

  push (middleware) {
    if (!middleware.hasOwnProperty('process')) {
      throw new Error('Middleware must contain the process method')
    }
    if (typeof middleware.process !== 'function') {
      throw new Error('Middleware process must be a function')
    }
    this.tasks.push(middleware.process)
  }

  collect (channel, filter, { tries = 10, time = 60, matches = 10 }) {
    let collector = new MessageCollector(channel, filter, { maxMatches: matches, max: tries, time })
    this.collectors.push(collector)
    collector.on('end', col => this.collectors.splice(this.collectors.indexOf(col), 1))
    return collector
  }

  destroy () {
    this.tasks.length = 0
  }

  handle (container, idx = 0) {
    const { msg } = container
    return new Promise((resolve, reject) => {
      for (let collector of this.collectors) {
        let res = collector.passMessage(msg)
        if (res) return
      }
      if (idx === this.tasks.length) {
        try {
          this.manager.execute(container.trigger, container)
        } catch (err) {
          return reject(err)
        }
        return resolve(container)
      }
      this.tasks[idx++](container).then(c => {
        if (!c) return reject()
        return this.handle(c, idx).then(resolve).catch(reject)
      }).catch(reject)
    })
  }
}

module.exports = Bridge
