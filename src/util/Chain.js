class Chain extends Array {
  setEndpoint (func) {
    if (typeof func !== 'function') {
      throw new Error('Endpoint must be a function')
    }
    this._endpoint = func
  }

  handle (container, cb) {
    this._nextTask(container, 0, cb)
  }

  destroy () {
    this.length = 0
  }

  _nextTask (container, idx, cb) {
    if (idx === this.length) {
      if (this.hasOwnProperty('_endpoint')) this._endpoint(container)
      return cb(null, container)
    }
    this[idx++](container, this._taskCallback(idx, cb))
  }

  _taskCallback (idx, cb) {
    return (err, container) => {
      if (err) return cb(err)
      this._nextTask(container, idx, cb)
    }
  }
}

module.exports = Chain
