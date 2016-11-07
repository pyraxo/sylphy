module.exports = {
  type: 'list',
  resolve: async (content, { separator = ', ', maxLength = Infinity, minLength = 0, max = Infinity, min = 0, unique = false }) => {
    const list = content.split(separator)
    const num = list.length
    if (num > max) throw new RangeError(`{arg} length cannot contain more than ${max} items`)
    if (num < min) throw new RangeError(`{arg} length cannot contain less than ${min} items`)

    const itemLength = list.map(item => item.length)
    if (Math.max(...itemLength) > maxLength) throw new RangeError(`{arg} cannot contain items longer than ${maxLength}`)
    if (Math.min(...itemLength) < minLength) throw new RangeError(`{arg} cannot contain items shorter than ${maxLength}`)
    if (unique && new Set(list).size < list.length) throw new Error('{arg} cannot contain duplicate values')
    return list
  }
}
