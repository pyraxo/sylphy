const requireAll = require('require-all')
const logger = require('winston')

const Collection = require('./Collection')

class Localisation {
  constructor (folderpath, wrapper = ['{{', '}}']) {
    if (typeof folderpath !== 'string') throw new TypeError('Invalid locale filepath')
    this._folder = folderpath

    this._leftWrapper = wrapper[0]
    this._rightWrapper = wrapper[1] || wrapper[0]
  }

  init () {
    try {
      const data = requireAll(this._folder)
      this.strings = new Collection().load(data)
    } catch (err) {
      logger.error(`Error loading ${this._folder} locale - ${err}`)
    }
  }

  get (key, locale = 'default') {
    if (!this.strings.has(locale)) {
      locale = 'default'
    }
    return this.strings.get(locale)[key] || null
  }

  shift (key, locale, options = {}) {
    let str = this.get(key, locale)
    if (str === null) return str
    if (Object.keys(options).length > 0) {
      for (let tag in options) {
        let val = options[tag]
        const parsed = tag.split('.').slice(1)
        if (parsed.length) {
          for (let prop of parsed) {
            if (typeof val[prop] === 'undefined') return
            val = val[prop]
          }
        }
        if (str.indexOf(tag) > -1) {
          str = str.replace(new RegExp(
            `${this._leftWrapper}${tag}${this._rightWrapper}`, 'g'
          ), val)
        }
      }
    }
    return str
  }

  parse (string, locale, options = {}) {
    return string.split(' ').map(str => {
      const lw = this._leftWrapper
      const rw = this._rightWrapper
      if (!str.startsWith(lw) || !str.endsWith(rw)) return str
      let key = str.substr(lw.length, str.length - rw.length - lw.length)
      return this.shift(key, locale, options)
    }).join(' ')
  }
}

module.exports = Localisation
