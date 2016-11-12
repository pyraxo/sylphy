const padEnd = (v, n = 0, c = ' ') => String(v).length >= n ? '' + v : String(v) + String(c).repeat(n - String(v).length)
const padStart = (v, n = 0, c = ' ') => String(v).length >= n ? '' + v : (String(c).repeat(n) + v).slice(-n)

module.exports = {
  Collection: require('./Collection'),
  Localisation: require('./Localisation'),
  Parser: require('./Parser'),
  Emojis: require('./Emojis'),
  padEnd,
  padStart
}
