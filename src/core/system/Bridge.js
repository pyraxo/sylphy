class Bridge {
  constructor (manager) {
    this.manager = manager
    this.tasks = []
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

  destroy () {
    this.tasks.length = 0
  }

  handle (container, idx = 0) {
    return new Promise((resolve, reject) => {
      if (idx === this.tasks.length) {
        try {
          this.manager.execute(container.trigger, container)
        } catch (err) {
          return reject(err)
        }
        return resolve(container)
      }
      this.tasks[idx++](
        container,
        container => this.handle(container, idx).catch(reject),
        reject
      )
    })
  }
}

module.exports = Bridge
