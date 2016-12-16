const { Command } = require('../../core')

class Eval extends Command {
  constructor (...args) {
    super(...args, {
      name: 'eval',
      description: 'Evaluates an expression',
      options: {
        adminOnly: true
      },
      cooldown: 0
    })
  }

  createEmbed (success = true, isPromise = false, result) {
    let embed = {
      description: String(result ? result.content || result.message || result : 'null')
    }
    let title
    let color
    if (success) {
      title = isPromise ? 'Promise resolved' : 'Success'
      color = this.colours.green
    } else {
      if (success === null && isPromise) {
        title = 'Promise resolving'
        color = this.colours.blue
      } else {
        title = isPromise ? 'Promise rejected' : 'Error'
        color = this.colours.red
      }
    }
    embed.title = title
    embed.color = color
    return embed
  }

  async handle (container, responder) {
    const { rawArgs } = container
    let resp
    try {
      resp = eval(rawArgs.join(' '))
    } catch (err) {
      resp = err
    }

    const success = !(resp instanceof Error)
    const isPromise = typeof resp === 'function' && (resp.then ? resp.then : false)

    const message = await responder.embed(
      this.createEmbed(isPromise ? null : success, isPromise, (resp && resp.message) ? resp.message : resp)
    ).send()

    if (!isPromise) return

    resp
    .then(result => message.edit({ content: '', embed: this.createEmbed(true, true, result) }))
    .catch(err => message.edit({ content: '', embed: this.createEmbed(false, true, err) }))
  }
}

class FullEval extends Command {
  constructor (...args) {
    super(...args, {
      name: 'fulleval',
      description: 'Evaluates an expression across processes',
      options: {
        adminOnly: true
      },
      cooldown: 0
    })
  }

  async handle (container, responder) {
    const { msg } = container
    const content = msg.content.split(' ').slice(1).join(' ')
    this.bot.engine.ipc.awaitResponse('evaluate', { content })
    .then(data => responder.format('code:js').send(data.map(d => {
      const r = d.result || null
      return [
        `PROCESS ${d.id}:`,
        (r && r.length > 200 ? r.substr(0, 200) + '...' : r) + '\n'
      ].join('\n')
    }).join('\n')))
    .catch(err => responder.format('code:js').send(err))
  }
}

module.exports = [ Eval, FullEval ]
