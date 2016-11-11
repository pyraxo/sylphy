module.exports = async function kill (msg, bot) {
  process.send({ op: 'resp', d: 'success' })
  setTimeout(() => process.exit(1), 3000)
}
