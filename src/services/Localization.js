import jsonfile from 'jsonfile'
import moment from 'moment'
import _ from 'lodash'

const definedTags = {
  '%datetime%': (msg, locale) => {
    return moment()
  },
  '%server_name%': msg => {
    return msg.channel.guild.name
  },
  '%channel_name%': msg => {
    return msg.channel.name
  }
}

class Localization {
  constructor (localeFile) {
    if (localeFile === null) {
      throw new Error('Locale file not found')
    }
    if (localeFile.indexOf('.json') === -1) localeFile += '.json'
    this.localeFile = localeFile

    // default locale
    moment.locale('en')
  }

  init () {
    jsonfile.readFile(this.localeFile, (err, data) => {
      if (err) throw new Error(`Locale file ${this.localeFile} could not be loaded: ${err}`)
      this.strings = data
    })
  }

  get (key, locale) {
    if (!this.strings) return ''

    let val = this.getLocale(key, locale)
    if (val) return this.strings[val][key]
  }

  getLocale (key, locale) {
    if (!this.strings) return ''
    if (_.has(this.strings, [locale, key].join('.'))) return locale
    else if (_.has(this.strings, ['default', key].join('.'))) return 'default'
    return null
  }

  shift (key, locale, options, msg) {
    if (!this.strings) return ''
    let o = this.get(key, locale)

    if (options) {
      for (let tag in options) {
        if (o.indexOf(tag) > -1) o = _.replace(o, `%${tag}%`, options[tag])
      }
    }

    if (msg) {
      for (let tag in definedTags) {
        o = _.replace(o, `%${tag}%`, definedTags[tag](msg, locale))
      }
    }

    return o
  }

  count (locale, partialKey) {
    if (!this.strings) return 0
    if (this.strings.hasOwnProperty(locale)) {
      if (!partialKey) return _.size(this.strings[locale])

      return _.reduce(this.strings[locale], (sum, val) => {
        if (val.indexOf(partialKey) > -1) return sum + val
        return sum
      }, 0)
    }
    return 0
  }
}

module.exports = Localization
