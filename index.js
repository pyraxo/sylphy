global.Promise = require('bluebird')

const util = require('util')
const chalk = require('chalk')
const path = require('path')
const moment = require('moment')
const winston = require('winston')

require('longjohn')
require('winston-daily-rotate-file')
require('dotenv-safe').config({
  path: path.join(__dirname, '.env'),
  allowEmptyValues: true
})

winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
  level: process.env.CLIENT_DEBUG === 'true' ? 'silly' : 'verbose',
  colorize: true,
  label: process.env.SHARD_ID ? `SHARD ${process.env.SHARD_ID}` : 'MASTER',
  timestamp: function () {
    return moment().format('YYYY-MM-DD hh:mm:ss a')
  }
})
winston.add(winston.transports.DailyRotateFile, {
  level: process.env.CLIENT_DEBUG === 'true' ? 'silly' : 'verbose',
  colorize: false,
  datePattern: '.yyyy-MM-dd',
  filename: path.join(__dirname, 'logs/application.log'),
  prepend: true,
  json: false,
  formatter: function ({ level, message = '', meta = {}, formatter, depth, colorize }) {
    const timestamp = moment().format('YYYY-MM-DD hh:mm:ss a')
    const obj = Object.keys(meta).length
    ? `\n\t${meta.stack ? meta.stack : util.inspect(meta, false, depth || null, colorize)}`
    : ''
    return `${timestamp} ${level.toUpperCase()} ${chalk.stripColor(message)} ${obj}`
  }
})
winston.cli()

require('./src')
