class Collection extends Map {
  toArray () {
    return [...this.values()]
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
}

module.exports = Collection
