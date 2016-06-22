import fs from 'fs'
import path from 'path'
import moment from 'moment'
import log from 'bristol'
import chalk from 'chalk'

const logName = path.join(process.cwd(), 'logs', moment().format('YYYY-MM-DD HHmm') + '.json')
log.setSeverities(['panic', 'alert', 'crit', 'error', 'warn', 'notice', 'info', 'debug'])
log.addTarget('file', { file: logName })
.withFormatter('commonInfoModel')

fs.mkdir(path.join(process.cwd(), 'logs'), err => {
  if (err.code === 'EEXIST') return
})

class Logger {
  constructor (name, bg, colour) {
    this.name = name
    this.bg = bg || 'bgWhite'
    this.colour = colour || 'black'
  }

  log (text) {
    console.log(`${chalk[this.bg][this.colour](` ${this.name} `)} ${text}`)
    log.notice(text)
  }

  warn (text) {
    console.log(`${chalk.bgYellow.black(' WARN ')} ${text}`)
    log.warn(text)
  }

  error (text) {
    console.error(`${chalk.bgRed.black(' ERR ')} ${text}`)
    log.error(text)
  }

  debug (text) {
    console.log(`${chalk.bgWhite.black(' DEBUG ')} ${text}`)
    log.debug(text)
  }

  info (text) {
    console.log(`${chalk.bgGreen.black(' INFO ')} ${text}`)
    log.info(text)
  }

  heard (msg) {
    if (typeof msg === 'object') {
      const cleanMsg = msg.cleanContent.replace(/\n/g, ' ')
      console.log(`${chalk.black.bgCyan(' MSG ')} ${chalk.bold.magenta(msg.channel.id === msg.author.id ? '(in PMs)' : msg.channel.guild.name)} > ${chalk.bold.green(msg.author.username)}: ${chalk.bold.blue(cleanMsg)}`)
      log.info(`${msg.channel.id === msg.author.id ? 'DMs' : msg.channel.guild.name} > ${msg.author.username}: ${chalk.bold.blue(cleanMsg)}`)
    }
  }
}

module.exports = Logger
