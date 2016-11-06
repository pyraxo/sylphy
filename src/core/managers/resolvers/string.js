module.exports = {
  type: 'string',
  resolve: async (content, { choices = [], categories = [], max = Infinity, min = 0, optional = false }) => {
    if (typeof content === 'undefined') {
      if (!optional) throw new Error('{arg} must be a string')
      return content
    }
    const num = content.length
    if (num > max) throw new RangeError(`{arg} length cannot be more than ${max}`)
    if (num < min) throw new RangeError(`{arg} length cannot be less than ${min}`)
    if (choices.length && !choices.includes(content)) {
      throw new Error(`{arg} must be one of the following: ${choices.map(c => '`' + c + '`').join(', ')}`)
    }
    if (categories.length) {
      for (const [ cat, choice ] of Object.entries(categories)) {
        if (choice.includes(content)) return cat
      }
      throw new Error(`{arg} must be one of: ${Object.keys(categories).map(c => '`' + c + '`').join(', ')}`)
    }
    return content
  }
}
