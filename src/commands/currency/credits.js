const moment = require('moment')
const logger = require('winston')
const { MultiCommand } = require('../../core')

class Credits extends MultiCommand {
  constructor (...args) {
    super(...args, {
      name: 'credits',
      description: 'Currency system',
      aliases: ['credit'],
      cooldown: 5
    })

    this.registerSubcommands({
      claim: 'claim',
      give: {
        usage: [
          { name: 'member', type: 'member', optional: false },
          { name: 'amount', type: 'int', optional: false }
        ]
      }
    }, 'default')
  }

  async getUser (data, id) {
    try {
      return await data.User.fetch(id)
    } catch (err) {
      if (err.name === 'DocumentNotFoundError') {
        const Model = data.User.model
        let user = new Model({ id })
        await user.save()
        return user
      }
      throw err
    }
  }

  async topup (data, id, amt) {
    try {
      let user = await this.getUser(data, id)
      user.credits += amt
      await user.save()
      return user
    } catch (err) {
      throw err
    }
  }

  default ({ msg, data }, responder) {
    this.getUser(data, msg.author.id).then(user => {
      responder.format('emoji:credits')
      .send(`${msg.author.username}'s account balance: **\`${user.credits}\`** credits.`)
    }).catch(this.logError)
  }

  async claim ({ msg, cache, data }, responder) {
    const claimID = 'claims:' + msg.author.id
    try {
      let res = await cache.client.pttlAsync(claimID)
      switch (res) {
        case -1:
        case -2: {
          const amt = ~~Math.floor(Math.random() * 100) + 50
          await this.topup(data, msg.author.id, amt)
          await cache.store(claimID, 1, 28800)
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

  async give ({ msg, cache, data, args }, responder) {
    const credits = (await this.getUser(data, msg.author.id)).credits
    const user = args.member.user
    const code = ~~(Math.random() * 8999) + 1000
    const amt = args.amount

    responder.format('emoji:atm').dialog([{
      prompt: [
        'Credits Transfer\n',
        `**${msg.author.username}**, you are transferring **${amt}** credits to **${user.username}#${user.discriminator}**\n`,
        `__Current balance__: **\`$ ${credits}\`**`,
        `__Balance after transfer__: **\`$ ${credits - amt}\`**\n`,
        `➡  |  To confirm, enter **\`${code}\`** to proceed or **\`exit\`** to quit the menu.`
      ],
      input: { type: 'int', name: 'code' }
    }]).then(arg => {
      if (arg.code !== code) {
        responder.error('you have entered an invalid code. Your credits have **not** been transferred.')
        return
      }
      Promise.all([
        this.topup(data, msg.author.id, -amt),
        this.topup(data, user.id, amt)
      ]).then(() => {
        responder.format('emoji:credits').reply([
          `you have transferred **${amt}** credits to **${user.username}**'s account.\n`,
          `__Updated balance__: **\`$ ${credits - amt}\`**\n`
        ].join('\n'))
      }, err => {
        logger.error('Error carrying out transaction')
        logger.error(`S: ${msg.author.username} (${msg.author.id}) | T: ${user.username} (${user.id})`)
        logger.error(err)
      })
    })
  }
}

class Claim extends Credits {
  constructor (...args) {
    super(...args, {
      name: 'wage',
      description: 'Claim your credits every 8 hours'
    })

    this.registerSubcommand('claim')
  }
}

module.exports = [ Credits, Claim ]
