const { Mixin } = require('../../util/Mixins')

module.exports = Mixin(superclass => class extends superclass {
  verifyAdmin () {
    return Object.keys(process.env.ADMIN_IDS.split(', ')) > -1
  }

  verifyPermissions (permissionID) {

  }
})
