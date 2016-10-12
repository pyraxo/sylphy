const chalk = require('chalk')
const cluster = require('cluster')
const winston = require('winston')
const winstonCluster = require('winston-cluster')

const Automaton = require('./Automaton')
const ShardManager = require('./system/ShardManager')

if (cluster.isMaster) {
  winstonCluster.bindListeners()
  const shardManager = new ShardManager(parseInt(process.env.CLIENT_SHARDS, 10))
  shardManager.createShards()
} else {
  winstonCluster.bindTransport()
  const shardID = parseInt(process.env.SHARD_ID, 10)
  const shardCounts = parseInt(process.env.CLIENT_SHARDS, 10)
  const automaton = new Automaton({ shardID, shardCounts })

  automaton.once('ready', user => {
    const counts = automaton.engine.fetchCounts()

    winston.info(`${chalk.red.bold('iris')} - Shard ${shardID} is ready`)
    winston.info(
      `G: ${chalk.green.bold(counts.guilds)} | ` +
      `C: ${chalk.green.bold(counts.channels)} | ` +
      `U: ${chalk.green.bold(counts.users)}`
    )
    winston.info(
      `Prefix: ${chalk.cyan.bold(process.env.CLIENT_PREFIX_STANDARD)} | ` +
      `Admin Prefix: ${chalk.cyan.bold(process.env.CLIENT_PREFIX_ADMIN)}`
    )

    process.send({ title: 'ready', counts })
  })
  automaton.on('error', err => winston.error(err))
  automaton.on('loaded:plugins', count => winston.info(`Loaded ${count} plugins`))
  automaton.on('loaded:middleware', count => winston.info(`Loaded ${count} middleware`))

  automaton.run()
}
