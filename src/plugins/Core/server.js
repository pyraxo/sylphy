import BaseCommand from '../../Base/BaseCommand'


class Server extends BaseCommand {
  get name () {
    return 'server'
  }

  get description () {
    return 'Get a link to Tatsumaki-chan\'s support server'
  }

  get aliases () {
    return ['guild']
  }

  handle () {
    this.reply([
      ':wrench: Looking for support? My support channel is here:',
      '**https://discord.gg/0xyZL4m5TyYTzVGY**'
    ].join('\n'))
  }
}

module.exports = Server
