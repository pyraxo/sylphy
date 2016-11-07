module.exports = async function reload (msg, bot) {
  let type = msg.d.type || 'commands'
  const group = msg.d.group

  try {
    await bot.engine.reload(type, group)
    bot.engine[`load${type.charAt(0).toUpperCase()}${type.substr(1)}`](group)
    process.send({ op: 'resp', d: 'success' })
  } catch (err) {
    process.send({ op: 'resp', d: err.toString() })
  }
}
