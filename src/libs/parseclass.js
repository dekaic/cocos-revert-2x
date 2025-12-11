var __importDefault =
  (this && this.__importDefault) ||
  function (e) {
    return e && e.__esModule ? e : { default: e };
  };
(Object.defineProperty(exports, "__esModule", { value: !0 }),
  (exports.deserialize = deserialize),
  (exports.packCustomObjData = packCustomObjData),
  (exports.unpackJSONs = unpackJSONs));
let js_1 = __importDefault(require("./js")),
  CCObject_1 = __importDefault(require("./objs/CCObject")),
  parsertool_1 = __importDefault(require("./parsertool")),
  value_types_1 = require("./value-types"),
  SUPPORT_MIN_FORMAT_VERSION = 1,
  EMPTY_PLACEHOLDER = 0,
  MASK_CLASS = 0,
  CLASS_TYPE = 0,
  CLASS_KEYS = 1,
  CLASS_PROP_TYPE_OFFSET = 2,
  CUSTOM_OBJ_DATA_CLASS = 0,
  CUSTOM_OBJ_DATA_CONTENT = 1,
  DICT_JSON_LAYOUT = 0,
  PACKED_SECTIONS = 5;
class FileInfo {
  constructor(e) {
    ((this.preprocessed = !0), (this.version = e));
  }
}
function getMissingClass(e, t) {
  return (e || deserialize.reportMissingClass(t), Object);
}
function doLookupClass(t, e, s, r, i, a) {
  let n = t(e);
  if (!n) {
    if (i)
      return void (s[r] =
        ((u = s),
        (_ = r),
        (l = e),
        function () {
          var e = t(l) || getMissingClass(a, l);
          return new (u[_] = e)();
        }));
    n = getMissingClass(a, e);
  }
  var u, _, l;
  s[r] = n;
}
function lookupClasses(e, t, s) {
  var r = s || js_1.default._getClassById,
    i = e[3];
  for (let e = 0; e < i.length; ++e) {
    var a = i[e];
    "string" != typeof a
      ? doLookupClass(r, a[CLASS_TYPE], a, CLASS_TYPE, t, s)
      : doLookupClass(r, a, i, e, t, s);
  }
}
function cacheMasks(e) {
  var t = e[4];
  if (t) {
    var s = e[3];
    for (let e = 0; e < t.length; ++e) {
      var r = t[e];
      r[MASK_CLASS] = s[r[MASK_CLASS]];
    }
  }
}
class Details {
  constructor() {
    ((this.uuidObjList = null),
      (this.uuidPropList = null),
      (this.uuidList = null));
  }
  init(e) {
    ((this.uuidObjList = e[8]),
      (this.uuidPropList = e[9]),
      (this.uuidList = e[10]));
  }
  reset() {
    ((this.uuidList = null),
      (this.uuidObjList = null),
      (this.uuidPropList = null));
  }
  push(e, t, s) {
    (this.uuidObjList.push(e),
      this.uuidPropList.push(t),
      this.uuidList.push(s));
  }
}
function parseInstances(t) {
  let s = t[5],
    r = t[6],
    i = r === EMPTY_PLACEHOLDER ? 0 : r.length,
    e = s[s.length - 1],
    a = s.length - i,
    n = ("number" != typeof e ? (e = 0) : (e < 0 && (e = ~e), --a), 0);
  for (; n < a; ++n) s[n] = deserializeCCObject(t, s[n]);
  var u = t[3];
  for (let e = 0; e < i; ++e, ++n) {
    var _,
      l = r[e],
      o = s[n];
    0 <= l
      ? ((_ = u[l]), (s[n] = deserializeCustomCCObject(t, _, o)))
      : ((l = ~l), (0, ASSIGNMENTS[l])(t, s, n, o));
  }
  return e;
}
((Details.pool = new js_1.default.Pool(function (e) {
  e.reset();
}, 5)),
  (Details.pool.get = function () {
    return this._get() || new Details();
  }));
