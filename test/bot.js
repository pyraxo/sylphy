const util = require('util')
const Client = require('../')

const { token, admins } = require('./auth.json')

const processID = parseInt(process.env['PROCESS_ID'], 10)
const bot = new Client({
  token: token,
  commands: 'test/commands',
  locales: 'test/i18n',
  prefix: '+',
  admins: admins,
  maxShards: 4,
  firstShardID: processID,
  lastShardID: processID
})

const logger = bot.logger

logger.debug([
  'Running bot\n',
  'With flashy logging'
].join('\n'))
logger.error(new Error('Testing error'))

bot.on('commander:registered', logger.log)

bot.on('ready', () => {
  logger.info('Logged in as ' + bot.user.username)
  bot.shards.forEach(s => logger.info(`Loaded shard ${s.id}`))
})

bot.run()

process.on('unhandledRejection', (reason, promise) => {
  if (typeof reason === 'undefined') return
  logger.error(`Unhandled rejection: ${reason} - ${util.inspect(promise)}`)
})
