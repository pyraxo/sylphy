module.exports = {
  name: 'messages',
  events: {
    messageCreate: 'onMessage'
  },
  onMessage: (msg, client) => console.log(msg.id)
}