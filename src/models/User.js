module.exports = function () {
  const type = this.thinky.type
  const string = type.string
  const number = type.number
  const bool = type.boolean

  return {
    tableName: 'User',
    schema: {
      id: string(),
      credits: number().default(0),
      exp: number().default(0),
      deleted: bool().default(false),
      title: string().default('Commoner'),
      description: string().default('A simple wandering soul')
    },
    cache: true,
    expiry: 300 * 1000
  }
}
