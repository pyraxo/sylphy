module.exports = {
  triggers: ['ping'],
  execute: ({ msg }) => msg.channel.createMessage('Pong!')
}
