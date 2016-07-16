import path from 'path'
import moment from 'moment'
import log from 'bristol'
import chalk from 'chalk'

const logName = path.join(process.cwd(), 'logs', moment().format('YYYY-MM-DD HHmm') + '.json')
log.setSeverities(['panic', 'alert', 'crit', 'error', 'warn', 'notice', 'info', 'debug'])
log.addTarget('file', { file: logName })
.withFormatter('commonInfoModel')

/**
 * Represents the Logger util class
 *
 * @prop {String} name The name of the Logger instance
 */
class Logger {
  /**
   * Creates a Logger instance
   *
   * @arg {String} name The name of the Logger instance
   * @arg {String} bg The name of the background colour according to {@link https://www.npmjs.com/package/chalk chalk}
   * @arg {String} colour The name of the font colour according to {@link https://www.npmjs.com/package/chalk chalk}
   * @returns {Logger} A Logger instance
   */
  constructor (name, bg, colour) {
    this.name = name
    this.bg = bg || 'bgWhite'
    this.colour = colour || 'black'
  }

  /**
   * Logs a message with the logger name
   *
   * @arg {String} text The text that will be logged
   */
  log (text) {
    console.log(`${chalk[this.bg][this.colour](` ${this.name} `)} ${text}`)
    log.notice(text)
  }

  /**
   * Logs a warning
   *
   * @arg {String} text The text that will be logged
   */
  warn (text) {
    console.log(`${chalk.bgYellow.black(' WARN ')} ${text}`)
    log.warn(text)
  }

  /**
   * Logs an error
   *
   * @arg {String} text The text that will be logged
   */
  error (text) {
    console.error(`${chalk.bgRed.black(' ERR ')} ${text}`)
    log.error(text)
  }

  /**
   * Logs a debug message
   *
   * @arg {String} text The text that will be logged
   */
  debug (text) {
    console.log(`${chalk.bgWhite.black(' DEBUG ')} ${text}`)
    log.debug(text)
  }

  /**
   * Logs a message for information
   *
   * @arg {String} text The text that will be logged
   */
  info (text) {
    console.log(`${chalk.bgGreen.black(' INFO ')} ${text}`)
    log.info(text)
  }

  /**
   * Logs a Discord message
   *
   * @arg {Message} msg The text that will be logged
   */
  heard (msg) {
    if (typeof msg === 'object') {
      const cleanMsg = msg.cleanContent.replace(/\n/g, ' ')
      console.log(`${chalk.black.bgCyan(' MSG ')} ${chalk.bold.magenta(msg.channel.guild ? msg.channel.guild.name : '(in PMs)')} > ${chalk.bold.green(msg.author.username)}: ${chalk.bold.blue(cleanMsg)}`)
      log.info(`${msg.channel.guild ? msg.channel.guild.name : '(in PMs)'} > ${msg.author.username}: ${chalk.bold.blue(cleanMsg)}`)
    }
  }
}

module.exports = Logger
