const chalk = require('chalk')
const logger = require('winston')
const { Module } = require('../core')

class Reactions extends Module {
  constructor (...args) {
    super(...args, {
      name: 'Reactions',
      events: {
        messageReactionAdd: 'checkReactions'
      }
    })
  }

  checkReactions () {

  }
}

module.exports = Reactions
