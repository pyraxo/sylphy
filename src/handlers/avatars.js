import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import async from 'async'

import Logger from '../services/Logger'
const logger = new Logger('AVATAR', 'green')

module.exports = function randomAvatar () {
  if (this.shardID > 0) return
  let avatars = []
  async.waterfall([
    cb => {
      fs.readdir(path.join(this.dbPath, 'avatars'), (err, files) => {
        if (err) return cb(err)
        if (files.length === 0) return cb(new Error('No files found'))
        logger.info(`Found: ${files.join(', ')}`)
        return cb(null, files)
      })
    },
    (files, done) => {
      async.each(files, (file, cb) => {
        if (file.startsWith('.')) return cb()
        if (path.extname(file) !== '.png') return cb()
        fs.readFile(path.join(this.dbPath, 'avatars', file), (err, data) => {
          if (err) return cb(err)
          logger.info(`Loaded: ${file}`)
          avatars.push(new Buffer(data).toString('base64'))
          return cb()
        })
      }, err => done(err))
    }
  ], err => {
    if (err) {
      logger.error(err)
      return
    }
    if (avatars.length === 0) {
      logger.error(new Error('No avatars found'))
      return
    }
    this.on('loaded.discord', () => {
      setInterval(() => {
        logger.log('Changing avatar')
        this.client.editSelf({avatar: `data:image/png;base64,${_.sample(avatars)}`})
        .catch(err => logger.error(err))
      }, 900000)
    })
  })
}
