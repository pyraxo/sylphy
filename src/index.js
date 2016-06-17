import os from 'os'
import cluster from 'cluster'

import Bot from './services/Bot'
import Logger from './services/Logger'

const logger = new Logger()

if (cluster.isMaster) {
  logger.debug('MASTER')
  let spawnWorker = (count = 0) => {
    if (count === os.cpus().length) return
    const worker = cluster.fork({ shardID: count, shardCount: os.cpus().length })
    worker.once('online', () => {
      logger.debug(`WORKER ${worker.process.pid}: Shard ${count}`)
    })
    worker.once('message', msg => {
      if (msg === 'loaded:shard') setTimeout(() => spawnWorker(++count), 2000)
    })
  }
  spawnWorker()
} else {
  let Tatsumaki = new Bot({
    shardID: parseInt(process.env.shardID, 10),
    shardCount: parseInt(process.env.shardCount, 10)
  })
  Tatsumaki.run()

  Tatsumaki.once('loaded:discord', () => process.send('loaded:shard'))

  module.exports = Tatsumaki
}
