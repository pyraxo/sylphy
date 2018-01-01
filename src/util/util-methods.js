const path = require('path')

/**
 * Checks if path supplied is a directory.
 * @param {string} fpath - Path to check
 */
const isDir = (fpath) => {
  return fs.existsSync(fpath) ? fs.statSync(fpath).isDirectory() : false
}

/**
 * Gets the absolute path of a supplied path.
 * @param {string} fpath - Path to get
 */
const getAbsolute = (fpath) => path.isAbsolute(fpath) ? fpath : path.join(process.cwd(), fpath)

/**
 * Unloads a filepath from the require cache.
 * @param {string} filepath - Relative/absolute path
 */
const unload = (filepath) => {
  const str = getAbsolute(filepath)
  Object.keys(require.cache).forEach(file => {
    if (str === file || file.startsWith(str)) {
      delete require.cache[require.resolve(file)]
    }
  })
}

/**
 * Pads a string on its left if it's shorter than the padding length.
 * @arg {string} [string=''] - String to pad
 * @arg {number} [length=0] - Padding length
 * @arg {string} [chars=' '] - String used as padding
 */
const padStart = (string = '', len = 0, chars = ' ') => {
  const str = String(string)
  const pad = String(chars)
  return str.length >= len ? '' + str : (pad.repeat(len) + str).slice(-len)
}

/**
 * Pads a string on its right if it's shorter than the padding length.
 * @arg {string} [string=''] - String to pad
 * @arg {number} [length=0] - Padding length
 * @arg {string} [chars=' '] - String used as padding
 */
const padEnd = (string = '', len = 0, chars = ' ') => {
  const str = String(string)
  const pad = String(chars)
  return str.length >= len ? '' + str : str + pad.repeat(len - str.length)
}

/**
 * Format a number to group the thousands.
 * @arg {number} num - Number to Format
 * @returns {string}
 */
const groupThousands = (num) => String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

/**
 * Returns a delayed Promise.
 * @arg {number} time - Time to delay
 * @returns {Promise}
 */
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time))

 /**
 * Reads a directory recursively and returns an array of paths.
 * @arg {string} dir - Directory path
 * @arg {Function} func - Additional function to be done on paths
 * @returns {Array}
 */
const readdirRecursive = (dir, func) => fs.readdirSync(dir).reduce((arr, file) => {
  if (file.startsWith('.')) return arr
  const filepath = path.join(dir, file)
  return arr.concat(isDir(filepath) ? readdirRecursive(filepath) : (func ? func(filepath) : filepath))
}, [])

/**
 * Reads a directory recursively and returns an object mapping the paths' basenames
 * to the paths it contains (if directory) or its full path.
 * @arg {string} dir - Directory path
 * @arg {Function} func - Additional function to be done on paths
 * @returns {Object}
 */
const readdirRecursiveObject = (dir, func) => fs.readdirSync(dir).reduce((obj, file) => {
  if (file.startsWith('.')) return obj
  const filepath = path.join(dir, file)
  return {
    ...obj,
    [file.substring(
      0, path.basename(filepath, path.extname(filepath)).length
    )]: isDir(filepath) ? readdirRecursiveObject(filepath) : func(filepath)
  }
}, {})

module.exports = {
  unload,
  isDir,
  getAbsolute,
  padStart,
  padEnd,
  groupThousands,
  delay,
  readdirRecursive,
  requireAll
}