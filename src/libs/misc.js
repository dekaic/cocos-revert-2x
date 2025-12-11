var js = require("./js"),
  misc = {
    propertyDefine: function (o, r, e) {
      function s(r, e, s, c) {
        var t,
          n = Object.getOwnPropertyDescriptor(r, e);
        n
          ? (n.get && (r[s] = n.get), n.set && c && (r[c] = n.set))
          : ((n = r[s]),
            CC_DEV && !n
              ? ((t =
                  (cc.Class._isCCClass(o) && js.getClassName(o)) ||
                  o.name ||
                  "(anonymous class)"),
                cc.warnID(5700, e, s, t))
              : js.getset(r, e, n, r[c]));
      }
      for (var c = o.prototype, t = 0; t < r.length; t++) {
        var n,
          a = (n = r[t])[0].toUpperCase() + n.slice(1);
        s(c, n, "get" + a, "set" + a);
      }
      for (n in e) {
        var i = e[n];
        s(c, n, i[0], i[1]);
      }
    },
    NextPOT: function (r) {
      return (
        1 +
        ((r =
          (r = (r = (r = --r | (r >> 1)) | (r >> 2)) | (r >> 4)) | (r >> 8)) |
          (r >> 16))
      );
    },
    BUILTIN_CLASSID_RE: /^(?:cc|dragonBones|sp|ccsg)\..+/,
  },
  BASE64_KEYS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  BASE64_VALUES = new Array(123);
for (let r = 0; r < 123; ++r) BASE64_VALUES[r] = 64;
for (let r = 0; r < 64; ++r) BASE64_VALUES[BASE64_KEYS.charCodeAt(r)] = r;
((misc.BASE64_VALUES = BASE64_VALUES),
  (misc.pushToMap = function (r, e, s, c) {
    var t = r[e];
    t
      ? Array.isArray(t)
        ? c
          ? (t.push(t[0]), (t[0] = s))
          : t.push(s)
        : (r[e] = c ? [s, t] : [t, s])
      : (r[e] = s);
  }),
  (misc.clampf = function (r, e, s) {
    var c;
    return (s < e && ((c = e), (e = s), (s = c)), r < e ? e : r < s ? r : s);
  }),
  (misc.clamp01 = function (r) {
    return r < 0 ? 0 : r < 1 ? r : 1;
  }),
  (misc.lerp = function (r, e, s) {
    return r + (e - r) * s;
  }),
  (misc.degreesToRadians = function (r) {
    return r * cc.macro.RAD;
  }),
  (misc.radiansToDegrees = function (r) {
    return r * cc.macro.DEG;
  }),
  (module.exports = misc));
