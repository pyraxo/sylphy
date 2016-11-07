const fs = require('fs')
const path = require('path')
const logger = require('winston')

const Collection = require('./Collection')

class Localisation {
  constructor (filepath, wrapper = '%') {
    if (typeof filepath !== 'string') throw new TypeError('Invalid locale filepath')
    this._file = filepath

    this._leftWrapper = wrapper[0]
    this._rightWrapper = wrapper[1] || wrapper[0]
  }

  async init () {
    try {
      const data = await fs.readFile(this._file)
      this.strings = new Collection().load(data)
    } catch (err) {
      logger.error(`Locale file ${path.basename(this._file)} could not be loaded - ${err}`)
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
        if (str.indexOf(tag) > -1) {
          str = str.replace(new RegExp(
            `${this._leftWrapper}${tag}${this._rightWrapper}`, 'g'
          ), options[tag])
        }
      }
    }
    return str
  }
}

module.exports = Localisation
