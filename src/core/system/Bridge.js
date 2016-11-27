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

  collect (options) {
    const { tries = 10, time = 60, matches = 10, channel, author, filter } = options
    let collector = {
      collected: [],
      _tries: 0,
      _matches: 0,
      _listening: false,
      _ended: false
    }
    if (time) {
      setTimeout(() => {
        collector._ended = { reason: 'timeout', arg: time, collected: collector.collected }
      }, time * 1000)
    }
    collector.stop = () => {
      collector._listening = false
      this.collectors.splice(this.collectors.indexOf(collector), 1)
    }
    collector.next = () => {
      return new Promise((resolve, reject) => {
        collector._resolve = resolve
        if (collector._ended) {
          collector.stop()
          reject(collector._ended)
        }
        collector._listening = true
      })
    }
    collector.passMessage = msg => {
      if (!collector._listening) return false
      if (author && author !== msg.author.id) return false
      if (channel && channel !== msg.channel.id) return false
      if (typeof filter === 'function' && !filter(msg)) return false

      collector.collected.push(msg)
      if (collector.collected.size >= (matches || Infinity)) {
        collector._ended = { reason: 'maxMatches', arg: matches }
      } else if (tries && collector.collected.size === (tries || Infinity)) {
        collector._ended = { reason: 'max', arg: tries }
      }
      collector._resolve(msg)
      return true
    }
    this.collectors.push(collector)
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
