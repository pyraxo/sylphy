const moment = require('moment')

const Collection = require('./Collection')

class Parser {
  constructor (tags = {
    'datetime': () => moment(),
    'server': msg => msg.guild.name,
    'channel': msg => msg.channel.name,
    'author': msg => msg.author.username
  }, wrapper = '$') {
    this.tags = new Collection().load(tags)

    this._leftWrapper = wrapper[0]
    this._rightWrapper = wrapper[1] || wrapper[0]
  }

  define (tag, func) {
    this.tags[tag] = func
  }

  undefine (tag) {
    delete this.tags[tag]
  }

  replace (str, ...args) {
    let s = str
    for (let tag in this.definedTags) {
      s = s.replace(new RegExp(
        `${this._leftWrapper}${tag}${this._rightWrapper}`, 'g'
      ), this.tags[tag](...args))
    }
    return s
  }
}

module.exports = Parser
