/**
 * Permission checker
 */
class Permitter {
  static get contexts () {
    return ['members', 'roles', 'channels']
  }

  static isBoolean (val) {
    return val === true || val === false
  }

  static hasWildcard (obj) {
    return obj !== null && '*' in obj ? this.isBoolean(obj['*']) : false
  }

  /**
   * Verifies if a command has permission to be executed
   * @arg {String} node The permission node
   * @arg {external:"Eris.Message"} message The command message
   * @arg {Object} perms The permissions map
   * @arg {Boolean} [defaultValue=true] The default result
   */
  static verifyMessage (node, msg, perms = {}, defVal = true) {
    if (!msg.channel.guild) return true
    let res = this.check(`${msg.channel.id}.${msg.author.id}.${node}`, perms)
    if (this.isBoolean(res)) return res

    for (const perm of msg.member.roles.map(r => `${msg.channel.id}.${r}.${node}`)) {
      res = this.check(perm, perms)
      if (this.isBoolean(res)) return res
    }

    res = this.check(`*.${msg.author.id}.${node}`, perms)
    if (this.isBoolean(res)) return res

    for (const perm of msg.member.roles.map(r => `*.${r}.${node}`)) {
      res = this.check(perm, perms)
      if (this.isBoolean(res)) return res
    }

    res = this.check(`${msg.channel.id}.${node}`, perms)
    if (this.isBoolean(res)) return res

    res = this.check(`*.*.${node}`, perms)
    if (this.isBoolean(res)) return res

    return defVal
  }

  /**
   * Checks if a node is allowed
   * @arg {String} node The permission node
   * @arg {Object} perms THe permissions map
   */
  static check (node, perms = {}) {
    const res = node.split('.').reduce((obj, idx) => {
      if (obj === null || this.isBoolean(obj)) return obj
      if (idx in obj) return obj[idx]
      else if ('*' in obj) return obj['*']
      return null
    }, perms)
    if (res === true || res === false) return res
    return null
  }

  /**
   * Allows a permission node
   * @arg {String} node The permission node
   * @arg {Object} perms THe permissions map
   */
  static allow (node, perms) {
    return this.grant(node, true, perms)
  }

  /**
   * Denies a permission node
   * @arg {String} node The permission node
   * @arg {Object} perms THe permissions map
   */
  static deny (node, perms) {
    return this.grant(node, false, perms)
  }

  /**
   * Grants a permission node allow or deny
   * @arg {String} node The permission node
   * @arg {Boolean} value The value of the node
   * @arg {Object} perms THe permissions map
   */
  static grant (node, val = true, rawPerms = {}) {
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
