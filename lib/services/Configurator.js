'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _Logger = require('./Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = new _Logger2.default();

function fetchConfigs(configPath, callback) {
  _async2.default.waterfall([function (cb) {
    _fs2.default.readdir(configPath, function (err, filenames) {
      if (err) return cb(err);
      return cb(null, filenames);
    });
  }, function (filenames, cb) {
    _lodash2.default.remove(filenames, function (n) {
      return n.startsWith('.') || n.indexOf('example') > -1;
    });
    filenames = filenames.map(function (n) {
      return _path2.default.join(configPath, n);
    });
    _async2.default.map(filenames, _jsonfile2.default.readFile, function (err, results) {
      if (err) return cb(err);
      return cb(null, results, filenames);
    });
  }], function (err, results, names) {
    if (err) {
      logger.error('Unable to load config files: ' + err);
      return;
    }
    var reply = {};
    // names.forEach(n => logger.info(`Loaded config: ${n}`))
    results.forEach(function (obj) {
      return Object.keys(obj).forEach(function (key) {
        return reply[key] = obj[key];
      });
    });
    return callback(reply);
  });
}

module.exports = {
  get: fetchConfigs
};
//# sourceMappingURL=Configurator.js.map
