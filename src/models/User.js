module.exports = function () {
  const type = this.thinky.type

  return {
    tableName: 'User',
    schema: {
      id: type.string(),
      credits: type.number().default(0),
      exp: type.number().default(0),
      deleted: type.boolean().default(false),
      title: type.string().default('Commoner'),
      description: type.string().default('A simple wandering soul')
    }
  }
}
