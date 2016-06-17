'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _BaseCommand2 = require('../.Base/BaseCommand');

var _BaseCommand3 = _interopRequireDefault(_BaseCommand2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Help = function (_BaseCommand) {
  _inherits(Help, _BaseCommand);

  function Help() {
    _classCallCheck(this, Help);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Help).apply(this, arguments));
  }

  _createClass(Help, [{
    key: 'handle',
    value: function handle(args) {
      var _this2 = this;

      if (args[0]) {
        var answered = false;
        for (var mod in this.bot.plugins) {
          var _loop = function _loop(_command) {
            _command = _this2.bot.plugins[mod][_command];
            if (_command.hidden === true) return 'continue';
            if (_command.name === args[0]) {
              if (typeof _command.gif === 'string') {
                (function () {
                  var imgPath = _path2.default.join(_this2.bot.dbPath, 'gif', _command.gif);
                  _fs2.default.access(imgPath, _fs2.default.F_OK, function (err) {
                    if (err) {
                      _this2.bot.error('Gif not found: ' + imgPath);
                      return;
                    }
                    _this2.client.sendFile(_this2.message, imgPath, _command.gif, ['**' + _this2.bot.config.prefix + _command.name + '** ' + (_command.usage ? '`' + _command.usage + '`' : ''), _command.description, _command.cooldown ? '**Cooldown**: ' + _command.cooldown + ' seconds' : '']);
                    answered = true;
                  });
                })();
              } else {
                _this2.reply(['**' + _this2.bot.config.prefix + _command.name + '** ' + (_command.usage ? '`' + _command.usage + '`' : ''), _command.description, _command.cooldown ? '**Cooldown**: ' + _command.cooldown + ' seconds' : ''].join('\n'));
                answered = true;
              }
            }
            command = _command;
          };

          for (var command in this.bot.plugins[mod]) {
            var _ret = _loop(command);

            if (_ret === 'continue') continue;
          }
        }
        if (answered === false) {
          this.client.sendMessage(this.message, 'Command `' + args[0] + '` not found. Aliases aren\'t allowed.');
        }
      } else {
        var arr = ['__**Commands List**__\n', '*Don\'t include the example brackets when using commands!*\n', 'Use `' + this.bot.config.prefix + 'help <command name>` to get more info on a specific command.', 'For example: `' + this.bot.config.prefix + 'help rank`\n'];

        for (var _mod in this.bot.plugins) {
          if (Object.keys(this.bot.plugins[_mod]) === 0) continue;
          var reply = ['**' + _mod + ' - **'];
          for (var _command2 in this.bot.plugins[_mod]) {
            _command2 = this.bot.plugins[_mod][_command2];
            if (_command2.hidden === true) continue;
            reply.push('`' + _command2.name + '` ');
          }
          arr.push(reply.join(''));
        }

        this.reply(arr.join('\n'));
      }
    }
  }, {
    key: 'name',
    get: function get() {
      return 'help';
    }
  }, {
    key: 'description',
    get: function get() {
      return 'Displays a list of commands. Provide a command to get its info';
    }
  }, {
    key: 'usage',
    get: function get() {
      return '[command]';
    }
  }, {
    key: 'aliases',
    get: function get() {
      return ['commands'];
    }
  }]);

  return Help;
}(_BaseCommand3.default);

module.exports = Help;
//# sourceMappingURL=help.js.map
