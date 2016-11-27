const chalk = require('chalk')
const cluster = require('cluster')
const winston = require('winston')
const winstonCluster = require('winston-cluster')

const { Automaton, ShardManager } = require('./core')

if (cluster.isMaster) {
  winstonCluster.bindListeners()
  const shardManager = new ShardManager(
    parseInt(process.env.CLIENT_PROCESSES, 10),
    parseInt(process.env.CLIENT_SHARDS_PER_PROCESS, 10)
  )
  shardManager.createShards()
} else {
  winstonCluster.bindTransport()
  const processShards = parseInt(process.env.CLIENT_SHARDS_PER_PROCESS, 10)
  const firstShardID = parseInt(process.env.BASE_SHARD_ID, 10) * processShards
  const lastShardID = firstShardID + processShards - 1
  const maxShards = parseInt(process.env.CLIENT_PROCESSES, 10) * processShards

  const automaton = new Automaton({ firstShardID, lastShardID, maxShards })

  automaton.once('ready', () => {
    const { guilds, channels, users } = automaton.fetchCounts()

    winston.info(`${chalk.red.bold('iris')} - ${
      firstShardID === lastShardID
      ? `Shard ${firstShardID} is ready`
      : `Shards ${firstShardID} to ${lastShardID} are ready`
    }`)
    winston.info(
      `G: ${chalk.green.bold(guilds)} | ` +
      `C: ${chalk.green.bold(channels)} | ` +
      `U: ${chalk.green.bold(users)}`
    )
    winston.info(`Prefix: ${chalk.cyan.bold(process.env.CLIENT_PREFIX)}`)
  })
  automaton.on('error', err => winston.error(err))
  automaton.run()
}
