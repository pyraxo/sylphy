const util = require('util')
const Client = require('../')

const { token, admins } = require('./auth.json')

const bot = new Client({
  token: token,
  commands: 'test/commands',
  locales: 'test/i18n',
  prefix: '+',
  admins: admins
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
})

bot.run()

process.on('unhandledRejection', (reason, promise) => {
  if (typeof reason === 'undefined') return
  logger.error(`Unhandled rejection: ${reason} - ${util.inspect(promise)}`)
})
