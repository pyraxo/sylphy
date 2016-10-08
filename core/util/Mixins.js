'use strict'

const _appliedMixin = '__mixwith_appliedMixin'

const apply = (superclass, mixin) => {
  let application = mixin(superclass)
  application.prototype[_appliedMixin] = unwrap(mixin)
  return application
}

const isApplicationOf = (proto, mixin) =>
  proto.hasOwnProperty(_appliedMixin) && proto[_appliedMixin] === unwrap(mixin)

const hasMixin = (o, mixin) => {
  while (o != null) {
    if (isApplicationOf(o, mixin)) return true
    o = Object.getPrototypeOf(o)
  }
  return false
}

const _wrappedMixin = '__mixwith_wrappedMixin'

const wrap = (mixin, wrapper) => {
  Object.setPrototypeOf(wrapper, mixin)
  if (!mixin[_wrappedMixin]) {
    mixin[_wrappedMixin] = mixin
  }
  return wrapper
}

const unwrap = (wrapper) => wrapper[_wrappedMixin] || wrapper

const _cachedApplications = '__mixwith_cachedApplications'

const Cached = (mixin) => wrap(mixin, (superclass) => {
  let cachedApplications = superclass[_cachedApplications]
  if (!cachedApplications) {
    cachedApplications = superclass[_cachedApplications] = new Map()
  }

  let application = cachedApplications.get(mixin)
  if (!application) {
    application = mixin(superclass)
    cachedApplications.set(mixin, application)
  }

  return application
})

const DeDupe = (mixin) => wrap(mixin, (superclass) =>
    (hasMixin(superclass.prototype, mixin))
      ? superclass
      : mixin(superclass))

const HasInstance = (mixin) => {
  if (Symbol && Symbol.hasInstance && !mixin[Symbol.hasInstance]) {
    Object.defineProperty(mixin, Symbol.hasInstance, {
      value (o) {
        return hasMixin(o, mixin)
      }
    })
  }
  return mixin
}

const BareMixin = (mixin) => wrap(mixin, (s) => apply(s, mixin))

const Mixin = (mixin) => DeDupe(Cached(BareMixin(mixin)))

const mix = (superclass) => new MixinBuilder(superclass)

class MixinBuilder {
  constructor (superclass) {
    this.superclass = superclass || class {}
  }

  with (...mixins) {
    return mixins.reduce((c, m) => m(c), this.superclass)
  }
}

module.exports = {
  apply, isApplicationOf, hasMixin, wrap, unwrap, Cached, DeDupe, HasInstance, BareMixin, Mixin, mix
}
