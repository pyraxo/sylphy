import path from 'path'
import request from 'superagent'
import fs from 'fs'
import _ from 'lodash'

import Logger from './Logger'

const logger = new Logger('CARBON', 'bgCyan')

class IPC {
  constructor (shards) {
    this.locks = {}
    this.shards = shards
    this.count = 0
    this.prepareCarbon()
  }

  prepareCarbon () {
    fs.readFile(path.join(process.cwd(), 'config/carbon.txt'), (err, data) => {
      if (err) {
        logger.log('No carbon key found')
        return
      }
      this.key = data
    })
  }

  store (guilds, shard) {
    if (this.shards - shard < 1) {
      logger.error(new Error('Mismatching shard counts'))
      return
    }
    this.locks[shard] = guilds
    this.count += guilds.length
    for (let i = 0; i < this.shards; i++) {
      if (typeof this.locks[i] === 'undefined') return
    }
    logger.log(`Total guild count: ${this.count}`)
    this.sendData()
  }

  add (shard, guild) {
    this.locks[shard].push(guild.id)
    this.count++
  }

  remove (shard, guild) {
    _.pull(this.locks[shard], guild.id)
    this.count--
  }

  sendData () {
    if (!this.key) return
    request
    .post('https://www.carbonitex.net/discord/data/botdata.php')
    .type('json')
    .send({ key: this.key, guildcount: this.count })
    .end((err, res) => {
      if (err) {
        logger.error(`Error updating Carbon statistics: ${err}`)
        return
      }
      if (res.statusCode !== 200) {
        logger.error(`Error updating Carbon statistics: Code ${res.statusCode}`)
        return
      }
      logger.debug(`Updated guild count - ${this.count}`)
    })

    setInterval(() => this.sendData(), 3600000)
  }
}

module.exports = IPC
