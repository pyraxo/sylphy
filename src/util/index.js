module.exports = Object.assign({},
  require('./util-discord'),
  require('./util-methods'),
  {
    permitter: require('./util-perms'),
    Collection: require('./Collection'),
    MessageCollector: require('./MessageCollector')
  }
)