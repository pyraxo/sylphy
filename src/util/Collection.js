/**
 * An extended map with utility functions.
 * @extends Map
 */
class Collection extends Map {
  /**
   * Returns all items in the collection as an array.
   * @returns {Array} Array of values
   */
  toArray () {
    return [...this.values()]
  }

  /**
   * Executes a function on all values.
   * @arg {Function} func - forEach function
   */
  forEach (func) {
    return this.toArray().forEach(func)
  }

  /**
   * Filter values by function.
   * @arg {Function} func - filter function
   * @returns {Array} Array of filtered values
   */
  filter (func) {
    return this.toArray().filter(func)
  }

  /**
   * Find values by function.
   * @arg {Function} func - find function
   * @returns {*} Value that was found
   */
  find (func) {
    return this.toArray().find(func)
  }

  /**
   * Map values by function.
   * @arg {Function} func - map function
   * @returns {Array} Array of mapped values
   */
  map (func) {
    return this.toArray().map(func)
  }

  /**
   * Reduce values by function.
   * @arg {Function} func - reduce function
   * @returns {Array} Array of reduced values
   */
  reduce (func) {
    return this.toArray().reduce(func)
  }

  /**
   * Pluck values with key by function.
   * @arg {string} key - The matching key
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
   * Group values by key.
   * @arg {string} key - The matching key
   * @returns {Object} Object containing grouped values
   */
  groupBy (key) {
    return this.toArray().reduce((obj, val) => (
      Object.assign({}, obj, {
        [val[key]]: (val[key] || []).concat([val])
      })
    ))
  }

  /**
   * Get unique values.
   * @returns {Array} Array of unique values
   */
  unique () {
    return [...new Set(this.toArray())]
  }
}

module.exports = Collection
