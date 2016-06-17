import tcpp from 'tcp-ping'

import BaseCommand from '../../Base/BaseCommand'

class Ping extends BaseCommand {
  get name () {
    return 'ping'
  }

  get description () {
    return 'Pong!'
  }

  get usage () {
    return '[hostname]'
  }

  handle (args) {
    if (args[0]) {
      this.reply(`🔍  Pinging **${args[0]}**`)
      .then(msg => {
        tcpp.ping({
          address: args[0]
        }, (err, data) => {
          if (err || !data.avg) {
            this.client.updateMessage(msg,
              '❎  Pinging failed! ' +
              `**${err || 'Connection not found!'}**`
            )
            return
          }
          this.client.updateMessage(msg, [
            `✅  Pinged **${args[0]}**`,
            '```xl',
            `address: ${args[0]}`,
            'port: 80',
            'attempts: 10',
            `avg: ${data.avg.toPrecision(3)} ms`,
            `max: ${data.max.toPrecision(3)} ms`,
            `min: ${data.min.toPrecision(3)} ms`,
            '```'
          ].join('\n'))
        })
      })
    } else {
      this.reply('ℹ  Pong!')
      .then(m => {
        this.client.updateMessage(m, `${m.content}  |  Time taken: **${m.timestamp - this.message.timestamp}ms**`)
      })
    }
  }
}

module.exports = Ping
