import path from 'path'
import request from 'superagent'
import fs from 'fs'

import Logger from './Logger'

const logger = new Logger('CARBON', 'bgCyan')

class Carbonitex {
  constructor (shards) {
    fs.readFile(path.join(process.cwd(), 'config/carbon.txt'), (err, data) => {
      if (err) {
        logger.log('No carbon key found')
        return
      }
      this.key = data
    })
    this.count = 0
    this.locks = {}
    for (let i = 0; i < shards; i++) {
      this.locks[i] = false
    }
  }

  incr (count, shard) {
    if (this.locks[shard] === true) {
      logger.error(`Shard ${shard} data already stored`)
      return
    }
    if (typeof this.locks[shard] !== 'boolean') {
      logger.error(new Error('Mismatching shard counts'))
      return
    }
    this.count += count
    this.locks[shard] = true
    for (let lock in this.locks) {
      if (this.locks[lock] === false) return
    }
    logger.log(`Total server count: ${this.count}`)
    this.sendData()
  }

  sendData () {
    if (!this.key) return
    request
    .post('https://www.carbonitex.net/discord/data/botdata.php')
    .type('json')
    .send({ key: this.key, servercount: this.count })
    .end((err, res) => {
      if (err) {
        logger.error(`Error updating Carbon statistics: ${err}`)
        return
      }
      if (res.statusCode !== 200) {
        logger.error(`Error updating Carbon statistics: Code ${res.statusCode}`)
        return
      }
      logger.debug(`Updated server count - ${this.count}`)
    })

    setInterval(() => this.sendData(), 3600000)
  }
}

module.exports = Carbonitex
