module.exports = function () {
  const type = this.thinky.type

  return {
    tableName: 'Guild',
    schema: {
      id: type.string(),
      permissions: type.object().schema({
        roles: type.object().schema({
          id: type.string(),
          nodes: type.object()
        }).default({}),
        channels: type.object().schema({
          id: type.string(),
          nodes: type.object()
        }).default({}),
        members: type.object().schema({
          id: type.string(),
          nodes: type.object()
        }).default({})
      }).default({}),
      deleted: type.boolean().default(false),
      prefix: type.string().default(process.env.CLIENT_PREFIX),
      lang: type.string().default('en')
    },
    cache: true
  }
}