let OBJ_DATA_MASK = 0;
function assignSimple(e, t, s, r) {
  t[s] = r;
}
function assignInstanceRef(e, t, s, r) {
  0 <= r ? (t[s] = e[5][r]) : (e[7][3 * ~r] = t);
}
function genArrayParser(i) {
  return function (t, e, s, r) {
    e[s] = r;
    for (let e = 0; e < r.length; ++e) i(t, r, e, r[e]);
  };
}
function parseAssetRefByInnerObj(e, t, s, r) {
  ((t[s] = null), (e[8][r] = t));
}
function parseClass(e, t, s, r) {
  t[s] = deserializeCCObject(e, r);
}
function parseCustomClass(e, t, s, r) {
  var i = e[3][r[CUSTOM_OBJ_DATA_CLASS]];
  t[s] = deserializeCustomCCObject(e, i, r[CUSTOM_OBJ_DATA_CONTENT]);
}
function BuiltinValueTypeParsers_xyzw(e, t) {
  ((e.__cid__ = "cc.Quat"),
    (e.x = t[1]),
    (e.y = t[2]),
    (e.z = t[3]),
    (e.w = t[4]));
}
let BuiltinValueTypeSetters = [
    function (e, t) {
      ((e.__cid__ = "cc.Vec2"), (e.x = t[1]), (e.y = t[2]));
    },
    function (e, t) {
      ((e.__cid__ = "cc.Vec3"), (e.x = t[1]), (e.y = t[2]), (e.z = t[3]));
    },
    BuiltinValueTypeParsers_xyzw,
    BuiltinValueTypeParsers_xyzw,
    function (e, t) {
      ((e._val = t[1]), (e.__cid__ = "cc.Color"));
    },
    function (e, t) {
      ((e.__cid__ = "cc.Size"), (e.width = t[1]), (e.height = t[2]));
    },
    function (e, t) {
      ((e.__cid__ = "cc.Rect"),
        (e.x = t[1]),
        (e.y = t[2]),
        (e.width = t[3]),
        (e.height = t[4]));
    },
    function (e, t) {
      ((e.__cid__ = "TypedArray"),
        (e.ctor = "Float64Array"),
        value_types_1.Mat4.fromArray(e, t, 1));
    },
  ],
  BuiltinValueTypes = [
    value_types_1.Vec2,
    value_types_1.Vec3,
    value_types_1.Vec4,
    value_types_1.Quat,
    value_types_1.Color,
    value_types_1.Size,
    value_types_1.Rect,
    value_types_1.Mat4,
  ],
  VALUETYPE_SETTER = 0;
