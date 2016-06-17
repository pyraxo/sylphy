'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _bristol = require('bristol');

var _bristol2 = _interopRequireDefault(_bristol);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_bristol2.default.setSeverities(['panic', 'alert', 'crit', 'error', 'warn', 'notice', 'info', 'debug']);
_bristol2.default.addTarget('file', { file: _path2.default.join(process.cwd(), 'logs', (0, _moment2.default)().format('YYYY-MM-DD HHmm') + '.json') }).withFormatter('commonInfoModel');

var Logger = function () {
  function Logger(name, bg, colour) {
    _classCallCheck(this, Logger);

    this.name = name;
    this.bg = bg || 'bgWhite';
    this.colour = colour || 'black';
  }

  _createClass(Logger, [{
    key: 'log',
    value: function log(text) {
      console.log(_chalk2.default[this.bg][this.colour](' ' + this.name + ' ') + ' ' + text);
      _bristol2.default.notice(text);
    }
  }, {
    key: 'warn',
    value: function warn(text) {
      console.log(_chalk2.default.bgYellow.black(' WARN ') + ' ' + text);
      _bristol2.default.warn(text);
    }
  }, {
    key: 'error',
    value: function error(text) {
      console.error(_chalk2.default.bgRed.black(' ERR ') + ' ' + text);
      _bristol2.default.error(text);
    }
  }, {
    key: 'debug',
    value: function debug(text) {
      console.log(_chalk2.default.bgWhite.black(' DEBUG ') + ' ' + text);
      _bristol2.default.debug(text);
    }
  }, {
    key: 'info',
    value: function info(text) {
      console.log(_chalk2.default.bgGreen.black(' INFO ') + ' ' + text);
      _bristol2.default.info(text);
    }
  }, {
    key: 'heard',
    value: function heard(msg) {
      if ((typeof msg === 'undefined' ? 'undefined' : _typeof(msg)) === 'object') {
        console.log(_chalk2.default.black.bgCyan(' MSG ') + ' ' + _chalk2.default.bold.magenta(msg.channel.isPrivate ? '(in PMs)' : msg.server.name) + ' > ' + _chalk2.default.bold.green(msg.author.name) + ': ' + _chalk2.default.bold.blue(msg.cleanContent.replace(/\n/g, ' ')));
        _bristol2.default.info((msg.channel.isPrivate ? 'DMs' : msg.server.name) + ' > ' + msg.author.name + ': ' + msg.cleanContent.replace(/\n/g, ' '));
      }
    }
  }]);

  return Logger;
}();

module.exports = Logger;
//# sourceMappingURL=Logger.js.map
