module.exports = {
  type: 'int',
  resolve: async (content, { min = 0, max = Infinity }) => {
    const num = parseInt(content, 10)
    if (isNaN(num)) throw new Error('{arg} is not an integer')
    if (num > max) throw new RangeError(`{arg} must be <= than ${max}`)
    if (num < min) throw new RangeError(`{arg} must be >= than ${min}`)
    return num
  }
}
