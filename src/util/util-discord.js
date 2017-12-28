const { checKNode } = require('./permitter')

/**
 * Determines if a member has a role that is higher than the given role.
 * @arg {external:"Eris.Member"} member - Member to check
 * @arg {external:"Eris.Role"} role - Role to check
 * @returns {boolean}
 */
const hasRoleHierarchy = (member, role) => {
  const guild = member.guild
  return guild && member.roles.some(id => {
    const r = guild.roles.get(id)
    return r.position > role.position
  })
}

/**
 * Verifies if a command has permission to be executed.
 * @arg {string} node - Permission node
 * @arg {external:"Eris.Message"} message - Message with command
 * @arg {Object} perms - Permissions map
 * @arg {boolean} [defaultValue=true] - Default result
 */
const verifyMessageCommand = (node, msg, perms = {}, defVal = true) => {
  const check = (str) => checkNode(str, perms)

  if (!msg.channel.guild) return true
  let res = check(`${msg.channel.id}.${msg.author.id}.${node}`)
  if (isBoolean(res)) return res

  for (const perm of msg.member.roles.map(r => `${msg.channel.id}.${r}.${node}`)) {
    res = check(perm)
    if (isBoolean(res)) return res
  }

  res = check(`*.${msg.author.id}.${node}`)
  if (isBoolean(res)) return res

  for (const perm of msg.member.roles.map(r => `*.${r}.${node}`)) {
    res = check(perm)
    if (isBoolean(res)) return res
  }

  res = check(`${msg.channel.id}.${node}`)
  if (isBoolean(res)) return res

  res = check(`*.*.${node}`)
  if (isBoolean(res)) return res

  return defVal
}

module.exports = {
  hasRoleHierarchy,
  verifyMessageCommand
}