var __importDefault =
  (this && this.__importDefault) ||
  function (t) {
    return t && t.__esModule ? t : { default: t };
  };
(Object.defineProperty(exports, "__esModule", { value: !0 }),
  (exports.v4 = v4));
let value_type_1 = __importDefault(require("./value-type")),
  utils_1 = require("./utils"),
  _x = 0,
  _y = 0,
  _z = 0,
  _w = 0;
class Vec4 extends value_type_1.default {
  sub(t, s) {
    return Vec4.subtract(s || new Vec4(), this, t);
  }
  mul(t, s) {
    return Vec4.multiplyScalar(s || new Vec4(), this, t);
  }
  div(t, s) {
    return Vec4.multiplyScalar(s || new Vec4(), this, 1 / t);
  }
  scale(t, s) {
    return Vec4.multiply(s || new Vec4(), this, t);
  }
  neg(t) {
    return Vec4.negate(t || new Vec4(), this);
  }
  static get ZERO() {
    return new Vec4(0, 0, 0, 0);
  }
  static get ONE() {
    return new Vec4(1, 1, 1, 1);
  }
  static get NEG_ONE() {
    return new Vec4(-1, -1, -1, -1);
  }
  static clone(t) {
    return new Vec4(t.x, t.y, t.z, t.w);
  }
  static copy(t, s) {
    return ((t.x = s.x), (t.y = s.y), (t.z = s.z), (t.w = s.w), t);
  }
  static set(t, s, a, i, e) {
    return ((t.x = s), (t.y = a), (t.z = i), (t.w = e), t);
  }
  static add(t, s, a) {
    return (
      (t.x = s.x + a.x),
      (t.y = s.y + a.y),
      (t.z = s.z + a.z),
      (t.w = s.w + a.w),
      t
    );
  }
  static subtract(t, s, a) {
    return (
      (t.x = s.x - a.x),
      (t.y = s.y - a.y),
      (t.z = s.z - a.z),
      (t.w = s.w - a.w),
      t
    );
  }
  static multiply(t, s, a) {
    return (
      (t.x = s.x * a.x),
      (t.y = s.y * a.y),
      (t.z = s.z * a.z),
      (t.w = s.w * a.w),
      t
    );
  }
  static divide(t, s, a) {
    return (
      (t.x = s.x / a.x),
      (t.y = s.y / a.y),
      (t.z = s.z / a.z),
      (t.w = s.w / a.w),
      t
    );
  }
  static ceil(t, s) {
    return (
      (t.x = Math.ceil(s.x)),
      (t.y = Math.ceil(s.y)),
      (t.z = Math.ceil(s.z)),
      (t.w = Math.ceil(s.w)),
      t
    );
  }
  static floor(t, s) {
    return (
      (t.x = Math.floor(s.x)),
      (t.y = Math.floor(s.y)),
      (t.z = Math.floor(s.z)),
      (t.w = Math.floor(s.w)),
      t
    );
  }
  static min(t, s, a) {
    return (
      (t.x = Math.min(s.x, a.x)),
      (t.y = Math.min(s.y, a.y)),
      (t.z = Math.min(s.z, a.z)),
      (t.w = Math.min(s.w, a.w)),
      t
    );
  }
  static max(t, s, a) {
    return (
      (t.x = Math.max(s.x, a.x)),
      (t.y = Math.max(s.y, a.y)),
      (t.z = Math.max(s.z, a.z)),
      (t.w = Math.max(s.w, a.w)),
      t
    );
  }
  static round(t, s) {
    return (
      (t.x = Math.round(s.x)),
      (t.y = Math.round(s.y)),
      (t.z = Math.round(s.z)),
      (t.w = Math.round(s.w)),
      t
    );
  }
  static multiplyScalar(t, s, a) {
    return (
      (t.x = s.x * a),
      (t.y = s.y * a),
      (t.z = s.z * a),
      (t.w = s.w * a),
      t
    );
  }
  static scaleAndAdd(t, s, a, i) {
    return (
      (t.x = s.x + a.x * i),
      (t.y = s.y + a.y * i),
      (t.z = s.z + a.z * i),
      (t.w = s.w + a.w * i),
      t
    );
  }
  static distance(t, s) {
    var a = s.x - t.x,
      i = s.y - t.y,
      e = s.z - t.z,
      s = s.w - t.w;
    return Math.sqrt(a * a + i * i + e * e + s * s);
  }
  static squaredDistance(t, s) {
    var a = s.x - t.x,
      i = s.y - t.y,
      e = s.z - t.z;
    return a * a + i * i + e * e + (s = s.w - t.w) * s;
  }
  static len(t) {
    return (
      (_x = t.x),
      (_y = t.y),
      (_z = t.z),
      (_w = t.w),
      Math.sqrt(_x * _x + _y * _y + _z * _z + _w * _w)
    );
  }
  static lengthSqr(t) {
    return (
      (_x = t.x),
      (_y = t.y),
      (_z = t.z),
      (_w = t.w),
      _x * _x + _y * _y + _z * _z + _w * _w
    );
  }
  static negate(t, s) {
    return ((t.x = -s.x), (t.y = -s.y), (t.z = -s.z), (t.w = -s.w), t);
  }
  static inverse(t, s) {
    return (
      (t.x = 1 / s.x),
      (t.y = 1 / s.y),
      (t.z = 1 / s.z),
      (t.w = 1 / s.w),
      t
    );
  }
  static inverseSafe(t, s) {
    return (
      (_x = s.x),
      (_y = s.y),
      (_z = s.z),
      (_w = s.w),
      Math.abs(_x) < utils_1.EPSILON ? (t.x = 0) : (t.x = 1 / _x),
      Math.abs(_y) < utils_1.EPSILON ? (t.y = 0) : (t.y = 1 / _y),
      Math.abs(_z) < utils_1.EPSILON ? (t.z = 0) : (t.z = 1 / _z),
      Math.abs(_w) < utils_1.EPSILON ? (t.w = 0) : (t.w = 1 / _w),
      t
    );
  }
  static normalize(t, s) {
    return (
      (_x = s.x),
      (_y = s.y),
      (_z = s.z),
      (_w = s.w),
      0 < (s = _x * _x + _y * _y + _z * _z + _w * _w) &&
        ((s = 1 / Math.sqrt(s)),
        (t.x = _x * s),
        (t.y = _y * s),
        (t.z = _z * s),
        (t.w = _w * s)),
      t
    );
  }
  static dot(t, s) {
    return t.x * s.x + t.y * s.y + t.z * s.z + t.w * s.w;
  }
  static lerp(t, s, a, i) {
    return (
      (t.x = s.x + i * (a.x - s.x)),
      (t.y = s.y + i * (a.y - s.y)),
      (t.z = s.z + i * (a.z - s.z)),
      (t.w = s.w + i * (a.w - s.w)),
      t
    );
  }
  static random(t, s) {
    s = s || 1;
    var a = 2 * (0, utils_1.random)() * Math.PI,
      i = 2 * (0, utils_1.random)() - 1,
      e = Math.sqrt(1 - i * i);
    return (
      (t.x = e * Math.cos(a) * s),
      (t.y = e * Math.sin(a) * s),
      (t.z = i * s),
      (t.w = 0),
      t
    );
  }
  static transformMat4(t, s, a) {
    return (
      (_x = s.x),
      (_y = s.y),
      (_z = s.z),
      (_w = s.w),
      (s = a.m),
      (t.x = s[0] * _x + s[4] * _y + s[8] * _z + s[12] * _w),
      (t.y = s[1] * _x + s[5] * _y + s[9] * _z + s[13] * _w),
      (t.z = s[2] * _x + s[6] * _y + s[10] * _z + s[14] * _w),
      (t.w = s[3] * _x + s[7] * _y + s[11] * _z + s[15] * _w),
      t
    );
  }
  static transformAffine(t, s, a) {
    return (
      (_x = s.x),
      (_y = s.y),
      (_z = s.z),
      (_w = s.w),
      (a = a.m),
      (t.x = a[0] * _x + a[1] * _y + a[2] * _z + a[3] * _w),
      (t.y = a[4] * _x + a[5] * _y + a[6] * _z + a[7] * _w),
      (t.x = a[8] * _x + a[9] * _y + a[10] * _z + a[11] * _w),
      (t.w = s.w),
      t
    );
  }
  static transformQuat(t, s, a) {
    var { x: i, y: e, z: h } = s,
      a =
        ((_x = a.x), (_y = a.y), (_z = a.z), (_w = a.w) * i + _y * h - _z * e),
      r = _w * e + _z * i - _x * h,
      _ = _w * h + _x * e - _y * i,
      i = -_x * i - _y * e - _z * h;
    return (
      (t.x = a * _w + i * -_x + r * -_z - _ * -_y),
      (t.y = r * _w + i * -_y + _ * -_x - a * -_z),
      (t.z = _ * _w + i * -_z + a * -_y - r * -_x),
      (t.w = s.w),
      t
    );
  }
  static strictEquals(t, s) {
    return t.x === s.x && t.y === s.y && t.z === s.z && t.w === s.w;
  }
  static equals(t, s, a = utils_1.EPSILON) {
    return (
      Math.abs(t.x - s.x) <= a * Math.max(1, Math.abs(t.x), Math.abs(s.x)) &&
      Math.abs(t.y - s.y) <= a * Math.max(1, Math.abs(t.y), Math.abs(s.y)) &&
      Math.abs(t.z - s.z) <= a * Math.max(1, Math.abs(t.z), Math.abs(s.z)) &&
      Math.abs(t.w - s.w) <= a * Math.max(1, Math.abs(t.w), Math.abs(s.w))
    );
  }
  static toArray(t, s, a = 0) {
    return (
      (t[a + 0] = s.x),
      (t[a + 1] = s.y),
      (t[a + 2] = s.z),
      (t[a + 3] = s.w),
      t
    );
  }
  static fromArray(t, s, a = 0) {
    return (
      (t.x = s[a + 0]),
      (t.y = s[a + 1]),
      (t.z = s[a + 2]),
      (t.w = s[a + 3]),
      t
    );
  }
  constructor(t = 0, s = 0, a = 0, i = 0) {
    (super(),
      (this.mag = Vec4.prototype.len),
      (this.magSqr = Vec4.prototype.lengthSqr),
      (this.subSelf = Vec4.prototype.subtract),
      (this.mulSelf = Vec4.prototype.multiplyScalar),
      (this.divSelf = Vec4.prototype.divide),
      (this.scaleSelf = Vec4.prototype.multiply),
      (this.negSelf = Vec4.prototype.negate),
      t && "object" == typeof t
        ? ((this.x = t.x), (this.y = t.y), (this.z = t.z), (this.w = t.w))
        : ((this.x = t), (this.y = s), (this.z = a), (this.w = i)));
  }
  clone() {
    return new Vec4(this.x, this.y, this.z, this.w);
  }
  set(t, s, a, i) {
    return (
      t && "object" == typeof t
        ? ((this.x = t.x), (this.y = t.y), (this.z = t.z), (this.w = t.w))
        : ((this.x = t || 0),
          (this.y = s || 0),
          (this.z = a || 0),
          (this.w = i || 0)),
      this
    );
  }
  equals(t, s = utils_1.EPSILON) {
    return (
      Math.abs(this.x - t.x) <=
        s * Math.max(1, Math.abs(this.x), Math.abs(t.x)) &&
      Math.abs(this.y - t.y) <=
        s * Math.max(1, Math.abs(this.y), Math.abs(t.y)) &&
      Math.abs(this.z - t.z) <=
        s * Math.max(1, Math.abs(this.z), Math.abs(t.z)) &&
      Math.abs(this.w - t.w) <= s * Math.max(1, Math.abs(this.w), Math.abs(t.w))
    );
  }
  equals4f(t, s, a, i, e = utils_1.EPSILON) {
    return (
      Math.abs(this.x - t) <= e * Math.max(1, Math.abs(this.x), Math.abs(t)) &&
      Math.abs(this.y - s) <= e * Math.max(1, Math.abs(this.y), Math.abs(s)) &&
      Math.abs(this.z - a) <= e * Math.max(1, Math.abs(this.z), Math.abs(a)) &&
      Math.abs(this.w - i) <= e * Math.max(1, Math.abs(this.w), Math.abs(i))
    );
  }
  strictEquals(t) {
    return this.x === t.x && this.y === t.y && this.z === t.z && this.w === t.w;
  }
  strictEquals4f(t, s, a, i) {
    return this.x === t && this.y === s && this.z === a && this.w === i;
  }
  lerp(t, s) {
    return (
      (_x = this.x),
      (_y = this.y),
      (_z = this.z),
      (_w = this.w),
      (this.x = _x + s * (t.x - _x)),
      (this.y = _y + s * (t.y - _y)),
      (this.z = _z + s * (t.z - _z)),
      (this.w = _w + s * (t.w - _w)),
      this
    );
  }
  toString() {
    return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)}, ${this.w.toFixed(2)})`;
  }
  clampf(t, s) {
    return (
      (this.x = (0, utils_1.clamp)(this.x, t.x, s.x)),
      (this.y = (0, utils_1.clamp)(this.y, t.y, s.y)),
      (this.z = (0, utils_1.clamp)(this.z, t.z, s.z)),
      (this.w = (0, utils_1.clamp)(this.w, t.w, s.w)),
      this
    );
  }
  addSelf(t) {
    return (
      (this.x += t.x),
      (this.y += t.y),
      (this.z += t.z),
      (this.w += t.w),
      this
    );
  }
  add(t, s) {
    return (
      ((s = s || new Vec4()).x = this.x + t.x),
      (s.y = this.y + t.y),
      (s.z = this.z + t.z),
      (s.w = this.w + t.w),
      s
    );
  }
  subtract(t, s) {
    return (
      ((s = s || new Vec4()).x = this.x - t.x),
      (s.y = this.y - t.y),
      (s.z = this.z - t.z),
      (s.w = this.w - t.w),
      s
    );
  }
  multiplyScalar(t) {
    return ((this.x *= t), (this.y *= t), (this.z *= t), (this.w *= t), this);
  }
  multiply(t) {
    return (
      (this.x *= t.x),
      (this.y *= t.y),
      (this.z *= t.z),
      (this.w *= t.w),
      this
    );
  }
  divide(t) {
    return ((this.x /= t), (this.y /= t), (this.z /= t), (this.w /= t), this);
  }
  negate() {
    return (
      (this.x = -this.x),
      (this.y = -this.y),
      (this.z = -this.z),
      (this.w = -this.w),
      this
    );
  }
  dot(t) {
    return this.x * t.x + this.y * t.y + this.z * t.z + this.w * t.w;
  }
  cross(t, s) {
    var { x: a, y: i, z: e } = this,
      { x: t, y: h, z: r } = t;
    return (
      ((s = s || new Vec4()).x = i * r - e * h),
      (s.y = e * t - a * r),
      (s.z = a * h - i * t),
      s
    );
  }
  len() {
    var t = this.x,
      s = this.y,
      a = this.z,
      i = this.w;
    return Math.sqrt(t * t + s * s + a * a + i * i);
  }
  lengthSqr() {
    var t = this.x,
      s = this.y,
      a = this.z,
      i = this.w;
    return t * t + s * s + a * a + i * i;
  }
  normalizeSelf() {
    return (this.normalize(this), this);
  }
  normalize(t) {
    ((t = t || new Vec4()),
      (_x = this.x),
      (_y = this.y),
      (_z = this.z),
      (_w = this.w));
    var s = _x * _x + _y * _y + _z * _z + _w * _w;
    return (
      0 < s &&
        ((s = 1 / Math.sqrt(s)),
        (t.x = _x * s),
        (t.y = _y * s),
        (t.z = _z * s),
        (t.w = _w * s)),
      t
    );
  }
  transformMat4(t, s) {
    return (
      (s = s || new Vec4()),
      (_x = this.x),
      (_y = this.y),
      (_z = this.z),
      (_w = this.w),
      (t = t.m),
      (s.x = t[0] * _x + t[4] * _y + t[8] * _z + t[12] * _w),
      (s.y = t[1] * _x + t[5] * _y + t[9] * _z + t[13] * _w),
      (s.z = t[2] * _x + t[6] * _y + t[10] * _z + t[14] * _w),
      (s.w = t[3] * _x + t[7] * _y + t[11] * _z + t[15] * _w),
      s
    );
  }
  maxAxis() {
    return Math.max(this.x, this.y, this.z, this.w);
  }
}
function v4(t, s, a, i) {
  return new Vec4(t, s, a, i);
}
((Vec4.sub = Vec4.subtract),
  (Vec4.mul = Vec4.multiply),
  (Vec4.div = Vec4.divide),
  (Vec4.scale = Vec4.multiplyScalar),
  (Vec4.mag = Vec4.len),
  (Vec4.squaredMagnitude = Vec4.lengthSqr),
  (Vec4.ZERO_R = Vec4.ZERO),
  (Vec4.ONE_R = Vec4.ONE),
  (Vec4.NEG_ONE_R = Vec4.NEG_ONE),
  (exports.default = Vec4));
