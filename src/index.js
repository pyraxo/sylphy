import os from 'os'
import cluster from 'cluster'

import Bot from './services/Bot'
import Logger from './services/Logger'

const logger = new Logger()

if (cluster.isMaster) {
  logger.debug('MASTER')
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork({ shardID: i, shardCount: os.cpus().length })
  }
} else {
  logger.debug(`WORKER ${process.env.shardID}`)
  let Tatsumaki = new Bot({
    shardID: process.env.shardID,
    shardCount: process.env.shardCount
  })
  Tatsumaki.run()

  module.exports = Tatsumaki
}
