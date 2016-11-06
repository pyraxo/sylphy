const moment = require('moment')
const { MultiCommand } = require('../../core')

class Credits extends MultiCommand {
  constructor (...args) {
    super(...args, {
      name: 'credits',
      description: 'Currency system',
      cooldown: 5,
      types: {
        claim: 'claim'
      },
      hasMain: true
    })
  }

  async get (db, id) {
    try {
      return await db.User.get(id).run()
    } catch (err) {
      if (err.name === 'DocumentNotFoundError') {
        let user = new db.User({ id })
        await user.save()
        return user
      }
      throw err
    }
  }

  async add (db, id, amt) {
    try {
      let user = await this.get(db, id)
      user.credits += amt
      await user.save()
      return user
    } catch (err) {
      throw err
    }
  }

  default ({ msg, db }, responder) {
    this.get(db, msg.author.id).then(user => {
      responder.format('emoji:credits')
      .send(`${msg.author.username}'s account balance: **\`${user.credits}\`** credits.`)
    }).catch(this.logError)
  }

  async claim ({ msg, cache, db }, responder) {
    const claimID = 'claims:' + msg.author.id
    try {
      let res = await cache.pttlAsync(claimID)
      switch (res) {
        case -1:
        case -2: {
          await this.add(db, msg.author.id, ~~Math.floor(Math.random() * 100) + 50)
          await cache.multi().set(claimID, 1).expire(claimID, 28800).execAsync()
          break
        }
        default: {
          responder.format('emoji:credits')
          .reply(`your claimable credit refreshes in **${moment(res + moment()).fromNow(true)}**.`)
          break
        }
      }
    } catch (err) {
      throw new Error(`Error claiming credits for ${msg.author.username} (${msg.author.id}): ${err}`)
    }
  }
}

module.exports = Credits
