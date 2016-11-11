const moment = require('moment')
const logger = require('winston')
const { MultiCommand } = require('../../core')

class Credits extends MultiCommand {
  constructor (...args) {
    super(...args, {
      name: 'credits',
      description: 'Currency system',
      aliases: ['credit'],
      cooldown: 5,
      types: {
        claim: 'claim',
        give: {
          usage: [
            { name: 'member', type: 'member', optional: false },
            { name: 'amount', type: 'int', optional: false }
          ]
        }
      },
      hasMain: true
    })
  }

  async getUser (db, id) {
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

  async topup (db, id, amt) {
    try {
      let user = await this.getUser(db, id)
      user.credits += amt
      await user.save()
      return user
    } catch (err) {
      throw err
    }
  }

  default ({ msg, db }, responder) {
    this.getUser(db, msg.author.id).then(user => {
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
          const amt = ~~Math.floor(Math.random() * 100) + 50
          await this.topup(db, msg.author.id, amt)
          await cache.multi().set(claimID, 1).expire(claimID, 28800).execAsync()
          responder.format('emoji:credits').reply(`**${amt}** credits have been added to your account.`)
          break
        }
        default: {
          responder.format('emoji:credits').reply(
            `your claimable credit refreshes in **${moment(res + moment()).fromNow(true)}**.`
          )
          break
        }
      }
    } catch (err) {
      throw new Error(`Error claiming credits for ${msg.author.username} (${msg.author.id}): ${err}`)
    }
  }

  async give ({ msg, cache, db, args }, responder) {
    const credits = (await this.getUser(db, msg.author.id)).credits
    const user = args.member.user
    const code = ~~(Math.random() * 8999) + 1000
    const amt = args.amount

    responder.format('emoji:atm').prompt([
      `you are transferring **${amt}** credits to **${user.username}#${user.discriminator}**\n`,
      `__Current balance__: **\`$ ${credits}\`**`,
      `__Balance after transfer__: **\`$ ${credits - amt}\`**\n`,
      `➡  |  To confirm, enter **\`${code}\`** to proceed or **\`exit\`** to quit the menu.`
    ].join('\n'), code, { method: 'reply' }).then(msg => {
      if (msg === null) return responder.success('you have exited the menu.')
      Promise.all([
        this.topup(db, msg.author.id, -amt),
        this.topup(db, user.id, amt)
      ]).catch(err => {
        logger.error('Error carrying out transaction')
        logger.error(`S: ${msg.author.username} (${msg.author.id}) | T: ${user.username} (${user.id})`)
        logger.error(err)
      }).then(() => {
        responder.format('emoji:credits').reply([
          `you have transferred **${amt}** credits to **${user.username}**'s account.\n`,
          `__Updated balance__: **\`$ ${credits - amt}\`**\n`
        ].join('\n'))
      })
    }).catch(err => responder.error(`the menu has closed: **${err}**.`))
  }
}

module.exports = Credits
