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
    this.wrapper = wrapper
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
        if (str.indexOf(tag) > -1) str = str.replace(new RegExp(`${this.wrapper}${tag}${this.wrapper}`, 'g'), options[tag])
      }
    }
    return str
  }
}

class Parser {
  constructor (definedTags = {
    'DATETIME': () => moment(),
    'SERVER': msg => msg.guild.name,
    'CHANNEL': msg => msg.channel.name,
    'AUTHOR': msg => msg.author.name
  }, wrapper = '$') {
    this.tags = new Collection().load(definedTags)
    this.wrapper = wrapper
  }

  setTag (tag, func) {
    this.definedTags[tag] = func
  }

  removeTag (tag) {
    delete this.definedTags[tag]
  }

  replace (str, ...args) {
    let s = str
    for (let tag in this.definedTags) {
      s = s.replace(
        new RegExp(`${this.wrapper}${tag}${this.wrapper}`, 'g'),
        this.definedTags[tag](...args)
      )
    }
    return s
  }
}

module.exports = { Localisation, Parser }
