module.exports = {
  type: 'list',
  resolve: (content, { separator = ', ', maxLength = Infinity, minLength = 0, max = Infinity, min = 1, unique = false }) => {
    const list = content.split(separator)
    const num = list.length
    if (num > max) {
      return Promise.reject('list.MAX')
    }
    if (num < min) {
      return Promise.reject('list.MIN')
    }

    const itemLength = list.map(item => item.length)
    if (Math.max(...itemLength) > maxLength) {
      return Promise.reject('list.MAX_LENGTH')
    }
    if (Math.min(...itemLength) < minLength) {
      return Promise.reject('list.MAX_LENGTH')
    }

    if (unique && new Set(list).size < list.length) {
      return Promise.reject('list.DUPES')
    }
    return Promise.resolve(list)
  }
}
