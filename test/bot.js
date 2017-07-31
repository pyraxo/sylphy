const util = require('util')
const Client = require('../')

process.on('message', (msg) => msg === 'end' && process.exit(0))

let auth
try {
  auth = require('./auth.json')
} catch (err) {
  auth = {
    token: process.env['TOKEN'],
    admins: (process.env['ADMINS'] || '').split(',')
  }
}

const processID = parseInt(process.env['PROCESS_ID'], 10)
const bot = new Client({
  token: auth.token,
  commands: 'test/commands',
  modules: 'test/modules',
  locales: 'test/i18n',
  prefix: '+',
  admins: auth.admins,
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
