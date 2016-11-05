const { padEnd } = require('../../core/util')
const { Command } = require('../../core')

class HelpMenu extends Command {
  constructor (...args) {
    super(...args, {
      name: 'help',
      description: 'Displays info on commands'
    })
  }

  handle ({ msg, commander }, responder) {
    let commands = {}
    let reply = []
    let maxPad = 10
    commander.unique()
    .forEach(c => {
      const module = c.group
      const name = c.ext.labels[0]
      const desc = c.ext.description
      if (!c.ext.adminOnly) {
        if (name.length > maxPad) maxPad = name.length
        if (!Array.isArray(commands[module])) commands[module] = []
        commands[module].push([name, desc])
      }
    })
    for (let mod in commands) {
      if (commands[mod].length === 0) continue
      reply.push([
        `# ${mod}:`,
        commands[mod].map(c => `  ${padEnd(c[0], maxPad)} // ${c[1]}`).join('\n')
      ].join('\n'))
    }
    responder.format(['bold', 'code:glsl']).DM(reply.join('\n'))
    .then(() => responder.format('emoji:inbox').reply('check your PMs!'))
  }
}

module.exports = HelpMenu
