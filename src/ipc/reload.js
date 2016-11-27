module.exports = async function reload (msg, bot) {
  const type = msg.d.type || 'commands'
  const group = msg.d.group
  const file = msg.d.file

  try {
    await bot.engine.reload(type, group, file)
    bot.engine[`load${type.charAt(0).toUpperCase()}${type.substr(1)}`](group, file)
    process.send({ op: 'resp', d: 'success' })
  } catch (err) {
    process.send({ op: 'resp', d: err.toString() })
  }
}
