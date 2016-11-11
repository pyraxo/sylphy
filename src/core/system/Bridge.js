class Bridge {
  constructor (manager) {
    this.manager = manager
    this.tasks = []
    this.bypass = {}
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

  collect (id, check, { tries = 10, timeout = 60, exit = 'exit' } = {}, failcheck, prompt) {
    return new Promise((resolve, reject) => {
      const rej = setTimeout(() => reject(new Error(`Timeout after ${timeout}s`)), parseInt(timeout, 10) * 1000)
      if (typeof check !== 'function') check = () => true
      let times = 0
      this.bypass[id] = {
        checkExit: (msg) => msg.content === exit,
        exit: (msg) => {
          reject()
          if (prompt && prompt.delete) prompt.delete()
          this._cleanup(id, rej, msg)
        },
        check,
        resolve: (msg) => {
          resolve(msg)
          if (prompt && prompt.delete) prompt.delete()
          this._cleanup(id, rej, msg)
        },
        reject: (msg) => {
          times++
          if (times >= tries) {
            reject(new Error(`Exceeded ${tries} incorrect tries`))
            this._cleanup(id, rej, msg)
            return
          }
          if (typeof failcheck === 'function') failcheck(times, tries)
        }
      }
    })
  }

  _cleanup (id, timer, msg) {
    delete this.bypass[id]
    clearTimeout(timer)
    msg.delete()
  }

  destroy () {
    this.tasks.length = 0
  }

  handle (container, idx = 0) {
    const { msg } = container
    const bypass = this.bypass[msg.channel.id + msg.author.id]
    return new Promise((resolve, reject) => {
      if (typeof bypass !== 'undefined') {
        if (bypass.checkExit(msg)) {
          bypass.exit(msg)
        } else {
          bypass[bypass.check(msg) ? 'resolve' : 'reject'](msg)
        }
        return resolve(container)
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
