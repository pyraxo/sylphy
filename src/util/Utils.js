let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const path = require('path')
const fs = require('fs')
const emojis = require('../../res/emoji')

const colours = {
  blue: '#117ea6',
  green: '#1f8b4c',
  red: '#be2626',
  pink: '#E33C96',
  gold: '#d5a500',
  silver: '#b7b7b7',
  bronze: '#a17419',
  orange: '#c96941'
}

/**
 * Utility class
 */
class Utils {
  /**
   * Creates a new Utils instance
   * @arg {Client} client Client instance
   */
  constructor (client) {
    Utils._client = client
  }

  /**
   * Checks if a path is a directory
   * @arg {String} filename The path to check
   */
  static isDir (fname) {
    return fs.existsSync(fname) ? fs.statSync(fname).isDirectory() : false
  }

  static get emojis () {
    return emojis
  }

  /**
   * Pads a string on the right if it's shorter than the padding length
   * @arg {String} [String=''] The string to pad
   * @arg {Number} [length=0] The padding length
   * @arg {String} [chars=' '] The string used as padding
   */
  static padEnd (string = '', len = 0, chars = ' ') {
    const str = String(string)
    const pad = String(chars)
    return str.length >= len ? '' + str : str + pad.repeat(len - str.length)
  }

  /**
   * Pads a string on the left if it's shorter than the padding length
   * @arg {String} [String=''] The string to pad
   * @arg {Number} [length=0] The padding length
   * @arg {String} [chars=' '] The string used as padding
   */
  static padStart (string = '', len = 0, chars = ' ') {
    const str = String(string)
    const pad = String(chars)
    return str.length >= len ? '' + str : (pad.repeat(len) + str).slice(-len)
  }

  /**
   * Gets the integer of a colour
   * @arg {String} colour Hex colour code or name of colour
   * @returns {?Number}
   */
  static getColour (colour) {
    if (!colours[colour]) return
    return parseInt(String(colours[colour] || colour).replace('#', ''), 16) || null
  }

  /**
   * Format a number with grouped thousands
   * @arg {Number} num Number to Format
   * @returns {String}
   */
  static parseNumber (num) {
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  /**
   * Determines if a member has a role that is higher than the given role
   * @arg {external:"Eris.Member"} member Member to check
   * @arg {external:"Eris.Role"} role Role to check
   * @returns {Boolean}
   */
  static hasRoleHierarchy (member, role) {
    const guild = member.guild
    return guild && member.roles.some(id => {
      const r = guild.roles.get(id)
      return r.position > role.position
    })
  }

  /**
   * Reads a directory recursively and returns an array of paths
   * @arg {String} dir Directory path
   * @returns {Array}
   */
  static requireRecursive (dir) {
    return fs.readdirSync(dir).reduce((arr, file) => {
      if (file.startsWith('.')) return arr
      const filepath = path.join(dir, file)
      arr.push(Utils.isDir(filepath) ? Utils.requireRecursive(filepath) : require(filepath))
      return arr
    }, [])
  }

  /**
   * Reads a directory recursively and returns an object mapping the required files to the folder
   * @arg {String} dir Directory path
   * @returns {Object}
   */
  static requireAll (dir) {
    return fs.readdirSync(dir).reduce((obj, file) => {
      if (file.startsWith('.')) return obj
      const filepath = path.join(dir, file)
      obj[file.substring(0, path.basename(filepath, path.extname(filepath)).length)] = Utils.isDir(filepath)
      ? Utils.requireAll(filepath) : require(filepath)
      return obj
    }, {})
  }

  /**
   * Delay Promise
   * @arg {Number} time Time to delay
   * @returns {Promise}
   */
  static delay (time) {
    return new Promise((resolve) => setTimeout(() => resolve(), time))
  }
}

module.exports = Utils
