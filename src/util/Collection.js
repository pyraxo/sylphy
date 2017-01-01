/**
 * An extended map with utility functions
 * @extends Map
 */
class Collection extends Map {
  /**
   * Returns all items in the collection as an array
   * @returns {Array} Array of values
   */
  toArray () {
    return [...this.values()]
  }

  /**
   * Executes a function on all values
   * @arg {function} func forEach function
   */
  forEach (...args) {
    return this.toArray().forEach(...args)
  }

  /**
   * Filter values by function
   * @arg {function} func filter function
   * @returns {Array} Array of filtered values
   */
  filter (...args) {
    return this.toArray().filter(...args)
  }

  /**
   * Find values by function
   * @arg {function} func find function
   * @returns {*} Value that was found
   */
  find (...args) {
    return this.toArray().find(...args)
  }

  /**
   * Map values by function
   * @arg {function} func map function
   * @returns {Array} Array of mapped values
   */
  map (...args) {
    return this.toArray().map(...args)
  }

  /**
   * Reduce values by function
   * @arg {function} func reduce function
   * @returns {Array} Array of reduced values
   */
  reduce (...args) {
    return this.toArray().reduce(...args)
  }

  /**
   * Pluck values with key by function
   * @arg {String} key The matching key
   * @returns {Array} Array of keyed values
   */
  pluck (key) {
    return this.toArray().reduce((i, o) => {
      if (!o[key]) return i
      i.push(o[key])
      return i
    }, [])
  }

  /**
   * Group values by key
   * @arg {String} key The matching key
   * @returns {Object} Object containing grouped values
   */
  groupBy (key) {
    return this.toArray().reduce((i, o) => {
      let val = o[key]
      i[val] = i[val] || []
      i[val].push(o)
      return i
    }, {})
  }

  /**
   * Get unique values
   * @returns {Array} unique Array of unique values
   */
  unique () {
    return [...new Set(this.toArray())]
  }
}

module.exports = Collection
