const { Crystal, Logger } = require('../')

const crystal = new Crystal('test/bot.js', 4)
const logger = new Logger()

crystal.on('clusterExit', (pid, id) => {
  logger.debug(`WORKER ${pid} EXITED: Process ${id}`)
})

crystal.createClusters().then(() => {
  logger.info('OK')
}, err => {
  logger.error(err)
})
