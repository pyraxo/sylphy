module.exports = function reload (msg, bot) {
  let type = msg.d.type || 'commands'
  const group = msg.d.group

  type = `${type.charAt(0).toUpperCase()}${type.substr(1)}`
  try {
    bot.engine[`reload${type}`](group)
    bot.engine[`load${type}`](group)
    process.send({ op: 'resp', d: 'success' })
  } catch (err) {
    process.send({ op: 'resp', d: err })
  }
}
