const requireAll = require('require-all')
const Collection = require('./Collection')

class Parser {
  constructor (folderpath) {
    this._folder = folderpath

    if (typeof this._folder === 'string') {
      this.reload()
    }
  }

  reload () {
    if (typeof this._folder !== 'string') {
      throw new TypeError('Invalid locale filepath')
    }
    Object.keys(require.cache).forEach(filepath => {
      if (!filepath.startsWith(this._folder)) return
      delete require.cache[require.resolve(filepath)]
    })
    const data = requireAll(this._folder)
    this.strings = new Collection().load(data)
  }

  locate (fullkey, obj) {
    const val = fullkey.split('.').reduce((o, i) => o === null ? o : o[i] || null, obj)
    return Array.isArray(val) ? val.join('\n') : val
  }

  get (key = 'common', locale = 'en') {
    if (!this.strings.has(locale)) locale = 'en'
    return this.locate(key, this.strings.get(locale))
  }

  shift (string, options) {
    if (!string) return string
    return string.split(' ').map(str => (
      str.replace(/\{\{(.+)\}\}/gi, (matched, key) => (
        this.locate(key, options) || matched
      ))
    )).join(' ')
  }

  parse (string, group = 'common', locale, options = {}) {
    if (!string) return string
    return string.split(' ').map(str => (
      str.replace(/\{\{(.+)\}\}/gi, (matched, key) => {
        const fullKey = key.startsWith('%') ? `common.${key.substr(1)}` : `${group}.${key}`
        let val = this.get(fullKey, locale) || this.get(`common.${key}`, locale)
        return typeof val === 'string' ? this.shift(val, options) : matched
      })
    )).join(' ')
  }
}

module.exports = Parser
