const chalk = require('chalk')
const logger = require('winston')
const { Module } = require('../core')

class Guildmaster extends Module {
  constructor (...args) {
    super(...args, {
      name: 'guilds',
      events: {
        guildCreate: 'newGuild'
      }
    })
  }

  newGuild (guild) {
    logger.info(`New guild added: ${guild.name} (${guild.id})`)
    logger.info(`${chalk.cyan.bold('U:')} ${guild.members.size} | ${chalk.cyan.bold('S:')} ${guild.shard.id}`)
  }
}

module.exports = Guildmaster
