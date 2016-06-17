'use strict';

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _Bot = require('./services/Bot');

var _Bot2 = _interopRequireDefault(_Bot);

var _Logger = require('./services/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = new _Logger2.default();

if (_cluster2.default.isMaster) {
  logger.debug('MASTER');
  for (var i = 0; i < _os2.default.cpus().length; i++) {
    _cluster2.default.fork({ shardID: i, shardCount: _os2.default.cpus().length });
  }
} else {
  logger.debug('WORKER ' + process.env.shardID);
  var Tatsumaki = new _Bot2.default({
    shardID: process.env.shardID,
    shardCount: process.env.shardCount
  });
  Tatsumaki.run();

  module.exports = Tatsumaki;
}
//# sourceMappingURL=index.js.map
