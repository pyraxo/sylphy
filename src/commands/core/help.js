const { padEnd } = require('../../core/util')
const { Command } = require('../../core')

class HelpMenu extends Command {
  constructor (...args) {
    super(...args, {
      name: 'help',
      description: 'Displays info on commands',
      usage: [
        { name: 'command', type: 'command', optional: true }
      ]
    })
  }

  handle ({ msg, commander, settings, args }, responder) {
    const prefix = settings.prefix
    if (args.command) {
      const command = args.command.cmd
      let reply = [
        `**\`${prefix}${command.labels[0]}\`**  __\`${command.description}\`__\n`,
        `**Usage**: ${prefix}${command.labels[0]} ${Object.keys(command.resolver.usage).map(usage => {
          usage = command.resolver.usage[usage]
          return usage.optional ? `[${usage.displayName}]` : `<${usage.displayName}>`
        }).join(' ')}`
      ]
      if (command.labels.length > 1) {
        reply.push(`\n**Aliases**: \`${command.labels.slice(1).join(' ')}\``)
      }
      reply.push(
        '\n`[]` refers to __**optional**__ arguments',
        '`<>` refers to __**required**__ arguments',
        'Omit `<>` or `[]` when invoking a command'
      )
      responder.send(reply.join('\n'))
      return
    }
    let commands = {}
    let reply = [
      `To run a command, invoke it with \`${prefix}\` ${
        prefix === process.env.CLIENT_PREFIX
        ? `or the default ${process.env.CLIENT_PREFIX}` : ''
      }`,
      `To get more help on a command, call \`${prefix}help <command>\``,
      `For example: \`${prefix}help credits\``,
      '**```glsl'
    ]
    let maxPad = 10
    commander.unique().forEach(c => {
      if (c.cmd.labels[0] !== c.label || c.cmd.hidden || c.cmd.adminOnly) return
      const module = c.group
      const name = c.cmd.labels[0]
      const desc = c.cmd.description
      if (name.length > maxPad) maxPad = name.length
      if (!Array.isArray(commands[module])) commands[module] = []
      commands[module].push([name, desc])
    })
    for (let mod in commands) {
      if (commands[mod].length === 0) continue
      reply.push([
        `# ${mod}:`,
        commands[mod].map(c => `  ${padEnd(c[0], maxPad)} // ${c[1]}`).join('\n')
      ].join('\n'))
    }
    reply.push('```**')
    responder.send(reply.join('\n'), { DM: true })
    .then(m => {
      if (msg.guild) {
        responder.format('emoji:inbox').reply('check your PMs!')
      }
    })
  }
}

module.exports = HelpMenu
