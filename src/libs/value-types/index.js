var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
      ? function (e, t, r, o) {
          void 0 === o && (o = r);
          var u = Object.getOwnPropertyDescriptor(t, r);
          ((u &&
            ("get" in u ? t.__esModule : !u.writable && !u.configurable)) ||
            (u = {
              enumerable: !0,
              get: function () {
                return t[r];
              },
            }),
            Object.defineProperty(e, o, u));
        }
      : function (e, t, r, o) {
          e[(o = void 0 === o ? r : o)] = t[r];
        }),
  __exportStar =
    (this && this.__exportStar) ||
    function (e, t) {
      for (var r in e)
        "default" === r ||
          Object.prototype.hasOwnProperty.call(t, r) ||
          __createBinding(t, e, r);
    },
  __importDefault =
    (this && this.__importDefault) ||
    function (e) {
      return e && e.__esModule ? e : { default: e };
    },
  vec2_1 =
    (Object.defineProperty(exports, "__esModule", { value: !0 }),
    (exports.Trs =
      exports.Quat =
      exports.Color =
      exports.Size =
      exports.Rect =
      exports.Mat3 =
      exports.Mat4 =
      exports.Vec4 =
      exports.Vec3 =
      exports.Vec2 =
        void 0),
    require("./vec2")),
  vec3_1 =
    (Object.defineProperty(exports, "Vec2", {
      enumerable: !0,
      get: function () {
        return __importDefault(vec2_1).default;
      },
    }),
    require("./vec3")),
  vec4_1 =
    (Object.defineProperty(exports, "Vec3", {
      enumerable: !0,
      get: function () {
        return __importDefault(vec3_1).default;
      },
    }),
    require("./vec4")),
  mat4_1 =
    (Object.defineProperty(exports, "Vec4", {
      enumerable: !0,
      get: function () {
        return __importDefault(vec4_1).default;
      },
    }),
    require("./mat4")),
  mat3_1 =
    (Object.defineProperty(exports, "Mat4", {
      enumerable: !0,
      get: function () {
        return __importDefault(mat4_1).default;
      },
    }),
    require("./mat3")),
  rect_1 =
    (Object.defineProperty(exports, "Mat3", {
      enumerable: !0,
      get: function () {
        return __importDefault(mat3_1).default;
      },
    }),
    require("./rect")),
  size_1 =
    (Object.defineProperty(exports, "Rect", {
      enumerable: !0,
      get: function () {
        return __importDefault(rect_1).default;
      },
    }),
    require("./size")),
  color_1 =
    (Object.defineProperty(exports, "Size", {
      enumerable: !0,
      get: function () {
        return __importDefault(size_1).default;
      },
    }),
    require("./color")),
  quat_1 =
    (Object.defineProperty(exports, "Color", {
      enumerable: !0,
      get: function () {
        return __importDefault(color_1).default;
      },
    }),
    require("./quat")),
  trs_1 =
    (Object.defineProperty(exports, "Quat", {
      enumerable: !0,
      get: function () {
        return __importDefault(quat_1).default;
      },
    }),
    require("./trs"));
(Object.defineProperty(exports, "Trs", {
  enumerable: !0,
  get: function () {
    return __importDefault(trs_1).default;
  },
}),
  __exportStar(require("./utils"), exports));
