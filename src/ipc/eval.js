const util = require('util')

module.exports = async function evaluate (msg, bot) {
  const content = msg.d ? msg.d.content || true : true
  let resp
  try {
    resp = eval(String(content))
  } catch (err) {
    resp = `${err.message}\n\n${err.stack}`
  }
  if (Array.isArray(resp) || typeof resp === 'object') {
    resp = util.inspect(resp)
  }

  process.send({ op: 'resp', d: resp })
}
