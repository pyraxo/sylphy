'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Tatsumaki = require('../../');

var BaseCommand = function () {
  function BaseCommand() {
    var _this = this;

    _classCallCheck(this, BaseCommand);

    if (this.constructor === BaseCommand) {
      throw new Error('Can\'t instantiate abstract command!');
    }
    this.bot = Tatsumaki;
    this.logger = Tatsumaki.logger;
    this.bot.on(this.name, function (args, msg, client) {
      if (msg.channel.isPrivate && _this.noPMs === true) {
        _this.send(msg, 'You can\'t use this command in a DM!');
        return;
      }
      _this.message = msg;
      _this.client = client;
      _this.handle(args);
    });
    this.aliases.forEach(function (a) {
      return _this.bot.on(a, function (s, m, c) {
        return _this.handle(s, m, c);
      });
    });
  }

  _createClass(BaseCommand, [{
    key: 'handle',
    value: function handle(args) {}
  }, {
    key: 'send',
    value: function send(dest, content) {
      var _this2 = this;

      var options = arguments.length <= 2 || arguments[2] === undefined ? { delay: 0, deleteDelay: 0 } : arguments[2];
      var delay = options.delay;
      var deleteDelay = options.deleteDelay;

      if (content.length > 20000) {
        this.logger.error('Error sending a message larger than the character and rate limit\n' + content);
        return;
      }

      if (delay) {
        return setTimeout(function () {
          _this2.client.sendMessage(dest, content, { delay: 0, deleteDelay: deleteDelay });
        }, delay);
      }

      var msgRem = '';
      if (content.length > 2000) {
        content = content.match(/.{1,20000}/g);
        msgRem = content.shift();
        content = content.join('');
      }

      return new Promise(function (res, rej) {
        _this2.client.sendMessage(dest, content).then(function (msg) {
          if (deleteDelay) {
            _this2.client.sendMessage(msg, { wait: deleteDelay }).then(function () {
              if (!msgRem) res(msg);
            }).catch(function (err) {
              return rej(err);
            });

            if (!msgRem) return;
          }

          if (msgRem) {
            return _this2.send(dest, msgRem, options).then(function (msg) {
              return res(Array.isArray(msg) ? msg.concat(msg) : [msg]);
            }).catch(rej);
          }

          res(msg);
        }).catch(function (err) {
          return rej(err);
        });
      });
    }
  }, {
    key: 'reply',
    value: function reply(content) {
      var _this3 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? { delay: 0, deleteDelay: 0 } : arguments[1];

      return new Promise(function (res, rej) {
        _this3.send(_this3.message, content, options).then(res).catch(rej);
      });
    }
  }, {
    key: 'name',
    get: function get() {
      throw new Error('Names must be overwritten');
    }
  }, {
    key: 'description',
    get: function get() {
      throw new Error('Description must be overwritten');
    }
  }, {
    key: 'aliases',
    get: function get() {
      return [];
    }
  }, {
    key: 'usage',
    get: function get() {
      return '';
    }
  }, {
    key: 'cooldown',
    get: function get() {
      return 0;
    }
  }, {
    key: 'permissions',
    get: function get() {
      return [];
    }
  }, {
    key: 'hidden',
    get: function get() {
      return false;
    }
  }, {
    key: 'gif',
    get: function get() {
      return null;
    }
  }, {
    key: 'noPMs',
    get: function get() {
      return false;
    }
  }]);

  return BaseCommand;
}();

module.exports = BaseCommand;
//# sourceMappingURL=BaseCommand.js.map
