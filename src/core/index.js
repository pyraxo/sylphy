module.exports = {
  Bridge: require('./Bridge'),
  Commander: require('./Commander'),
  Interpreter: require('./Interpreter'),
  Logger: require('./Logger'),
  Router: require('./Router')
}

module.exports = [
  'Bridge',
  'Commander',
  'Interpreter',
  'Logger',
  'Router'
].reduce((p, c) => ({
  ...p, [p]: require(c)
}))
