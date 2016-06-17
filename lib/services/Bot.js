'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _discord = require('discord.js');

var _events = require('events');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _requireAll = require('require-all');

var _requireAll2 = _interopRequireDefault(_requireAll);

var _clearRequire = require('clear-require');

var _clearRequire2 = _interopRequireDefault(_clearRequire);

var _Logger = require('./Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _Configurator = require('./Configurator');

var _Configurator2 = _interopRequireDefault(_Configurator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Bot = function (_EventEmitter) {
  _inherits(Bot, _EventEmitter);

  function Bot(options) {
    _classCallCheck(this, Bot);

    options = options || {};

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Bot).call(this));

    _this.logger = new _Logger2.default('BOT');
    _this.configPath = options.configPath || _path2.default.join(process.cwd(), 'config');
    _this.pluginsPath = options.pluginsPath || _path2.default.join(process.cwd(), 'lib/plugins');
    _this.dbPath = options.dbPath || _path2.default.join(process.cwd(), 'db');
    _this.shardID = options.shardID || 0;
    _this.shardCount = options.shardCount || 1;

    _this.once('loaded:configs', function () {
      return _this.login();
    });
    _this.once('loaded:discord', function () {
      return _this.attachPlugins();
    });
    _this.on('loaded:plugins', function () {
      return _this.runPlugins();
    });
    _this.on('clear:plugins', function () {
      return _this.attachPlugins();
    });
    return _this;
  }

  _createClass(Bot, [{
    key: 'run',
    value: function run() {
      var _this2 = this;

      _Configurator2.default.get(this.configPath, function (results) {
        _this2.config = results;
        _this2.emit('loaded:configs');
      });
    }
  }, {
    key: 'login',
    value: function login() {
      var _this3 = this;

      if (typeof this.config.token === 'undefined') {
        throw new Error('Unable to resolve Discord token');
      }

      var client = new _discord.Client({
        maxCachedMessages: 10,
        forceFetchUsers: true,
        disableEveryone: true,
        shardId: this.shardID,
        shardCount: this.shardCount
      });

      client.on('ready', function () {
        _this3.emit('loaded:discord');
        _this3.logger.info(_chalk2.default.red.bold('iris') + ' is ready! Logging in as ' + _chalk2.default.cyan.bold(client.user.name));
        _this3.logger.info('Listening to ' + _chalk2.default.magenta.bold(client.channels.length) + ' channels, on ' + _chalk2.default.green.bold(client.servers.length) + ' servers');
      });

      client.on('message', function (msg) {
        if (msg.content.startsWith(_this3.config.prefix)) {
          _this3.logger.heard(msg);
          var trigger = msg.content.toLowerCase().split(' ')[0].substring(_this3.config.prefix.length);
          var args = msg.content.toLowerCase().split(' ').splice(1);
          _this3.emit(trigger, args, msg, client);
        }
      });

      client.loginWithToken(this.config.token);
      this.client = client;
    }
  }, {
    key: 'attachPlugins',
    value: function attachPlugins() {
      this.plugins = (0, _requireAll2.default)(this.pluginsPath);
      this.emit('loaded:plugins');
    }
  }, {
    key: 'runPlugins',
    value: function runPlugins() {
      for (var mod in this.plugins) {
        for (var command in this.plugins[mod]) {
          this.plugins[mod][command] = new this.plugins[mod][command]();
        }
      }
    }
  }, {
    key: 'reloadPlugins',
    value: function reloadPlugins() {
      Object.keys(require.cache).forEach(function (key) {
        if (key.startsWith(_path2.default.join(process.cwd(), 'plugins'))) (0, _clearRequire2.default)(key);
      });
      this.emit('clear:plugins');
      this.attachPlugins();
    }
  }]);

  return Bot;
}(_events.EventEmitter);

module.exports = Bot;
//# sourceMappingURL=Bot.js.map
