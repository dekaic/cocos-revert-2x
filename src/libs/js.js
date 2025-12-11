let tempCIDGenerater = new (require("./id-generater"))("TmpCId.");
function _getPropertyDescriptor(e, t) {
  for (; e; ) {
    var r = Object.getOwnPropertyDescriptor(e, t);
    if (r) return r;
    e = Object.getPrototypeOf(e);
  }
  return null;
}
function _copyprop(e, t, r) {
  ((t = _getPropertyDescriptor(t, e)), Object.defineProperty(r, e, t));
}
var js = {
    isNumber: function (e) {
      return "number" == typeof e || e instanceof Number;
    },
    isString: function (e) {
      return "string" == typeof e || e instanceof String;
    },
    addon: function (e) {
      e = e || {};
      for (var t = 1, r = arguments.length; t < r; t++) {
        var n = arguments[t];
        if (n)
          if ("object" != typeof n) cc.errorID(5402, n);
          else for (var o in n) o in e || _copyprop(o, n, e);
      }
      return e;
    },
    mixin: function (e) {
      e = e || {};
      for (var t = 1, r = arguments.length; t < r; t++) {
        var n = arguments[t];
        if (n)
          if ("object" != typeof n) cc.errorID(5403, n);
          else for (var o in n) _copyprop(o, n, e);
      }
      return e;
    },
    extend: function (e, t) {
      if (CC_DEV) {
        if (!t) return void cc.errorID(5404);
        if (!e) return void cc.errorID(5405);
        0 < Object.keys(e.prototype).length && cc.errorID(5406);
      }
      for (var r in t) t.hasOwnProperty(r) && (e[r] = t[r]);
      return (
        (e.prototype = Object.create(t.prototype, {
          constructor: { value: e, writable: !0, configurable: !0 },
        })),
        e
      );
    },
    getSuper(e) {
      return (
        (e = (e = e.prototype) && Object.getPrototypeOf(e)) && e.constructor
      );
    },
    isChildClassOf(e, t) {
      if (e && t) {
        if ("function" != typeof e) return !1;
        if ("function" != typeof t) return (CC_DEV && cc.warnID(3625, t), !1);
        if (e === t) return !0;
        for (;;) {
          if (!(e = js.getSuper(e))) return !1;
          if (e === t) return !0;
        }
      }
      return !1;
    },
    clear: function (e) {
      for (var t = Object.keys(e), r = 0; r < t.length; r++) delete e[t[r]];
    },
    isEmptyObject: function (e) {
      for (var t in e) return !1;
      return !0;
    },
    getPropertyDescriptor: _getPropertyDescriptor,
  },
  tmpValueDesc = {
    value: void 0,
    enumerable: !1,
    writable: !1,
    configurable: !0,
  },
  tmpGetSetDesc = {
    get: null,
    set: null,
    enumerable: !(js.value = function (e, t, r, n, o) {
      ((tmpValueDesc.value = r),
        (tmpValueDesc.writable = n),
        (tmpValueDesc.enumerable = o),
        Object.defineProperty(e, t, tmpValueDesc),
        (tmpValueDesc.value = void 0));
    }),
  },
  tmpGetDesc = {
    get: null,
    enumerable: !(js.getset = function (e, t, r, n, o, s) {
      ("function" != typeof n && ((o = n), (n = void 0)),
        (tmpGetSetDesc.get = r),
        (tmpGetSetDesc.set = n),
        (tmpGetSetDesc.enumerable = o),
        (tmpGetSetDesc.configurable = s),
        Object.defineProperty(e, t, tmpGetSetDesc),
        (tmpGetSetDesc.get = null),
        (tmpGetSetDesc.set = null));
    }),
    configurable: !1,
  },
  tmpSetDesc = {
    set: null,
    enumerable: !(js.get = function (e, t, r, n, o) {
      ((tmpGetDesc.get = r),
        (tmpGetDesc.enumerable = n),
        (tmpGetDesc.configurable = o),
        Object.defineProperty(e, t, tmpGetDesc),
        (tmpGetDesc.get = null));
    }),
    configurable: !1,
  };
