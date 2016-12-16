const requireAll = require('require-all')
const Collection = require('./Collection')

class Locales {
  constructor (folderpath) {
    if (typeof folderpath !== 'string') throw new TypeError('Invalid locale filepath')
    this._folder = folderpath

    this.reload()
  }

  reload () {
    Object.keys(require.cache).forEach(filepath => {
      if (!filepath.startsWith(this._folder)) return
      delete require.cache[require.resolve(filepath)]
    })
    const data = requireAll(this._folder)
    this.strings = new Collection().load(data)
  }

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
        const g = key.startsWith('%') ? 'common.' : group + '.'
        key = key.startsWith('%') ? key.substr(1) : key
        let val = this.get(`${g}${key}`, locale)
        return typeof val === 'string' ? this.shift(val, options) : matched
      })
    )).join(' ')
  }
}

module.exports = Locales
