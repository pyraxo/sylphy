'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tcpPing = require('tcp-ping');

var _tcpPing2 = _interopRequireDefault(_tcpPing);

var _BaseCommand2 = require('../.Base/BaseCommand');

var _BaseCommand3 = _interopRequireDefault(_BaseCommand2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Ping = function (_BaseCommand) {
  _inherits(Ping, _BaseCommand);

  function Ping() {
    _classCallCheck(this, Ping);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Ping).apply(this, arguments));
  }

  _createClass(Ping, [{
    key: 'handle',
    value: function handle(args) {
      var _this2 = this;

      if (args[0]) {
        this.reply('🔍  Pinging **' + args[0] + '**').then(function (msg) {
          _tcpPing2.default.ping({
            address: args[0]
          }, function (err, data) {
            if (err || !data.avg) {
              _this2.client.updateMessage(msg, '❎  Pinging failed! ' + ('**' + (err || 'Connection not found!') + '**'));
              return;
            }
            _this2.client.updateMessage(msg, ['✅  Pinged **' + args[0] + '**', '```xl', 'address: ' + args[0], 'port: 80', 'attempts: 10', 'avg: ' + data.avg.toPrecision(3) + ' ms', 'max: ' + data.max.toPrecision(3) + ' ms', 'min: ' + data.min.toPrecision(3) + ' ms', '```'].join('\n'));
          });
        });
      } else {
        this.reply('ℹ  Pong!').then(function (m) {
          _this2.client.updateMessage(m, m.content + '  |  Time taken: **' + (m.timestamp - _this2.message.timestamp) + 'ms**');
        });
      }
    }
  }, {
    key: 'name',
    get: function get() {
      return 'ping';
    }
  }, {
    key: 'description',
    get: function get() {
      return 'Pong!';
    }
  }, {
    key: 'usage',
    get: function get() {
      return '[hostname]';
    }
  }]);

  return Ping;
}(_BaseCommand3.default);

module.exports = Ping;
//# sourceMappingURL=ping.js.map
