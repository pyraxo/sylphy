const Client = require('../')

const { token } = require('./auth.json')

const bot = new Client({
  token: token
})

bot.on('ready', () => console.log('running!'))

bot.run()
