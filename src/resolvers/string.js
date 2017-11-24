module.exports = {
  type: 'string',
  resolve: (content, { choices = [], categories = [], max = Infinity, min = 0, optional = false }) => {
    if (typeof content === 'undefined') {
      if (!optional) {
        return Promise.reject('string.NOT_STRING')
      }
      return Promise.resolve(content)
    }
    const num = content.length
    if (num > max) {
      return Promise.reject('string.MAX')
    }
    if (num < min) {
      return Promise.reject('string.MIN')
    }
    if (choices.length && !choices.includes(content)) {
      return Promise.reject({
        message: 'string.ONE_OF',
        choices: choices.map(c => '`' + c + '`').join(', ')
      })
    }
    if (categories.length) {
      for (const [ cat, choice ] of Object.entries(categories)) {
        if (choice.includes(content)) return Promise.resolve(cat)
      }
      return Promise.reject({
        message: 'string.ONE_OF',
        choices: Object.keys(categories).map(c => '`' + c + '`').join(', ')
      })
    }
    return Promise.resolve(content)
  }
}
