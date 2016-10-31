class Collection extends Map {
  load (obj, overwrite = true) {
    for (let k of Object.keys(obj)) {
      if (this.has(k) && !overwrite) continue
      this.set(k, obj[k])
    }
    return this
  }

  toArray () {
    return [...this.values()]
  }

  forEach (...args) {
    return this.toArray().forEach(...args)
  }

  filter (...args) {
    return this.toArray().filter(...args)
  }

  find (...args) {
    return this.toArray().find(...args)
  }

  map (...args) {
    return this.toArray().map(...args)
  }

  reduce (...args) {
    return this.toArray().reduce(...args)
  }

  pluck (key) {
    return this.toArray().reduce((i, o) => {
      if (!o[key]) return i
      i.push(o[key])
      return i
    }, [])
  }

  groupBy (key) {
    return this.toArray().reduce((i, o) => {
      let val = o[key]
      i[val] = i[val] || []
      i[val].push(o)
      return i
    }, {})
  }

  unique () {
    return [...new Set(this.toArray())]
  }
}

module.exports = Collection
