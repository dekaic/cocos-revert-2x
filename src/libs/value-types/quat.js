var __importDefault =
  (this && this.__importDefault) ||
  function (t) {
    return t && t.__esModule ? t : { default: t };
  };
Object.defineProperty(exports, "__esModule", { value: !0 });
let value_type_1 = __importDefault(require("./value-type")),
  vec3_1 = __importDefault(require("./vec3")),
  mat3_1 = __importDefault(require("./mat3")),
  utils_1 = require("./utils"),
  _x = 0,
  _y = 0,
  _z = 0,
  _w = 0;
class Quat extends value_type_1.default {
  mul(t, a) {
    return Quat.multiply(a || new Quat(), this, t);
  }
  static clone(t) {
    return new Quat(t.x, t.y, t.z, t.w);
  }
  static copy(t, a) {
    return ((t.x = a.x), (t.y = a.y), (t.z = a.z), (t.w = a.w), t);
  }
  static set(t, a, r, e, s) {
    return ((t.x = a), (t.y = r), (t.z = e), (t.w = s), t);
  }
  static identity(t) {
    return ((t.x = 0), (t.y = 0), (t.z = 0), (t.w = 1), t);
  }
  static rotationTo(t, a, r) {
    var e = vec3_1.default.dot(a, r);
    return e < -0.999999
      ? (vec3_1.default.cross(v3_1, vec3_1.default.RIGHT, a),
        v3_1.mag() < 1e-6 && vec3_1.default.cross(v3_1, vec3_1.default.UP, a),
        vec3_1.default.normalize(v3_1, v3_1),
        Quat.fromAxisAngle(t, v3_1, Math.PI),
        t)
      : 0.999999 < e
        ? ((t.x = 0), (t.y = 0), (t.z = 0), (t.w = 1), t)
        : (vec3_1.default.cross(v3_1, a, r),
          (t.x = v3_1.x),
          (t.y = v3_1.y),
          (t.z = v3_1.z),
          (t.w = 1 + e),
          Quat.normalize(t, t));
  }
  static getAxisAngle(t, a) {
    var r = 2 * Math.acos(a.w),
      e = Math.sin(r / 2);
    return (
      0 !== e
        ? ((t.x = a.x / e), (t.y = a.y / e), (t.z = a.z / e))
        : ((t.x = 1), (t.y = 0), (t.z = 0)),
      r
    );
  }
  static multiply(t, a, r) {
    return (
      (_x = a.x * r.w + a.w * r.x + a.y * r.z - a.z * r.y),
      (_y = a.y * r.w + a.w * r.y + a.z * r.x - a.x * r.z),
      (_z = a.z * r.w + a.w * r.z + a.x * r.y - a.y * r.x),
      (_w = a.w * r.w - a.x * r.x - a.y * r.y - a.z * r.z),
      (t.x = _x),
      (t.y = _y),
      (t.z = _z),
      (t.w = _w),
      t
    );
  }
  static multiplyScalar(t, a, r) {
    return (
      (t.x = a.x * r),
      (t.y = a.y * r),
      (t.z = a.z * r),
      (t.w = a.w * r),
      t
    );
  }
  static scaleAndAdd(t, a, r, e) {
    return (
      (t.x = a.x + r.x * e),
      (t.y = a.y + r.y * e),
      (t.z = a.z + r.z * e),
      (t.w = a.w + r.w * e),
      t
    );
  }
  static rotateX(t, a, r) {
    r *= 0.5;
    var e = Math.sin(r),
      r = Math.cos(r);
    return (
      (_x = a.x * r + a.w * e),
      (_y = a.y * r + a.z * e),
      (_z = a.z * r - a.y * e),
      (_w = a.w * r - a.x * e),
      (t.x = _x),
      (t.y = _y),
      (t.z = _z),
      (t.w = _w),
      t
    );
  }
  static rotateY(t, a, r) {
    r *= 0.5;
    var e = Math.sin(r),
      r = Math.cos(r);
    return (
      (_x = a.x * r - a.z * e),
      (_y = a.y * r + a.w * e),
      (_z = a.z * r + a.x * e),
      (_w = a.w * r - a.y * e),
      (t.x = _x),
      (t.y = _y),
      (t.z = _z),
      (t.w = _w),
      t
    );
  }
  static rotateZ(t, a, r) {
    r *= 0.5;
    var e = Math.sin(r),
      r = Math.cos(r);
    return (
      (_x = a.x * r + a.y * e),
      (_y = a.y * r - a.x * e),
      (_z = a.z * r + a.w * e),
      (_w = a.w * r - a.z * e),
      (t.x = _x),
      (t.y = _y),
      (t.z = _z),
      (t.w = _w),
      t
    );
  }
  static rotateAround(t, a, r, e) {
    return (
      Quat.invert(qt_1, a),
      vec3_1.default.transformQuat(v3_1, r, qt_1),
      Quat.fromAxisAngle(qt_1, v3_1, e),
      Quat.multiply(t, a, qt_1),
      t
    );
  }
  static rotateAroundLocal(t, a, r, e) {
    return (Quat.fromAxisAngle(qt_1, r, e), Quat.multiply(t, a, qt_1), t);
  }
  static calculateW(t, a) {
    return (
      (t.x = a.x),
      (t.y = a.y),
      (t.z = a.z),
      (t.w = Math.sqrt(Math.abs(1 - a.x * a.x - a.y * a.y - a.z * a.z))),
      t
    );
  }
  static dot(t, a) {
    return t.x * a.x + t.y * a.y + t.z * a.z + t.w * a.w;
  }
  static lerp(t, a, r, e) {
    return (
      (t.x = a.x + e * (r.x - a.x)),
      (t.y = a.y + e * (r.y - a.y)),
      (t.z = a.z + e * (r.z - a.z)),
      (t.w = a.w + e * (r.w - a.w)),
      t
    );
  }
  static slerp(t, a, r, e) {
    let s = 0,
      u,
      i = a.x * r.x + a.y * r.y + a.z * r.z + a.w * r.w,
      y,
      x;
    return (
      i < 0 &&
        ((i = -i), (r.x = -r.x), (r.y = -r.y), (r.z = -r.z), (r.w = -r.w)),
      (u =
        1e-6 < 1 - i
          ? ((y = Math.acos(i)),
            (x = Math.sin(y)),
            (s = Math.sin((1 - e) * y) / x),
            Math.sin(e * y) / x)
          : ((s = 1 - e), e)),
      (t.x = s * a.x + u * r.x),
      (t.y = s * a.y + u * r.y),
      (t.z = s * a.z + u * r.z),
      (t.w = s * a.w + u * r.w),
      t
    );
  }
  static sqlerp(t, a, r, e, s, u) {
    return (
      Quat.slerp(qt_1, a, s, u),
      Quat.slerp(qt_2, r, e, u),
      Quat.slerp(t, qt_1, qt_2, 2 * u * (1 - u)),
      t
    );
  }
  static invert(t, a) {
    var r = a.x * a.x + a.y * a.y + a.z * a.z + a.w * a.w;
    return (
      (t.x = -a.x * (r = r ? 1 / r : 0)),
      (t.y = -a.y * r),
      (t.z = -a.z * r),
      (t.w = a.w * r),
      t
    );
  }
  static conjugate(t, a) {
    return ((t.x = -a.x), (t.y = -a.y), (t.z = -a.z), (t.w = a.w), t);
  }
  static len(t) {
    return Math.sqrt(t.x * t.x + t.y * t.y + t.z * t.z + t.w * t.w);
  }
  static lengthSqr(t) {
    return t.x * t.x + t.y * t.y + t.z * t.z + t.w * t.w;
  }
  static normalize(t, a) {
    var r = a.x * a.x + a.y * a.y + a.z * a.z + a.w * a.w;
    return (
      0 < r &&
        ((r = 1 / Math.sqrt(r)),
        (t.x = a.x * r),
        (t.y = a.y * r),
        (t.z = a.z * r),
        (t.w = a.w * r)),
      t
    );
  }
  static fromAxes(t, a, r, e) {
    return (
      mat3_1.default.set(m3_1, a.x, a.y, a.z, r.x, r.y, r.z, e.x, e.y, e.z),
      Quat.normalize(t, Quat.fromMat3(t, m3_1))
    );
  }
  static fromViewUp(t, a, r) {
    return (
      mat3_1.default.fromViewUp(m3_1, a, r),
      Quat.normalize(t, Quat.fromMat3(t, m3_1))
    );
  }
  static fromAxisAngle(t, a, r) {
    r *= 0.5;
    var e = Math.sin(r);
    return (
      (t.x = e * a.x),
      (t.y = e * a.y),
      (t.z = e * a.z),
      (t.w = Math.cos(r)),
      t
    );
  }
  static fromAngleZ(t, a) {
    return (
      (a *= halfToRad),
      (t.x = t.y = 0),
      (t.z = Math.sin(a)),
      (t.w = Math.cos(a)),
      t
    );
  }
  static fromMat3(t, a) {
    var r = (a = a.m)[0],
      e = a[1],
      s = a[2],
      u = a[3],
      i = a[4],
      y = a[5],
      x = a[6],
      z = a[7],
      n = r + i + (a = a[8]);
    return (
      0 < n
        ? ((n = 0.5 / Math.sqrt(n + 1)),
          (t.w = 0.25 / n),
          (t.x = (y - z) * n),
          (t.y = (x - s) * n),
          (t.z = (e - u) * n))
        : i < r && a < r
          ? ((n = 2 * Math.sqrt(1 + r - i - a)),
            (t.w = (y - z) / n),
            (t.x = 0.25 * n),
            (t.y = (u + e) / n),
            (t.z = (x + s) / n))
          : a < i
            ? ((n = 2 * Math.sqrt(1 + i - r - a)),
              (t.w = (x - s) / n),
              (t.x = (u + e) / n),
              (t.y = 0.25 * n),
              (t.z = (z + y) / n))
            : ((n = 2 * Math.sqrt(1 + a - r - i)),
              (t.w = (e - u) / n),
              (t.x = (x + s) / n),
              (t.y = (z + y) / n),
              (t.z = 0.25 * n)),
      t
    );
  }
  static fromEuler(t, a, r, e) {
    ((a *= halfToRad), (r *= halfToRad), (e *= halfToRad));
    var s = Math.sin(a),
      a = Math.cos(a),
      u = Math.sin(r),
      r = Math.cos(r),
      i = Math.sin(e),
      e = Math.cos(e);
    return (
      (t.x = s * r * e + a * u * i),
      (t.y = a * u * e + s * r * i),
      (t.z = a * r * i - s * u * e),
      (t.w = a * r * e - s * u * i),
      t
    );
  }
  static toAxisX(t, a) {
    var r = 2 * a.y,
      e = 2 * a.z;
    return (
      (t.x = 1 - r * a.y - e * a.z),
      (t.y = r * a.x + e * a.w),
      (t.z = e * a.x + r * a.w),
      t
    );
  }
  static toAxisY(t, a) {
    var r = 2 * a.x,
      e = 2 * a.z;
    return (
      (t.x = 2 * a.y * a.x - e * a.w),
      (t.y = 1 - r * a.x - e * a.z),
      (t.z = e * a.y + r * a.w),
      t
    );
  }
  static toAxisZ(t, a) {
    var r = 2 * a.x,
      e = 2 * a.y,
      s = 2 * a.z;
    return (
      (t.x = s * a.x - e * a.w),
      (t.y = s * a.y - r * a.w),
      (t.z = 1 - r * a.x - e * a.y),
      t
    );
  }
  static toEuler(t, a, r) {
    var { x: a, y: e, z: s, w: u } = a;
    let i = 0,
      y = 0,
      x = 0,
      z,
      n,
      w,
      _ = a * e + s * u;
    return (
      0.499999 < _
        ? ((i = 0), (y = (0, utils_1.toDegree)(2 * Math.atan2(a, u))), (x = 90))
        : _ < -0.499999
          ? ((i = 0),
            (y = -(0, utils_1.toDegree)(2 * Math.atan2(a, u))),
            (x = -90))
          : ((z = a * a),
            (n = e * e),
            (w = s * s),
            (i = (0, utils_1.toDegree)(
              Math.atan2(2 * a * u - 2 * e * s, 1 - 2 * z - 2 * w),
            )),
            (y = (0, utils_1.toDegree)(
              Math.atan2(2 * e * u - 2 * a * s, 1 - 2 * n - 2 * w),
            )),
            (x = (0, utils_1.toDegree)(Math.asin(2 * _))),
            r &&
              ((i = -180 * Math.sign(i + 1e-6) + i),
              (y = -180 * Math.sign(y + 1e-6) + y),
              (x = 180 * Math.sign(x + 1e-6) - x))),
      (t.x = i),
      (t.y = y),
      (t.z = x),
      t
    );
  }
  static strictEquals(t, a) {
    return t.x === a.x && t.y === a.y && t.z === a.z && t.w === a.w;
  }
  static equals(t, a, r = utils_1.EPSILON) {
    return (
      Math.abs(t.x - a.x) <= r * Math.max(1, Math.abs(t.x), Math.abs(a.x)) &&
      Math.abs(t.y - a.y) <= r * Math.max(1, Math.abs(t.y), Math.abs(a.y)) &&
      Math.abs(t.z - a.z) <= r * Math.max(1, Math.abs(t.z), Math.abs(a.z)) &&
      Math.abs(t.w - a.w) <= r * Math.max(1, Math.abs(t.w), Math.abs(a.w))
    );
  }
  static toArray(t, a, r = 0) {
    return (
      (t[r + 0] = a.x),
      (t[r + 1] = a.y),
      (t[r + 2] = a.z),
      (t[r + 3] = a.w),
      t
    );
  }
  static fromArray(t, a, r = 0) {
    return (
      (t.x = a[r + 0]),
      (t.y = a[r + 1]),
      (t.z = a[r + 2]),
      (t.w = a[r + 3]),
      t
    );
  }
  constructor(t = 0, a = 0, r = 0, e = 1) {
    (super(),
      t && "object" == typeof t
        ? ((this.x = t.x), (this.y = t.y), (this.z = t.z), (this.w = t.w))
        : ((this.x = t), (this.y = a), (this.z = r), (this.w = e)));
  }
  clone() {
    return new Quat(this.x, this.y, this.z, this.w);
  }
  set(t) {
    return (
      (this.x = t.x),
      (this.y = t.y),
      (this.z = t.z),
      (this.w = t.w),
      this
    );
  }
  equals(t) {
    return (
      t && this.x === t.x && this.y === t.y && this.z === t.z && this.w === t.w
    );
  }
  toEuler(t) {
    return Quat.toEuler(t, this);
  }
  fromEuler(t) {
    return Quat.fromEuler(this, t.x, t.y, t.z);
  }
  lerp(t, a, r) {
    return ((r = r || new Quat()), Quat.slerp(r, this, t, a), r);
  }
  multiply(t) {
    return Quat.multiply(this, this, t);
  }
  rotateAround(t, a, r, e) {
    return ((e = e || new Quat()), Quat.rotateAround(e, t, a, r));
  }
}
((Quat.mul = Quat.multiply),
  (Quat.scale = Quat.multiplyScalar),
  (Quat.mag = Quat.len),
  (Quat.IDENTITY = Object.freeze(new Quat())));
let qt_1 = new (exports.default = Quat)(),
  qt_2 = new Quat(),
  v3_1 = new vec3_1.default(),
  m3_1 = new mat3_1.default(),
  halfToRad = (0.5 * Math.PI) / 180;
