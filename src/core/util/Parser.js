const moment = require('moment')

const Collection = require('./Collection')

class Parser {
  constructor (definedTags = {
    'datetime': () => moment(),
    'server': msg => msg.guild.name,
    'channel': msg => msg.channel.name,
    'author': msg => msg.author.username
  }, wrapper = '$') {
    this.tags = new Collection().load(definedTags)

    if (Array.isArray(wrapper)) {
      this.wrapperL = wrapper[0]
      this.wrapperR = wrapper[1]
    } else {
      this.wrapperL = this.wrapperR = wrapper
    }
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
        new RegExp(`${this.wrapperL}${tag}${this.wrapperR}`, 'g'),
        this.definedTags[tag](...args)
      )
    }
    return s
  }
}

module.exports = Parser