function isTempClassId(e) {
  return "string" != typeof e || e.startsWith(tempCIDGenerater.prefix);
}
((js.set = function (e, t, r, n, o) {
  ((tmpSetDesc.set = r),
    (tmpSetDesc.enumerable = n),
    (tmpSetDesc.configurable = o),
    Object.defineProperty(e, t, tmpSetDesc),
    (tmpSetDesc.set = null));
}),
  (js.getClassName = function (e) {
    var t, r;
    return "function" == typeof e
      ? (t = e.prototype) &&
        t.hasOwnProperty("__classname__") &&
        t.__classname__
        ? t.__classname__
        : ((t = ""),
          e.name && (t = e.name),
          "Object" !==
          (t =
            e.toString &&
            (r =
              "[" === (r = e.toString()).charAt(0)
                ? r.match(/\[\w+\s*(\w+)\]/)
                : r.match(/function\s*(\w+)/)) &&
            2 === r.length
              ? r[1]
              : t)
            ? t
            : "")
      : e && e.constructor
        ? js.getClassName(e.constructor)
        : "";
  }),
  (() => {
    var n = {},
      o = {};
    function e(n, e, o) {
      return (
        js.getset(
          js,
          e,
          function () {
            return Object.assign({}, o);
          },
          function (e) {
            (js.clear(o), Object.assign(o, e));
          },
        ),
        function (e, t) {
          var r;
          (t.prototype.hasOwnProperty(n) && delete o[t.prototype[n]],
            js.value(t.prototype, n, e),
            e &&
              ((r = o[e]) && r !== t
                ? ((r =
                    "A Class already exists with the same " +
                    n +
                    ' : "' +
                    e +
                    '".'),
                  CC_TEST &&
                    (r +=
                      ' (This may be caused by error of unit test.) If you dont need serialization, you can set class id to "". You can also call cc.js.unregisterClass to remove the id of unused class'),
                  cc.error(r))
                : (o[e] = t)));
        }
      );
    }
    js._setClassId = e("__cid__", "_registeredClassIds", n);
    var r = e("__classname__", "_registeredClassNames", o);
    ((js.setClassName = function (e, t) {
      (r(e, t),
        t.prototype.hasOwnProperty("__cid__") ||
          ((e = e || tempCIDGenerater.getNewId()) && js._setClassId(e, t)));
    }),
      (js.unregisterClass = function () {
        for (var e = 0; e < arguments.length; e++) {
          var t = arguments[e].prototype,
            r = t.__cid__;
          (r && delete n[r], (r = t.__classname__) && delete o[r]);
        }
      }),
      (js._getClassById = function (e) {
        return e;
      }),
      (js.getClassByName = function (e) {
        return o[e];
      }),
      (js._getClassId = function (e, t) {
        var r;
        if (
          ((t = void 0 === t || t),
          "function" == typeof e && e.prototype.hasOwnProperty("__cid__"))
        )
          return (
            (r = e.prototype.__cid__),
            !t && (CC_DEV || CC_EDITOR) && isTempClassId(r) ? "" : r
          );
        if (e && e.constructor) {
          var n = e.constructor.prototype;
          if (n && n.hasOwnProperty("__cid__"))
            return (
              (r = e.__cid__),
              !t && (CC_DEV || CC_EDITOR) && isTempClassId(r) ? "" : r
            );
        }
        return "";
      }));
  })(),
  (js.obsolete = function (e, t, r, n) {
    var o = /([^.]+)$/,
      s = o.exec(t)[0],
      c = o.exec(r)[0];
    function i() {
      return (CC_DEV && cc.warnID(1400, t, r), this[c]);
    }
    n
      ? js.getset(e, s, i, function (e) {
          (CC_DEV && cc.warnID(1400, t, r), (this[c] = e));
        })
      : js.get(e, s, i);
  }),
  (js.obsoletes = function (e, t, r, n) {
    for (var o in r) {
      var s = r[o];
      js.obsolete(e, t + "." + o, s, n);
    }
  }));
var REGEXP_NUM_OR_STR = /(%d)|(%s)/,
  REGEXP_STR = /%s/;
function removeAt(e, t) {
  e.splice(t, 1);
}
function fastRemoveAt(e, t) {
  var r = e.length;
  t < 0 || r <= t || ((e[t] = e[r - 1]), (e.length = r - 1));
}
function remove(e, t) {
  return 0 <= (t = e.indexOf(t)) && (removeAt(e, t), !0);
}
function fastRemove(e, t) {
  0 <= (t = e.indexOf(t)) && ((e[t] = e[e.length - 1]), --e.length);
}
function verifyType(e, t) {
  if (e && 0 < e.length)
    for (var r = 0; r < e.length; r++)
      if (!(e[r] instanceof t)) return (cc.logID(1300), !1);
  return !0;
}
function removeArray(e, t) {
  for (var r = 0, n = t.length; r < n; r++) remove(e, t[r]);
}
function appendObjectsAt(e, t, r) {
  return (e.splice.apply(e, [r, 0].concat(t)), e);
}
function contains(e, t) {
  return 0 <= e.indexOf(t);
}
function copy(e) {
  for (var t = e.length, r = new Array(t), n = 0; n < t; n += 1) r[n] = e[n];
  return r;
}
function Pool(e, t) {
  (void 0 === t && ((t = e), (e = null)),
    (this.get = null),
    (this.count = 0),
    (this._pool = new Array(t)),
    (this._cleanup = e));
}
((js.formatStr = function () {
  var t = arguments.length;
  if (0 === t) return "";
  var r = arguments[0];
  if (1 === t) return "" + r;
  if ("string" == typeof r && REGEXP_NUM_OR_STR.test(r))
    for (let e = 1; e < t; ++e) {
      var n = arguments[e],
        o = "number" == typeof n ? REGEXP_NUM_OR_STR : REGEXP_STR;
      o.test(r) ? (r = r.replace(o, "" + n)) : (r += " " + n);
    }
  else for (let e = 1; e < t; ++e) r += " " + arguments[e];
  return r;
}),
  (js.shiftArguments = function () {
    for (var e = arguments.length - 1, t = new Array(e), r = 0; r < e; ++r)
      t[r] = arguments[r + 1];
    return t;
  }),
  (js.createMap = function (e) {
    var t = Object.create(null);
    return (
      e && ((t["."] = !0), (t["/"] = !0), delete t["."], delete t["/"]),
      t
    );
  }),
  (js.array = {
    remove: remove,
    fastRemove: fastRemove,
    removeAt: removeAt,
    fastRemoveAt: fastRemoveAt,
    contains: contains,
    verifyType: verifyType,
    removeArray: removeArray,
    appendObjectsAt: appendObjectsAt,
    copy: copy,
    MutableForwardIterator: require("./utils/mutable-forward-iterator"),
  }),
  (Pool.prototype._get = function () {
    var e;
    return 0 < this.count
      ? (--this.count,
        (e = this._pool[this.count]),
        (this._pool[this.count] = null),
        e)
      : null;
  }),
  (Pool.prototype.put = function (e) {
    var t = this._pool;
    this.count < t.length &&
      ((this._cleanup && !1 === this._cleanup(e)) ||
        ((t[this.count] = e), ++this.count));
  }),
  (Pool.prototype.resize = function (e) {
    0 <= e && ((this._pool.length = e), this.count > e) && (this.count = e);
  }),
  (js.Pool = Pool),
  (module.exports = js));
