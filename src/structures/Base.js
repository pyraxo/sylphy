let Promise
try {
  Promise = require('bluebird')
} catch (err) {
  Promise = global.Promise
}

const { delay: promDelay } = require('../util')

/**
 * Built-in base helper class
 * @abstract
 * @prop {?Logger} logger Logger instance
 * @prop {?Interpreter} i18n Interpreter instance
 */
class Base {
  /**
   * Creates a new Base instance
   * @arg {Client} client Client instance
   */
  constructor (client) {
    this._client = client
    this.logger = client.logger
    this.i18n = client.plugins.get('i18n')
  }

  /**
   * Checks if a user has certain permissions in a channel
   * @arg {external:"Eris.GuildChannel"} channel The channel to check in
   * @arg {external:"Eris.User"} user The user to check
   * @arg {...String} perms The permission(s) to check
   * @returns {Boolean}
   */
  hasPermissions (channel, user, ...perms) {
    const member = channel.guild.members.get(user.id);
    for (const perm of perms) {
      if (!member.permission.has(perm)) return false;
    }
    return true;
  }

  /**
   * Parses a string for localisation
   * @arg {String} content The string to parse
   * @arg {String} [lang='en'] The locale name
   * @arg {Object} [tags] Additional interpolation tags
   */
  t (content = '', lang = 'en', tags = {}) {
    if (!this.i18n) return content
    const file = this.name ? this.name.split(':')[0] : (this.labels ? this.labels[0] : 'common')
    return this.i18n.parse(content, this.localeKey || file || null, lang, tags)
  }

  /**
   * Sends a message to a channel
   * @arg {external:"Eris.GuildChannel"} channel The channel to send the message in
   * @arg {String} content The string to send
   * @arg {Object} [options] Message options
   * @arg {String} [options.lang] Message locale
   * @arg {Number} [options.delay=0] Delay to send the message, set to 0 for no delay
   * @arg {Number} [options.deleteDelay=0] Delay to delete the message after it's sent, set to 0 for no deletion
   * @arg {Object} [options.file] A file object
   * @arg {String} [options.file.name] Name of file
   * @arg {Buffer} [options.file.file] Buffer containing file data
   * @arg {Object} [options.embed] Embed object, see {@link https://discordapp.com/developers/docs/resources/channel#embed-object|official Discord API documentation}
   * @returns {Promise.<external:"Eris.Message"|null>}
   */
  async send (chan, content, options = {}) {
    const channel = typeof chan === 'string' ? this._client.getChannel(chan) : chan
    if (!channel) {
      const err = new Error(`Could not send message: Invalid channel - ${chan}`)
      if (this.logger) {
        this.logger.error(err)
        return
      } else {
        throw err
      }
    }

    let { file = null, lang, delay = 0, deleteDelay = 0, embed } = options
    if (channel.guild && !this.hasPermissions(channel, this._client.user, 'sendMessages')) {
      const err = new Error('Could not send message: Insufficient permissions')
      if (this.logger) {
        this.logger.error(err)
        return
      } else {
        throw err
      }
    }

    if (delay) await promDelay(delay)

    if (Array.isArray(content)) content = content.join('\n')
    if (this.i18n) content = this.t(content, lang, options)
    content = content.match(/(.|[\r\n]){1,2000}/g)

    try {
      if (!content || !content.length) {
        const msg = await channel.createMessage({ embed, content: '' }, file)
        return deleteDelay ? promDelay(deleteDelay).then(() => msg.delete()) : msg
      }

      let msg
      for (const c of content) {
        const firstMsg = await channel.createMessage(!msg ? { embed, content: c } : c, !msg ? file : null)
        .then(msg => deleteDelay ? promDelay(deleteDelay).then(() => msg.delete()) : msg)
        msg = firstMsg
      }

      return msg
    } catch (err) {
      if (this.logger) {
        this.logger.error('Could not send message -', err)
      } else {
        throw err
      }
    }
  }

  /**
   * Edits a message with updated content
   * @arg {external:"Eris.Message"} message The message to edit
   * @arg {String} content The content to edit the message with
   * @arg {Object} [options] Options object
   * @arg {String} [options.lang] Locale of content
   * @arg {Number} [options.delay] Delay to edit the message
   * @returns {Promise}
   */
  edit (msg, content, options) {
    const { lang, delay = 0 } = options

    if (Array.isArray(content)) content = content.join('\n')
    if (this.i18n) content = this.t(content, lang, options)

    return (delay ? promDelay(delay) : Promise.resolve()).then(() => msg.edit(content))
  }

  /**
   * Deletes multiple messages if there are sufficient permissions
   * @arg {...external:"Eris.Message"} messages The messages to delete
   * @returns {Promise}
   */
  deleteMessages (...msgs) {
    const id = this._client.user.id
    return Promise.all(msgs.reduce((arr, msg) => {
      if (!msg || !msg.channel.guild) return arr
      if (msg.author.id === id || this.hasPermissions(msg.channel, msg.member, 'manageMessages')) {
        arr.push(msg.delete())
      }
      return arr
    }, []))
  }
}

module.exports = Base
