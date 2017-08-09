const path = require('path')
const fs = require('fs')

const { requireAll, isDir, Collection } = require('../util')

/** Locale manager and string parser */
class Interpreter extends Collection {
  /**
   * Creates a new Localisations instance
   * @arg {Client} Client instance
   */
  constructor (client) {
    super()
    this._client = client
    this._cached = []
  }

  /**
   * Registers a string table for a locale
   * @arg {String|Object|Array} strings An object, array or relative path to a folder or file to load strings from
   * @arg {String} [locale] The name of the locale. If none is supplied, `strings` will be treated as an object mapping locale names to string tables
   */
  register (strings, loc) {
    switch (typeof strings) {
      case 'string': {
        const filepath = path.isAbsolute(strings) ? strings : path.join(process.cwd(), strings)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        this._cached.push(strings)
        const stringMap = isDir(filepath) ? requireAll(filepath) : require(filepath)
        return this.register(stringMap)
      }
      case 'object': {
        if (Array.isArray(strings)) {
          for (const pair of strings) {
            if (typeof pair[0] !== 'string') continue
            this.set(pair[0], Object.assign(this.get(pair[0]) || {}, pair[1]))
          }
          return this
        }
        if (!loc) {
          for (const lang in strings) {
            this.set(lang, Object.assign(this.get(lang) || {}, strings[lang]))
          }
        } else {
          this.set(loc, Object.assign(this.get(loc) || {}, strings))
        }
        return this
      }
      default: {
        throw new Error('Path supplied is not an object or string')
      }
    }
  }

  /**
   * Reloads locale files (only those that have been added from by file path)
   * @returns {Client}
   */
  reload () {
    for (const filepath of this._cached) {
      this._client.unload(filepath)
      this._cached.shift()
      this.register(filepath)
    }
    return this
  }

  /**
   * Locate a nested key within an object
   * @arg {String} key The key to find
   * @arg {Object} obj The object to search from
   * @returns {?String}
   */
  locate (fullkey, obj) {
    let keys = fullkey.split('.')
    let val = obj[keys.shift()]
    if (!val) return null
    for (let key of keys) {
      if (!val[key]) return val
      val = val[key]
      if (Array.isArray(val)) return val.join('\n')
    }
    return val || null
  }

  /**
   * Gets strings under a group key from a locale
   * @arg {String} [key='common'] The string group to find
   * @arg {String} [locale='en'] The locale to find
   * @returns {?String}
   */
  getStrings (key = 'common', locale = 'en') {
    if (!this.has(locale)) locale = 'en'
    return this.locate(key, this.get(locale))
  }

  /**
   * Parses a string and interpolating tags from a supplied object
   * @arg {String} string String to do interpolation
   * @arg {Object} options Object containing tags to interpolate into the string
   * @returns {String}
   */
  shift (string, options) {
    if (!string) return string
    return string.split(' ').map(str => (
      str.replace(/\{\{(.+)\}\}/gi, (matched, key) => (
        this.locate(key, options) || matched
      ))
    )).join(' ')
  }

  /**
   * Parses a string, converting keys to the matching locale string, with interpolation
   * @arg {String} string The string to parse
   * @arg {String} [group='default'] The string group to use
   * @arg {String} [locale='en'] The locale to use
   * @arg {Object} [options] Object containing tags to interpolate into the string
   * @returns {String}
   */
  parse (string, group = 'default', locale = 'en', options = {}) {
    if (!string) return string
    return String(string).split(' ').map(str => (
      str.replace(/\{\{(.+)\}\}/gi, (matched, key) => {
        const g = key.startsWith('%') ? 'default.' : group + '.'
        key = key.startsWith('%') ? key.substr(1) : key
        let val = this.getStrings(`${g}${key}`, locale)
        return typeof val === 'string' ? this.shift(val, options) : matched
      })
    )).join(' ')
  }
}

module.exports = Interpreter
