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
  (function () {
    logger.debug('MASTER');
    var spawnWorker = function spawnWorker() {
      var count = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

      if (count === _os2.default.cpus().length) return;
      var worker = _cluster2.default.fork({ shardID: count, shardCount: _os2.default.cpus().length });
      worker.once('online', function () {
        logger.debug('WORKER ' + worker.process.pid + ': Shard ' + count);
      });
      worker.once('message', function (msg) {
        if (msg === 'loaded:shard') setTimeout(function () {
          return spawnWorker(++count);
        }, 2000);
      });
    };
    spawnWorker();
  })();
} else {
  var Tatsumaki = new _Bot2.default({
    shardID: parseInt(process.env.shardID, 10),
    shardCount: parseInt(process.env.shardCount, 10)
  });
  Tatsumaki.run();

  Tatsumaki.once('loaded:discord', function () {
    return process.send('loaded:shard');
  });

  module.exports = Tatsumaki;
}
//# sourceMappingURL=index.js.map
