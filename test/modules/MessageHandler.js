module.exports = {
  name: 'messages',
  events: {
    messageCreate: 'onMessage'
  },
  onMessage: (client, msg) => console.log(msg.id)
}