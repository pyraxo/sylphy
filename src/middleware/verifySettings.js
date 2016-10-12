const logger = require('winston')
const { configDB } = require('../system/Database')

module.exports = {
  priority: 5,
  process: function (obj, done) {
    const { msg, isPrivate } = obj
    if (isPrivate) {
      return done(null, {
        prefix: process.env.CLIENT_PREFIX_STANDARD,
        admin_prefix: process.env.CLIENT_PREFIX_ADMIN,
        lang: 'default'
      })
    }
    configDB.getAsync(`settings:${msg.channel.guild.id}`)
    .then(settings => {
      const defaults = {
        id: msg.channel.guild.id,
        prefix: process.env.CLIENT_PREFIX_STANDARD,
        admin_prefix: process.env.CLIENT_PREFIX_ADMIN,
        welcome: 'Welcome to $SERVER$, $USERMENTION$!',
        goodbye: '$USER$ has left the server.',
        autorole: false,
        levelUpMsg: true,
        cleverbot: true,
        lang: 'default'
      }
      if (settings === null) {
        obj.settings = defaults
        configDB.setAsync(`settings:${msg.channel.guild.id}`, JSON.stringify(defaults))
        .then(() => done(null, obj))
        .catch(err => done(err))
      } else {
        let altered = false
        settings = JSON.parse(settings)
        for (let key in defaults) {
          if (!settings.hasOwnProperty(key)) {
            settings[key] = defaults[key]
            altered = true
          }
        }
        if (altered) {
          configDB.setAsync(`settings:${msg.channel.guild.id}`, JSON.stringify(settings))
          .then(() => done(null, obj))
          .catch(err => {
            logger.error(`Error adding default keys to ${msg.channel.guild.name} (${msg.channel.guild.id})'s settings: ${err}`)
          })
        }
        obj.settings = settings
        return done(null, obj)
      }
    })
    .catch(err => done(err))
  }
}
