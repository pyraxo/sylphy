const logger = require('winston')
const { configDB } = require('../core/system/Database')

const unwrap = (key, obj) => {
  let multi = configDB.multi()
  for (let prop in obj) {
    multi.hset(key, prop, obj[prop])
  }
  return multi.execAsync()
}

module.exports = {
  priority: 5,
  process: async (container, resolve, reject) => {
    const { msg, isPrivate } = container
    if (isPrivate) {
      container.settings = {
        prefix: process.env.CLIENT_PREFIX,
        lang: 'en'
      }
      return resolve(container)
    }
    try {
      let settings = await configDB.hgetallAsync(`settings:${msg.channel.guild.id}`)
      const defaults = {
        id: msg.channel.guild.id,
        prefix: process.env.CLIENT_PREFIX,
        lang: 'en'
      }
      if (settings === null) {
        await unwrap(`settings:${msg.channel.guild.id}`, defaults)
        container.settings = defaults
      } else {
        let altered = false
        for (let key in defaults) {
          if (!settings.hasOwnProperty(key)) {
            settings[key] = defaults[key]
            altered = true
          }
        }
        if (altered) {
          await unwrap(`settings:${msg.channel.guild.id}`, settings)
        }
        container.settings = settings
      }
      return resolve(container)
    } catch (err) {
      logger.error(
        `Error adding default keys to ${msg.channel.guild.name} ` +
        `(${msg.channel.guild.id})'s settings: ${err}`
      )
      return reject(err)
    }
  }
}
