import chalk from 'chalk'

class Logger {
  warn (text) {
    console.log(`${chalk.bgYellow.black(' WARN ')} ${text}`)
  }

  error (text) {
    console.error(`${chalk.bgRed.black(' ERR ')} ${text}`)
  }

  debug (text) {
    console.log(`${chalk.bgWhite.black(' DEBUG ')} ${text}`)
  }

  info (text) {
    console.log(`${chalk.bgGreen.black(' INFO ')} ${text}`)
  }

  heard (msg) {
    if (typeof msg === 'object') {
      console.log(`${chalk.bold.magenta(msg.server.name)} > ${chalk.bold.green(msg.author.name)}: ${chalk.bold.blue(msg.cleanContent.replace(/\n/g, ' '))}`)
    }
  }
}

module.exports = Logger
