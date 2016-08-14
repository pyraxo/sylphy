import os from 'os'
import cluster from 'cluster'

import Bot from './services/Bot'
import Logger from './services/Logger'
import IPC from './services/IPC'

const logger = new Logger()

if (cluster.isMaster) {
  let ipc = new IPC(os.cpus().length)
  logger.debug('MASTER')
  let createWorker = num => {
    const worker = spawnWorker(num)
    worker.on('message', msg => {
      if (typeof msg === 'object') {
        if (msg.hasOwnProperty('guilds')) ipc.store(msg.guilds, num)
      } else if (typeof msg === 'string') {
        switch (msg) {
          case 'cache:guild:create': {
            ipc.add(num, msg.guild)
            break
          }
          case 'cache:guild:delete': {
            ipc.remove(num, msg.guild)
            break
          }
        }
      }
    })
  }
  let spawnWorker = (count = 0) => {
    if (count === os.cpus().length) return
    const worker = cluster.fork({ shardID: count, shardCount: os.cpus().length })
    worker.on('online', () => {
      logger.debug(`WORKER ${worker.process.pid} ONLINE: Shard ${count}`)
    })
    worker.on('exit', () => {
      logger.debug(`WORKER ${worker.process.pid} EXITED: Shard ${count}`)
      setTimeout(() => createWorker(count), 5000)
    })
    return worker
  }
  for (let i = 0; i < os.cpus().length; i++) {
    setTimeout(() => createWorker(i), i * 5000)
  }
} else if (cluster.isWorker) {
  const Iris = new Bot({
    shardID: parseInt(process.env.shardID, 10),
    shardCount: parseInt(process.env.shardCount, 10)
  })
  Iris.run()

  Iris.on('loaded:discord', guilds => {
    process.send('loaded:shard')
    process.send({ 'guilds': guilds })
  })

  Iris.on('cache:guild:*', guild => {
    process.send(this.event)
    process.send({ 'guild': guild.id })
  })

  module.exports = Iris
}
