const PERM_CONTEXTS = ['members', 'roles', 'channels']

/**
 * Check if variable is of a boolean type.
 * @arg {*} val - Variable to check.
 */
const isBoolean = (val) => val === true || val === false

/**
 * Check if a tree has a wildcard node.
 * @arg {Object} obj - Tree object to check.
 */
const hasWildCard = (obj) => obj !== null && '*' in obj ? isBoolean(obj['*']) : false

/**
 * Checks if a node is allowed.
 * @arg {string} node - Permission node
 * @arg {Object} perms - Permissions map
 */
const checkNode = (node, perms = {}) => {
  const res = node.split('.').reduce((obj, idx) => {
    if (obj === null || this.isBoolean(obj)) return obj
    if (idx in obj) return obj[idx]
    else if ('*' in obj) return obj['*']
    return null
  }, perms)
  return isBoolean(res) ? res : null


/**
 * Grants a permission node allow or deny.
 * @arg {string} perm - Permission node
 * @arg {boolean} value - Value of the node
 * @arg {Object} rawPerms - Permissions map
 */
const grantNode = (perm, val = true, rawPerms = {}) => {
  const nodes = perm.split('.')
  const last = nodes.length - 1
  const newPerms = rawPerms
  
  nodes.reduce((tree, node, idx) => {
    if (idx >= last) {
      tree['*'] = typeof tree['*'] === 'undefined' ? null : tree['*']
      tree[node] = isBoolean(tree[node]) && tree[node] !== val ? null : val
    } else if (typeof tree[node] === 'undefined') {
      tree[node] = {}
    } else if (isBoolean(tree[node])) {
      tree[node] = { '*': tree[node] }
    }
    return tree[node]
  }, newPerms)

  return newPerms
}}

/**
 * Allows a permission node.
 * @arg {string} node - Permission node
 * @arg {Object} perms - Permissions map
 */
const allowNode = (node, perms) => grantNode(node, true, perms)

/**
 * Denies a permission node.
 * @arg {string} node - Permission node
 * @arg {Object} perms - Permissions map
 */
const denyNode = (node, perms) => grantNode(node, false, perms)

module.exports = {
  PERM_CONTEXTS,
  isBoolean,
  hasWildCard,
  checkNode,
  grantNode,
  allowNode,
  denyNode
}
