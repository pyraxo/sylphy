const path = require('path')
const { Module, Collection, readdirRecursive } = require('../core')

class ImageCache extends Module {
  constructor (...args) {
    super(...args, {
      name: 'images',
      events: {
        ready: 'cacheImages'
      }
    })

    this.cache = new Collection()
  }

  async cacheImages () {
    let images = await readdirRecursive(path.join(this.bot.paths.resources, 'images'))
    images.map(image => ({ name: path.basename(image).split('.')[0], image }))
    .forEach(i => this.cache.set(i.name, i.image))
  }
}

module.exports = ImageCache
