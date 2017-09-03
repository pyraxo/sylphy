const path = require('path')
const fs = require('fs')
const util = require('util')

const { requireAll, isDir, Collection } = require('../util')

/**
 * Commander class for command processing
 * @prop {Set} prefixes Set of added prefixes
 */
class Commander extends Collection {
  /**
   * Creates a new Commander instance
   * @arg {Client} client Client instance
   */
  constructor (client) {
    super()
    this._client = client
    this._cached = []

    this.prefixes = new Set()
    this.prefixes.add(client.prefix)
  }

  /**
   * Registers commands
   * @arg {String|Object|Array} commands An object, array or relative path to a folder or file to load commands from
   * @arg {Object} [options] Additional command options
   * @arg {String} [options.prefix] Command prefix, will be overwritten by prefix setting in the command
   * @arg {Boolean} [options.groupedCommands] Option for object/path supplied to be an object of objects with command groups as keys
   */
  register (commands, options = {}) {
    switch (typeof commands) {
      case 'string': {
        const filepath = path.join(process.cwd(), commands)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        const cmds = isDir(filepath) ? requireAll(filepath) : require(filepath)
        this._cached.push([commands, options])
        return this.register(cmds, options)
      }
      case 'object': {
        if (options.prefix) {
          this.prefixes.add(options.prefix)
        }
        if (Array.isArray(commands)) {
          for (const command of commands) {
            this.attach(command, null, options.prefix)
          }
          return this
        }
        for (const group in commands) {
          const command = commands[group]
          if (options.groupedCommands && typeof command === 'object') {
            for (const name in command) {
              this.attach(command[name], group, options.prefix)
            }
            continue
          }
          this.attach(command, group, options.prefix)
        }
        return this
      }
      default: {
        throw new Error('Path supplied is not an object or string')
      }
    }
  }

  /**
   * Class, object or function that can be utilised as a command
   * @typedef {(Object|function)} AbstractCommand
   * @prop {Array} triggers An array of command triggers, the first is the main trigger while the rest are aliases
   * @prop {String} [group] Command group
   * @prop {function(Container)} execute The command's execution function<br />
   * It should accept a {@link Container} as the first argument
   */

  /**
   * Attaches a command
   * @arg {AbstractCommand} Command Command class, object or function
   * @arg {String} [group] Default command group, will be overwritten by group setting in the command
   * @arg {String} [prefix] Default command prefix, will be overwritten by prefix setting in the command
   */
  attach (Command, group = 'misc', prefix) {
    if (Command instanceof Array) {
      for (const cmd of Command) {
        this.attach(cmd)
      }
      return this
    }
    let command = typeof Command === 'function' ? new Command(this._client) : Command
    if (!command.triggers || !command.triggers.length) {
      this._client.throwOrEmit('commander:error', new Error(`Invalid command - ${util.inspect(command)}`))
      return this
    }
    for (const trigger of command.triggers) {
      if (this.has(trigger)) {
        this._client.throwOrEmit('commander:error', new Error(`Duplicate command - ${trigger}`))
        return this
      }
      command.group = command.group || group
      command.prefix = command.prefix || prefix
      this.set(trigger.toLowerCase(), command)
    }

    /**
     * Fires when a command is registered
     *
     * @event Client#commander:registered
     * @type {Object}
     * @prop {String} trigger Command trigger
     * @prop {String} group Command group
     * @prop {Number} aliases Number of trigger aliases
     * @prop {Number} count Number of loaded command triggers
     */
    this._client.emit('commander:registered', {
      trigger: command.triggers[0],
      group: command.group,
      aliases: command.triggers.length - 1,
      count: this.size
    })
    return this
  }

  /**
   * Unregisters a command group or trigger
   * @arg {?String} group The command group
   * @arg {String} [trigger] The command trigger
   */
  unregister (group, trigger) {
    if (this.group) {
      return this.ejectGroup(group, trigger)
    }
    return this.eject(trigger)
  }

  /**
   * Ejects a command
   * @arg {String} trigger The command trigger
   */
  eject (trigger) {
    const command = this.get(trigger)
    if (command) {
      for (const trigger of command.triggers) {
        this.delete(trigger)
      }

      /**
       * Fires when a command is ejected
       *
       * @event Client#commander:ejected
       * @type {Object}
       * @prop {String} group Command group
       * @prop {Number} aliases Number of trigger aliases
       */
      this._client.emit('commander:ejectedGroup', {
        trigger: command.triggers[0],
        aliases: command.triggers.length - 1
      })
    }
    return this
  }

  /**
   * Ejects a command group
   * @arg {String} [group='*'] The command group to be ejected
   * @arg {String} [trigger] The command trigger in the group
   */
  ejectGroup (group = '*', trig) {
    let count = 0
    for (const [trigger, command] of this.entries()) {
      if (command.group === group || group === '*' && trig === trigger) {
        this.delete(trigger)
        count++
      }
    }

    /**
     * Fires when a command group is ejected
     *
     * @event Client#commander:ejectedGroup
     * @type {Object}
     * @prop {String} group Command group
     * @prop {Number} count Number of ejected commands
     */
    this._client.emit('commander:ejectedGroup', { group, count })
    return this
  }

  /**
   * Reloads command files (only those that have been added from by file path)
   */
  reload () {
    this.clear()
    for (const [filepath, options] of this._cached) {
      this._client.unload(filepath)
      this._cached.shift()
      this.register(filepath, options)
    }
    return this
  }

  /**
   * Executes a command
   * @arg {String} trigger The trigger of the command to be executed
   * @arg {...*} args Arguments to be supplied to the command
   */
  execute (trigger, ...args) {
    const command = this.get(trigger)
    if (!command) return
    try {
      command.execute(...args)
    } catch (err) {
      this._client.throwOrEmit('commander:commandError', err)
    }
  }

  /**
   * Fires when an error occurs in Commander
   *
   * @event Client#commander:error
   * @type {Error}
   */

   /**
   * Fires when an error occurs in a command
   *
   * @event Client#commander:commandError
   * @type {Error}
   */
}

module.exports = Commander
