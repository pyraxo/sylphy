const Permitter = {
  contexts: ['members', 'roles', 'channels'],

  verify (query, rawPerms, node, defVal = true) {
    for (const context of Permitter.contexts) {
      const list = query[context]
      if (typeof list === 'undefined') continue
      for (const id of Array.isArray(list) ? list : [list]) {
        if (Permitter.check(node, context, id, rawPerms, defVal) === !defVal) {
          return !defVal
        }
      }
    }
    return defVal
  },

  isBoolean (val) {
    return val === true || val === false
  },

  hasWildcard (obj) {
    return obj !== null && '*' in obj ? Permitter.isBoolean(obj['*']) : false
  },

  verifyMessage (node, msg, perms = {}, defVal = true) {
    if (!msg.guild) return true
    let res = Permitter.check(`${msg.channel.id}.${msg.author.id}.${node}`, perms)
    if (Permitter.isBoolean(res)) return res

    for (const perm of msg.member.roles.map(r => `${msg.channel.id}.${r}.${node}`)) {
      res = Permitter.check(perm, perms)
      if (Permitter.isBoolean(res)) return res
    }

    res = Permitter.check(`*.${msg.author.id}.${node}`, perms)
    if (Permitter.isBoolean(res)) return res

    for (const perm of msg.member.roles.map(r => `*.${r}.${node}`)) {
      res = Permitter.check(perm, perms)
      if (Permitter.isBoolean(res)) return res
    }

    res = Permitter.check(`${msg.channel.id}.${node}`, perms)
    if (Permitter.isBoolean(res)) return res

    res = Permitter.check(`*.*.${node}`, perms)
    if (Permitter.isBoolean(res)) return res

    return defVal
  },

  check (node, perms = {}) {
    const res = node.split('.').reduce((obj, idx) => {
      if (obj === null || Permitter.isBoolean(obj)) return obj
      if (idx in obj) return obj[idx]
      else if ('*' in obj) return obj['*']
      return null
    }, perms)
    if (res === true || res === false) return res
    return null
  },

  allow (node, perms) {
    return Permitter.grant(node, true, perms)
  },

  deny (node, perms) {
    return Permitter.grant(node, false, perms)
  },

  grant (node, val = true, rawPerms = {}) {
    const nodes = node.split('.')
    const last = nodes.length - 1

    nodes.reduce((o, c, i) => {
      if (i >= last) {
        if (typeof o['*'] === 'undefined') o['*'] = null
        if (o[c] === true || o[c] === false && o[c] !== val) {
          o[c] = null
        } else {
          o[c] = val
        }
      } else if (typeof o[c] === 'undefined') {
        o[c] = {}
      } else if (o[c] === true || o[c] === false) {
        o[c] = { '*': o[c] }
      }
      return o[c]
    }, rawPerms)

    return rawPerms
  }
}

module.exports = Permitter
