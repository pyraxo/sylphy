import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import async from 'async'
import jsonfile from 'jsonfile'

import Logger from './Logger'

const logger = new Logger()

function fetchConfigs (configPath, callback) {
  async.waterfall([
    cb => {
      fs.readdir(configPath, (err, filenames) => {
        if (err) return cb(err)
        return cb(null, filenames)
      })
    },
    (filenames, cb) => {
      _.remove(filenames, n => n.startsWith('.') || n.indexOf('example') > -1)
      filenames = filenames.map(n => path.join(configPath, n))
      async.map(filenames, jsonfile.readFile, (err, results) => {
        if (err) return cb(err)
        return cb(null, results, filenames)
      })
    }
  ], (err, results, names) => {
    if (err) {
      logger.error('Unable to load config files: ' + err)
      return
    }
    let reply = {}
    names.forEach(n => logger.info(`Loaded config: ${n}`))
    results.forEach(obj => Object.keys(obj).forEach((key) => reply[key] = obj[key]))
    return callback(reply)
  })
}

module.exports = {
  get: fetchConfigs
}
