import path from 'path'
import request from 'superagent'
import fs from 'fs'
import _ from 'lodash'

import Logger from './Logger'

const logger = new Logger('CARBON', 'bgCyan')

/**
 * Represents the IPC class
 *
 * @prop {Object} locks An object of all shards
 * @prop {Number} shards Total number of shards
 * @prop {Number} count Total number of guilds
 */
class IPC {
  /**
   * Creates an IPC instance
   *
   * @arg {Number} shards Total number of shards
   * @returns {IPC} An IPC instance
   */
  constructor (shards) {
    this.locks = new Map()
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

  /**
   * Stores the array of guild IDs of a shard in its initial state
   *
   * @arg {Array.<String>} guilds An array of guild IDs
   * @arg {Number} shard The shard ID
   */
  store (guilds, shard) {
    if (this.shards - shard < 1) {
      logger.error(new Error('Mismatching shard counts'))
      return
    }
    this.locks.set(shard, guilds)
    this.count += guilds.length
    for (let i = 0; i < this.shards; i++) {
      if (!this.locks.has(i)) return
    }
    logger.log(`Total guild count: ${this.count}`)
    this.sendData()
  }

  /**
   * Adds a new guild ID that was added to a shard to memory
   *
   * @arg {Number} shard The shard ID
   * @arg {String} guildID The guild ID
   */
  add (shard, guildID) {
    let arr = this.locks.get(shard)
    arr.push(guildID)
    this.locks.delete(shard)
    this.locks.set(shard, arr)
    this.count++
  }
  /**
   * Removes a new guild ID that was removed from a shard to memory
   *
   * @arg {Number} shard The shard ID
   * @arg {String} guildID The guild ID
   */
  remove (shard, guildID) {
    let arr = this.locks.get(shard)
    _.pull(arr, guildID)
    this.locks.delete(shard)
    this.locks.set(shard, arr)
    this.count--
  }

  /**
   * Starts a interval time that periodically sends data to the Carbonitex servers. The carbon key must exist.
   *
   */
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
