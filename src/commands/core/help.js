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

  async handle ({ msg, commander, settings, args }, responder) {
    const prefix = settings.prefix
    if (args.command) {
      const command = args.command.cmd
      const name = command.labels[0]
      const description = this.i18n.get(`descriptions.${name}`, settings.lang) || command.description
      let reply = [
        `**\`${prefix}${name}\`**  __\`${description}\`__\n`,
        `**{{definitions.usage}}**: ${prefix}${command.labels[0]} ${Object.keys(command.resolver.usage).map(usage => {
          usage = command.resolver.usage[usage]
          return usage.optional ? `[${usage.displayName}]` : `<${usage.displayName}>`
        }).join(' ')}`
      ]
      if (command.labels.length > 1) {
        reply.push(`\n**{{definitions.aliases}}**: \`${command.labels.slice(1).join(' ')}\``)
      }
      reply.push('\n{{footer_group}}')
      responder.send(reply.join('\n'))
      return
    }
    let commands = {}
    let reply = [
      `{{header_1}} ${prefix === process.env.CLIENT_PREFIX ? '' : '{{header_1_alt}}'}`,
      '{{header_2}}',
      '{{header_3}}',
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
    responder.send(reply.join('\n'), {
      DM: true,
      prefix: `\`${prefix}\``,
      defaultPrefix: `\`${process.env.CLIENT_PREFIX}\``,
      helpCommand: `\`${prefix}help <command>\``,
      exampleCommand: `\`${prefix}help credits\``
    })
    .then(m => {
      if (msg.guild) {
        responder.format('emoji:inbox').reply('check your PMs!')
      }
    })
  }
}

module.exports = HelpMenu
