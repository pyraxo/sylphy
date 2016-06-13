let Tatsumaki = require('../../src')

Tatsumaki.on('ping', msg => {
  msg.reply('pong!')
})
