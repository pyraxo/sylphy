const fs = require('fs')
const path = require('path')

const padEnd = (v, n = 0, c = ' ') => String(v).length >= n ? '' + v : String(v) + String(c).repeat(n - String(v).length)
const padStart = (v, n = 0, c = ' ') => String(v).length >= n ? '' + v : (String(c).repeat(n) + v).slice(-n)

async function readdirRecursive (dir) {
  let list = []
  let files = fs.readdirSync(dir)
  let dirs

  function isDir (fname) {
    return fs.existsSync(path.join(dir, fname)) ? fs.statSync(path.join(dir, fname)).isDirectory() : false
  }

  dirs = files.filter(isDir)
  files = files.filter(file => !isDir(file)).map(file => path.join(dir, file))
  list = list.concat(files)

  while (dirs.length) {
    let d = path.join(dir, dirs.shift())
    list = list.concat(await readdirRecursive(d))
  }

  return list
}

module.exports = {
  padEnd,
  padStart,
  readdirRecursive,
  Collection: require('./Collection'),
  Localisation: require('./Localisation'),
  Parser: require('./Parser'),
  Emojis: require('./Emojis'),
  LocalCache: require('./LocalCache')
}
