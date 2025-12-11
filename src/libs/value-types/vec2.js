var __importDefault =
  (this && this.__importDefault) ||
  function (t) {
    return t && t.__esModule ? t : { default: t };
  };
Object.defineProperty(exports, "__esModule", { value: !0 });
let value_type_1 = __importDefault(require("./value-type")),
  misc_1 = __importDefault(require("../misc")),
  utils_1 = require("./utils"),
  _x = 0,
  _y = 0;
class Vec2 extends value_type_1.default {
  sub(t, e) {
    return Vec2.subtract(e || new Vec2(), this, t);
  }
  mul(t, e) {
    return Vec2.multiplyScalar(e || new Vec2(), this, t);
  }
  div(t, e) {
    return Vec2.multiplyScalar(e || new Vec2(), this, 1 / t);
  }
  scale(t, e) {
    return Vec2.multiply(e || new Vec2(), this, t);
  }
  neg(t) {
    return Vec2.negate(t || new Vec2(), this);
  }
  static get ONE() {
    return new Vec2(1, 1);
  }
  static get ZERO() {
    return new Vec2(0, 0);
  }
  static get UP() {
    return new Vec2(0, 1);
  }
  static get RIGHT() {
    return new Vec2(1, 0);
  }
  static clone(t) {
    return new Vec2(t.x, t.y);
  }
  static copy(t, e) {
    return ((t.x = e.x), (t.y = e.y), t);
  }
  static set(t, e, r) {
    return ((t.x = e), (t.y = r), t);
  }
  static add(t, e, r) {
    return ((t.x = e.x + r.x), (t.y = e.y + r.y), t);
  }
  static subtract(t, e, r) {
    return ((t.x = e.x - r.x), (t.y = e.y - r.y), t);
  }
  static multiply(t, e, r) {
    return ((t.x = e.x * r.x), (t.y = e.y * r.y), t);
  }
  static divide(t, e, r) {
    return ((t.x = e.x / r.x), (t.y = e.y / r.y), t);
  }
  static ceil(t, e) {
    return ((t.x = Math.ceil(e.x)), (t.y = Math.ceil(e.y)), t);
  }
  static floor(t, e) {
    return ((t.x = Math.floor(e.x)), (t.y = Math.floor(e.y)), t);
  }
  static min(t, e, r) {
    return ((t.x = Math.min(e.x, r.x)), (t.y = Math.min(e.y, r.y)), t);
  }
  static max(t, e, r) {
    return ((t.x = Math.max(e.x, r.x)), (t.y = Math.max(e.y, r.y)), t);
  }
  static round(t, e) {
    return ((t.x = Math.round(e.x)), (t.y = Math.round(e.y)), t);
  }
  static multiplyScalar(t, e, r) {
    return ((t.x = e.x * r), (t.y = e.y * r), t);
  }
  static scaleAndAdd(t, e, r, s) {
    return ((t.x = e.x + r.x * s), (t.y = e.y + r.y * s), t);
  }
  static distance(t, e) {
    return ((_x = e.x - t.x), (_y = e.y - t.y), Math.sqrt(_x * _x + _y * _y));
  }
  static squaredDistance(t, e) {
    return ((_x = e.x - t.x), (_y = e.y - t.y), _x * _x + _y * _y);
  }
  static len(t) {
    return ((_x = t.x), (_y = t.y), Math.sqrt(_x * _x + _y * _y));
  }
  static lengthSqr(t) {
    return ((_x = t.x), (_y = t.y), _x * _x + _y * _y);
  }
  static negate(t, e) {
    return ((t.x = -e.x), (t.y = -e.y), t);
  }
  static inverse(t, e) {
    return ((t.x = 1 / e.x), (t.y = 1 / e.y), t);
  }
  static inverseSafe(t, e) {
    return (
      (_x = e.x),
      (_y = e.y),
      Math.abs(_x) < utils_1.EPSILON ? (t.x = 0) : (t.x = 1 / _x),
      Math.abs(_y) < utils_1.EPSILON ? (t.y = 0) : (t.y = 1 / _y),
      t
    );
  }
  static normalize(t, e) {
    return (
      (_x = e.x),
      (_y = e.y),
      0 < (e = _x * _x + _y * _y) &&
        ((e = 1 / Math.sqrt(e)), (t.x = _x * e), (t.y = _y * e)),
      t
    );
  }
  static dot(t, e) {
    return t.x * e.x + t.y * e.y;
  }
  static cross(t, e, r) {
    return ((t.x = t.y = 0), (t.z = e.x * r.y - e.y * r.x), t);
  }
  static lerp(t, e, r, s) {
    return (
      (_x = e.x),
      (_y = e.y),
      (t.x = _x + s * (r.x - _x)),
      (t.y = _y + s * (r.y - _y)),
      t
    );
  }
  static random(t, e) {
    e = e || 1;
    var r = 2 * (0, utils_1.random)() * Math.PI;
    return ((t.x = Math.cos(r) * e), (t.y = Math.sin(r) * e), t);
  }
  static transformMat3(t, e, r) {
    return (
      (_x = e.x),
      (_y = e.y),
      (e = r.m),
      (t.x = e[0] * _x + e[3] * _y + e[6]),
      (t.y = e[1] * _x + e[4] * _y + e[7]),
      t
    );
  }
  static transformMat4(t, e, r) {
    return (
      (_x = e.x),
      (_y = e.y),
      (e = r.m),
      (t.x = e[0] * _x + e[4] * _y + e[12]),
      (t.y = e[1] * _x + e[5] * _y + e[13]),
      t
    );
  }
  static strictEquals(t, e) {
    return t.x === e.x && t.y === e.y;
  }
  static equals(t, e, r = utils_1.EPSILON) {
    return (
      Math.abs(t.x - e.x) <= r * Math.max(1, Math.abs(t.x), Math.abs(e.x)) &&
      Math.abs(t.y - e.y) <= r * Math.max(1, Math.abs(t.y), Math.abs(e.y))
    );
  }
  static angle(t, e) {
    return (
      Vec2.normalize(v2_1, t),
      Vec2.normalize(v2_2, e),
      1 < (t = Vec2.dot(v2_1, v2_2)) ? 0 : t < -1 ? Math.PI : Math.acos(t)
    );
  }
  static toArray(t, e, r = 0) {
    return ((t[r + 0] = e.x), (t[r + 1] = e.y), t);
  }
  static fromArray(t, e, r = 0) {
    return ((t.x = e[r + 0]), (t.y = e[r + 1]), t);
  }
  constructor(t = 0, e = 0) {
    (super(),
      (this.mag = Vec2.prototype.len),
      (this.magSqr = Vec2.prototype.lengthSqr),
      (this.subSelf = Vec2.prototype.subtract),
      (this.mulSelf = Vec2.prototype.multiplyScalar),
      (this.divSelf = Vec2.prototype.divide),
      (this.scaleSelf = Vec2.prototype.multiply),
      (this.negSelf = Vec2.prototype.negate),
      (this.z = 0),
      t && "object" == typeof t
        ? ((this.x = t.x || 0), (this.y = t.y || 0))
        : ((this.x = t || 0), (this.y = e || 0)));
  }
  clone() {
    return new Vec2(this.x, this.y);
  }
  set(t) {
    return ((this.x = t.x), (this.y = t.y), this);
  }
  equals(t) {
    return t && this.x === t.x && this.y === t.y;
  }
  fuzzyEquals(t, e) {
    return (
      this.x - e <= t.x &&
      t.x <= this.x + e &&
      this.y - e <= t.y &&
      t.y <= this.y + e
    );
  }
  toString() {
    return "(" + this.x.toFixed(2) + ", " + this.y.toFixed(2) + ")";
  }
  lerp(t, e, r) {
    r = r || new Vec2();
    var s = this.x,
      i = this.y;
    return ((r.x = s + (t.x - s) * e), (r.y = i + (t.y - i) * e), r);
  }
  clampf(t, e) {
    return (
      (this.x = misc_1.default.clampf(this.x, t.x, e.x)),
      (this.y = misc_1.default.clampf(this.y, t.y, e.y)),
      this
    );
  }
  add(t, e) {
    return (((e = e || new Vec2()).x = this.x + t.x), (e.y = this.y + t.y), e);
  }
  addSelf(t) {
    return ((this.x += t.x), (this.y += t.y), this);
  }
  subtract(t) {
    return ((this.x -= t.x), (this.y -= t.y), this);
  }
  multiplyScalar(t) {
    return ((this.x *= t), (this.y *= t), this);
  }
  multiply(t) {
    return ((this.x *= t.x), (this.y *= t.y), this);
  }
  divide(t) {
    return ((this.x /= t), (this.y /= t), this);
  }
  negate() {
    return ((this.x = -this.x), (this.y = -this.y), this);
  }
  dot(t) {
    return this.x * t.x + this.y * t.y;
  }
  cross(t) {
    return this.x * t.y - this.y * t.x;
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  lengthSqr() {
    return this.x * this.x + this.y * this.y;
  }
  normalizeSelf() {
    var t = this.x * this.x + this.y * this.y;
    return (
      1 != t &&
        0 != t &&
        ((t = 1 / Math.sqrt(t)), (this.x *= t), (this.y *= t)),
      this
    );
  }
  normalize(t) {
    return (
      ((t = t || new Vec2()).x = this.x),
      (t.y = this.y),
      t.normalizeSelf(),
      t
    );
  }
  angle(t) {
    var e = this.magSqr(),
      r = t.magSqr();
    return 0 === e || 0 === r
      ? (console.warn("Can't get angle between zero vector"), 0)
      : ((t = this.dot(t) / Math.sqrt(e * r)),
        (t = misc_1.default.clampf(t, -1, 1)),
        Math.acos(t));
  }
  signAngle(t) {
    var e = this.angle(t);
    return this.cross(t) < 0 ? -e : e;
  }
  rotate(t, e) {
    return (
      ((e = e || new Vec2()).x = this.x),
      (e.y = this.y),
      e.rotateSelf(t)
    );
  }
  rotateSelf(t) {
    var e = Math.sin(t),
      t = Math.cos(t),
      r = this.x;
    return ((this.x = t * r - e * this.y), (this.y = e * r + t * this.y), this);
  }
  project(t) {
    return t.multiplyScalar(this.dot(t) / t.dot(t));
  }
  transformMat4(t, e) {
    return ((e = e || new Vec2()), Vec2.transformMat4(e, this, t), e);
  }
  maxAxis() {
    return Math.max(this.x, this.y);
  }
}
((Vec2.sub = Vec2.subtract),
  (Vec2.mul = Vec2.multiply),
  (Vec2.scale = Vec2.multiplyScalar),
  (Vec2.mag = Vec2.len),
  (Vec2.squaredMagnitude = Vec2.lengthSqr),
  (Vec2.div = Vec2.divide),
  (Vec2.ONE_R = Vec2.ONE),
  (Vec2.ZERO_R = Vec2.ZERO),
  (Vec2.UP_R = Vec2.UP),
  (Vec2.RIGHT_R = Vec2.RIGHT));
let v2_1 = new (exports.default = Vec2)(),
  v2_2 = new Vec2();
