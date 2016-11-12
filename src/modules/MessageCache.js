const { Module, Collection } = require('../core')

class MessageCache extends Module {
  constructor (...args) {
    super(...args, {
      name: 'messages',
      events: {
        ready: 'cacheAll',
        messageReactionAdd: 'checkReactions'
      }
    })

    this.cache = new Collection()
  }

  async cacheAll () {
    const client = this.bot.engine.cache.client
    const keys = await client.keysAsync('messages:*')
    if (keys.length) {
      let multi = client.multi()
      for (let key of keys) {
        multi.smembers(key)
      }
      let messages = await client.execAsync()
      messages.forEach((list, idx) => {
        this.cache.set(keys[idx].replace('messages:', ''), list)
      })
    }
  }

  checkReactions () {

  }
}

module.exports = MessageCache
