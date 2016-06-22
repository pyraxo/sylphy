import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import async from 'async'

import Logger from '../services/Logger'

module.exports = function AviGoRound (client, bot) {
  if (bot.shardID > 0) return
  const logger = new Logger('AvatarSwitcher')
  let avatars = []
  async.waterfall([
    cb => {
      fs.readdir(path.join(bot.dbPath, 'avatars'), (err, files) => {
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
        fs.readFile(path.join(bot.dbPath, 'avatars', file), (err, data) => {
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
    setInterval(() => {
      logger.info('Changing avatar')
      client.editSelf({avatar: `data:image/png;base64,${_.sample(avatars)}`})
      .catch(err => logger.error(err))
    }, 900000)
  })
}
