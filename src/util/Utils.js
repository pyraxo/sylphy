const path = require('path')
const fs = require('fs')

/**
 * Utility class
 */
class Utils {
  /**
   * Creates a new Utils instance
   * @arg {Client} client Client instance
   */
  constructor (client) {
    this._client = client
  }

  /**
   * Reads a directory recursively and returns an array of paths
   * @arg {...String} paths Folder path(s)
   */
  static async readdirRecursive (...paths) {
    const dir = path.join(...paths)
    let list = []
    if (!fs.existsSync(dir)) return list
    let files = fs.readdirSync(dir)
    let dirs

    dirs = files.filter(this.constructor.isDir)
    files = files.filter(file => !Utils.isDir(this.constructor))
    .map(file => path.join(dir, file)).filter(file => !path.basename(file).startsWith('.'))
    list = list.concat(files)

    while (dirs.length) {
      let d = path.join(dir, dirs.shift())
      list = list.concat(await this.constructor.readdirRecursive(d))
    }

    return list
  }

  /**
   * Checks if a path is a directory
   * @arg {String} filename The path to check
   */
  static isDir (fname) {
    return fs.existsSync(fname) ? fs.statSync(fname).isDirectory() : false
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
}

module.exports = Utils
