import os from 'os'
import cluster from 'cluster'

import Bot from './services/Bot'
import Logger from './services/Logger'
import Carbonitex from './services/Carbonitex'

const logger = new Logger()

if (cluster.isMaster) {
  let carbon = new Carbonitex(os.cpus().length)
  logger.debug('MASTER')
  let spawnWorker = (count = 0, end = false) => {
    if (count === os.cpus().length) return
    const worker = cluster.fork({ shardID: count, shardCount: os.cpus().length })
    worker.on('online', () => {
      logger.debug(`WORKER ${worker.process.pid} ONLINE: Shard ${count}`)
    })
    worker.on('message', msg => {
      if (end) return
      if (msg === 'loaded.shard') setTimeout(() => spawnWorker(++count), 2000)
      if (msg.hasOwnProperty('serverCount')) carbon.incr(msg.serverCount, count, os.cpus().length)
    })
    worker.on('exit', () => {
      const shard = count
      setTimeout(() => spawnWorker(shard, true), 5000)
      logger.debug(`WORKER ${worker.process.pid} EXITED: Shard ${count}`)
    })
  }
  spawnWorker()
} else if (cluster.isWorker) {
  let Tatsumaki = new Bot({
    shardID: parseInt(process.env.shardID, 10),
    shardCount: parseInt(process.env.shardCount, 10)
  })
  Tatsumaki.run()

  Tatsumaki.once('loaded.discord', serverCount => {
    process.send('loaded.shard')
    process.send({ serverCount: serverCount })
  })

  module.exports = Tatsumaki
}
