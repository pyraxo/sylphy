const { Collection, Terminal } = require('../util')

/**
 * Logs information to the console
 * @arg {Array} logLevels The logging levels of the logger
 */
class Logger extends Collection {
  /**
   * Creates a new Logger instance
   * @arg {Object} [options] Logger options
   * @arg {String} [options.loggerPrefix] Option for a prefix before logging
   * @arg {Boolean} [options.suppressWarnings=false] Option to suppress warnings
   * @arg {Boolean} [options.timestamps=true] Option to show timestamps
   * @arg {Array} [options.logLevels] Array of logging levels
   */
  constructor (client, options = {}) {
    super()
    this._client = client
    this.register('console', Terminal, options)

    this.logLevels = options.levels || ['log', 'info', 'warn', 'error', 'debug']
    this.logLevels.forEach(this.addLevel.bind(this))
  }

  /**
   * Adds a logging level
   * @arg {String} level Logging level
   * @returns {Logger}
   */
  addLevel (level) {
    this[level] = (...args) => this.forEach(logger => (logger[level] || logger.log).bind(logger)(...args))
    return this
  }

  /**
   * Registers a new logger transport
   * @arg {String} name Name of the logger transport
   * @arg {Object|Function} transport The logger transport
   * @arg {Object} [options] Options to supply the transport with
   */
  register (name, Transport, options) {
    this.set(name, typeof Transport === 'function' ? new Transport(options) : Transport)
    return this
  }

  /**
   * Unregisters a logger transport
   * @arg {String} name Name of the logger transport to unregister
   * @returns {Logger}
   */
  unregister (name) {
    this.delete(name)
    return this
  }
}

module.exports = Logger
