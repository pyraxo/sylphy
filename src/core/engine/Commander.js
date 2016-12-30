const path = require('path')
const fs = require('fs')

const { requireAll, isDir, Collection } = require('../../util')

/**
 * Commander class for command processing
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
  }

  /**
   * Registers commands
   * @arg {String|Object|Array} commands An object, array or relative path to a folder or file to load commands from
   * @returns {Client}
   */
  register (commands) {
    switch (typeof commands) {
      case 'string': {
        const filepath = path.join(process.cwd(), commands)
        if (!fs.existsSync(filepath)) {
          throw new Error(`Folder path ${filepath} does not exist`)
        }
        const cmds = isDir(filepath) ? requireAll(filepath) : require(filepath)
        this._cached.push(filepath)
        return this.register(cmds)
      }
      case 'object': {
        if (Array.isArray(commands)) {
          for (const command of commands) {
            this.commands.attach(command)
          }
          return this
        }
        for (const group in commands) {
          this.commands.attach(commands[group], group)
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
   * @returns {Commander}
   */
  attach (Command, group) {
    let command = typeof Command === 'function' ? new Command(this._client) : command
    if (!command.triggers) {
      this._client.throwOrEmit('commander:error', new Error(`Invalid command - ${command}`))
      return this
    }
    for (const trigger of command.triggers) {
      if (this.has(trigger)) {
        this._client.throwOrEmit('commander:error', new Error(`Duplicate command - ${trigger}`))
        return this
      }
      command.group = command.group || group
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
     */
    this._client.emit('commander:registered', {
      trigger: command.triggers[0],
      group: command.group,
      aliases: command.triggers.length - 1
    })
    return this
  }

  /**
   * Unregisters a command group or trigger
   * @arg {?String} group The command group
   * @arg {String} [trigger] The command trigger
   * @returns {Commander}
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
   * @returns {Commander}
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
   * @arg {String} [group='*] The command group to be ejected
   * @arg {String} [trigger] The command trigger in the group
   * @returns {Commander}
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
   * @returns {Client}
   */
  reload () {
    for (const filepath of this._cached) {
      this._client.unload(filepath)
      this._cached.shift()
      this.register(filepath)
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
