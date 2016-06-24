import _ from 'lodash'

import BaseCommand from '../../Base/BaseCommand'

class Choose extends BaseCommand {
  get name () {
    return 'choose'
  }

  get description () {
    return 'Makes a choice for you'
  }

  get usage () {
    return '<option 1>, <option 2>, [options...]'
  }

  get gif () {
    return 'choosehelp.gif'
  }

  handle (args) {
    args = args.join(' ').split(', ')
    if (args.length < 2) {
      this.wrongUsage()
      return
    }
    this.reply(`🤔  |  **${this.message.author.username}**, I pick **${_.sample(args)}**!`)
  }
}

module.exports = Choose
