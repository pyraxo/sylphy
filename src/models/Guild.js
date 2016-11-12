module.exports = function () {
  const type = this.thinky.type
  const object = type.object
  const string = type.string
  const bool = type.boolean

  return {
    tableName: 'Guild',
    schema: {
      id: string(),
      permissions: object().schema({
        roles: object().schema({
          id: string(),
          nodes: object()
        }).default({}),
        channels: object().schema({
          id: string(),
          nodes: object()
        }).default({}),
        members: object().schema({
          id: string(),
          nodes: object()
        }).default({})
      }).default({}),
      deleted: bool().default(false),
      prefix: string().default(process.env.CLIENT_PREFIX),
      lang: string().default('en'),
      tz: string().default('utc')
    },
    cache: true,
    expiry: 10
  }
}
