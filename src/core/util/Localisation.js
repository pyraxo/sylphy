const path = require('path')
const jsonfile = require('jsonfile')
const moment = require('moment')
const logger = require('winston')

const Collection = require('./Collection')

class Localisation {
  constructor (localeFile = 'defaults', wrapper = '%') {
    moment.locale('en')
    if (typeof localeFile !== 'string') throw new Error('Locale file name is not a string')
    if (localeFile.indexOf('.json') === -1) localeFile += '.json'
    this.localeFile = localeFile

    if (Array.isArray(wrapper)) {
      this.wrapperL = wrapper[0]
      this.wrapperR = wrapper[1]
    } else {
      this.wrapperL = this.wrapperR = wrapper
    }
  }

  init () {
    try {
      const data = jsonfile.readFileSync(path.join(process.cwd(), 'strings', this.localeFile))
      this.strings = new Collection().load(data)
    } catch (err) {
      logger.error(`Locale file ${path.basename(this.localeFile)} could not be loaded - ${err}`)
    }
  }

  get (key, locale = 'default') {
    if (!this.strings.has(locale)) locale = 'default'
    return this.strings.get(locale)[key] || null
  }

  shift (key, locale, options = {}) {
    let str = this.get(key, locale)
    if (str === null) return str
    if (Object.keys(options).length > 0) {
      for (let tag in options) {
        if (str.indexOf(tag) > -1) str = str.replace(new RegExp(`${this.wrapperL}${tag}${this.wrapperR}`, 'g'), options[tag])
      }
    }
    return str
  }
}

module.exports = Localisation
