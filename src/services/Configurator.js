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
      _.remove(filenames, n => n.startsWith('.') || n.indexOf('example') > -1 || !n.endsWith('.json'))
      filenames = filenames.map(n => path.join(configPath, n))
      let obj = {}
      async.each(filenames, (filename, cb) => {
        jsonfile.readFile(filename, (err, data) => {
          if (err) return cb(err)
          const file = path.basename(filename, '.json')
          obj[file] = {}
          Object.keys(data).forEach(key => obj[file][key] = data[key])
          return cb(null)
        })
      }, err => {
        if (err) return cb(err)
        return cb(null, obj)
      })
    }
  ], (err, result) => {
    if (err) {
      logger.error('Unable to load config files: ' + err)
      return
    }
    return callback(result)
  })
}

module.exports = {
  get: fetchConfigs
}