function parseValueTypeCreated(e, t, s, r) {
  var i = new BuiltinValueTypes[r[VALUETYPE_SETTER]]();
  (BuiltinValueTypeSetters[r[VALUETYPE_SETTER]](i, r), (t[s] = i));
}
function parseValueType(e, t, s, r) {
  var i = new BuiltinValueTypes[r[VALUETYPE_SETTER]]();
  (BuiltinValueTypeSetters[r[VALUETYPE_SETTER]](i, r), (t[s] = i));
}
function parseTRS(e, t, s, r) {
  var i = t[s];
  i ? i.set(r) : (t[s] = { _trs: r, __cid__: "TypedArray" });
}
function parseDict(t, e, s, r) {
  var i = r[DICT_JSON_LAYOUT];
  e[s] = i;
  for (let e = DICT_JSON_LAYOUT + 1; e < r.length; e += 3) {
    var a = r[e],
      n = r[e + 1],
      u = r[e + 2];
    (0, ASSIGNMENTS[n])(t, i, a, u);
  }
}
let ARRAY_ITEM_VALUES = 0;
function parseArray(t, e, s, r) {
  var i = r[ARRAY_ITEM_VALUES];
  e[s] = i;
  for (let e = 0; e < i.length; ++e) {
    var a = i[e],
      n = r[e + 1];
    0 !== n && (0, ASSIGNMENTS[n])(t, i, e, a);
  }
}
let ASSIGNMENTS = new Array(13);
function deserializeCCObject(e, t) {
  let s = e[4][t[OBJ_DATA_MASK]],
    r = s[MASK_CLASS],
    i = r[CLASS_TYPE],
    a = new Object(),
    n = ((a.__cid__ = i), r[CLASS_KEYS]),
    u = ((a.__values__ = n), r[CLASS_PROP_TYPE_OFFSET]),
    _ = s[s.length - 1],
    l = MASK_CLASS + 1;
  for (; l < _; ++l) a[n[s[l]]] = t[l];
  for (; l < t.length; ++l) {
    var o = n[s[l]],
      S = r[s[l] + u];
    (0, ASSIGNMENTS[S])(e, a, o, t[l]);
  }
  return a;
}
function deserializeCustomCCObject(e, t, s) {
  let r = new CCObject_1.default();
  return (
    r._deserialize
      ? r._deserialize(s, e[0])
      : "cc.Texture2D" == t
        ? (r = parsertool_1.default._Texture2D_deserialize(s))
        : (r.__expectedType__ = t),
    r
  );
}
function dereference(e, t, s) {
  let r = e.length - 1,
    i = 0;
  for (var a = 3 * e[r]; i < a; i += 3) {
    var n = e[i],
      u = t[e[i + 2]],
      _ = e[i + 1];
    0 <= _ ? (n[s[_]] = u) : (n[~_] = u);
  }
  for (; i < r; i += 3) {
    var l = t[e[i]],
      o = t[e[i + 2]],
      S = e[i + 1];
    0 <= S ? (l[s[S]] = o) : (l[~S] = o);
  }
}
function parseResult(e) {
  var s = e[5],
    r = e[2],
    i = e[1],
    a = e[8],
    n = e[9],
    u = e[10];
  for (let t = 0; t < a.length; ++t) {
    var _ = a[t];
    "number" == typeof _ && (a[t] = s[_]);
    let e = n[t];
    ("number" == typeof e && ((e = 0 <= e ? r[e] : ~e), (n[t] = e)),
      "number" == typeof (_ = u[t]) && (u[t] = i[_]),
      (a[t][e] = { _depend_uuid: u[t] }));
  }
}
function deserialize(e, t, s) {
  "string" == typeof e && (e = JSON.parse(e));
  var r = !t;
  ((t = t || Details.pool.get()).init(e), (s = s || {}));
  let i = e[0],
    a = !1;
  if (
    ("object" == typeof i && ((a = i.preprocessed), (i = i.version)),
    i < SUPPORT_MIN_FORMAT_VERSION)
  )
    throw new Error("不支持的版本 ，错误编码:5304");
  ((s._version = i),
    (s.result = t),
    (e[0] = s),
    a || (lookupClasses(e, !1, s.classFinder), cacheMasks(e)));
  var s = e[5],
    n = parseInstances(e);
  return (
    e[7] && dereference(e[7], s, e[2]),
    parseResult(e),
    r && Details.pool.put(t),
    s[n]
  );
}
function packCustomObjData(e, t, s) {
  return [
    SUPPORT_MIN_FORMAT_VERSION,
    EMPTY_PLACEHOLDER,
    EMPTY_PLACEHOLDER,
    [e],
    EMPTY_PLACEHOLDER,
    s ? [t, -1] : [t],
    [0],
    EMPTY_PLACEHOLDER,
    [],
    [],
    [],
  ];
}
function unpackJSONs(e, t) {
  if (e[0] < SUPPORT_MIN_FORMAT_VERSION)
    throw new Error("不支持的版本 ，错误编码:5304");
  (lookupClasses(e, !0, t), cacheMasks(e));
  var s = new FileInfo(e[0]),
    r = e[1],
    i = e[2],
    a = e[3],
    n = e[4],
    u = e[PACKED_SECTIONS];
  for (let e = 0; e < u.length; ++e)
    Array.isArray(u[e]) && u[e].unshift(s, r, i, a, n);
  return u;
}
((ASSIGNMENTS[0] = assignSimple),
  (ASSIGNMENTS[1] = assignInstanceRef),
  (ASSIGNMENTS[2] = genArrayParser(assignInstanceRef)),
  (ASSIGNMENTS[3] = genArrayParser(parseAssetRefByInnerObj)),
  (ASSIGNMENTS[4] = parseClass),
  (ASSIGNMENTS[5] = parseValueTypeCreated),
  (ASSIGNMENTS[6] = parseAssetRefByInnerObj),
  (ASSIGNMENTS[7] = parseTRS),
  (ASSIGNMENTS[8] = parseValueType),
  (ASSIGNMENTS[9] = genArrayParser(parseClass)),
  (ASSIGNMENTS[10] = parseCustomClass),
  (ASSIGNMENTS[11] = parseDict),
  (ASSIGNMENTS[12] = parseArray));
