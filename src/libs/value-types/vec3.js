var __importDefault =
  (this && this.__importDefault) ||
  function (t) {
    return t && t.__esModule ? t : { default: t };
  };
Object.defineProperty(exports, "__esModule", { value: !0 });
let value_type_1 = __importDefault(require("./value-type")),
  misc_1 = __importDefault(require("../misc")),
  vec2_1 = __importDefault(require("./vec2")),
  utils_1 = require("./utils"),
  _x = 0,
  _y = 0,
  _z = 0;
class Vec3 extends value_type_1.default {
  sub(t, e) {
    return Vec3.subtract(e || new Vec3(), this, t);
  }
  mul(t, e) {
    return Vec3.multiplyScalar(e || new Vec3(), this, t);
  }
  div(t, e) {
    return Vec3.multiplyScalar(e || new Vec3(), this, 1 / t);
  }
  scale(t, e) {
    return Vec3.multiply(e || new Vec3(), this, t);
  }
  neg(t) {
    return Vec3.negate(t || new Vec3(), this);
  }
  static get ONE() {
    return new Vec3(1, 1, 1);
  }
  static get ZERO() {
    return new Vec3();
  }
  static get UP() {
    return new Vec3(0, 1, 0);
  }
  static get RIGHT() {
    return new Vec3(1, 0, 0);
  }
  static get FORWARD() {
    return new Vec3(0, 0, 1);
  }
  static zero(t) {
    return ((t.x = 0), (t.y = 0), (t.z = 0), t);
  }
  static clone(t) {
    return new Vec3(t.x, t.y, t.z);
  }
  static copy(t, e) {
    return ((t.x = e.x), (t.y = e.y), (t.z = e.z), t);
  }
  static set(t, e, r, s) {
    return ((t.x = e), (t.y = r), (t.z = s), t);
  }
  static add(t, e, r) {
    return ((t.x = e.x + r.x), (t.y = e.y + r.y), (t.z = e.z + r.z), t);
  }
  static subtract(t, e, r) {
    return ((t.x = e.x - r.x), (t.y = e.y - r.y), (t.z = e.z - r.z), t);
  }
  static multiply(t, e, r) {
    return ((t.x = e.x * r.x), (t.y = e.y * r.y), (t.z = e.z * r.z), t);
  }
  static divide(t, e, r) {
    return ((t.x = e.x / r.x), (t.y = e.y / r.y), (t.z = e.z / r.z), t);
  }
  static ceil(t, e) {
    return (
      (t.x = Math.ceil(e.x)),
      (t.y = Math.ceil(e.y)),
      (t.z = Math.ceil(e.z)),
      t
    );
  }
  static floor(t, e) {
    return (
      (t.x = Math.floor(e.x)),
      (t.y = Math.floor(e.y)),
      (t.z = Math.floor(e.z)),
      t
    );
  }
  static min(t, e, r) {
    return (
      (t.x = Math.min(e.x, r.x)),
      (t.y = Math.min(e.y, r.y)),
      (t.z = Math.min(e.z, r.z)),
      t
    );
  }
  static max(t, e, r) {
    return (
      (t.x = Math.max(e.x, r.x)),
      (t.y = Math.max(e.y, r.y)),
      (t.z = Math.max(e.z, r.z)),
      t
    );
  }
  static round(t, e) {
    return (
      (t.x = Math.round(e.x)),
      (t.y = Math.round(e.y)),
      (t.z = Math.round(e.z)),
      t
    );
  }
  static multiplyScalar(t, e, r) {
    return ((t.x = e.x * r), (t.y = e.y * r), (t.z = e.z * r), t);
  }
  static scaleAndAdd(t, e, r, s) {
    return (
      (t.x = e.x + r.x * s),
      (t.y = e.y + r.y * s),
      (t.z = e.z + r.z * s),
      t
    );
  }
  static distance(t, e) {
    return (
      (_x = e.x - t.x),
      (_y = e.y - t.y),
      (_z = e.z - t.z),
      Math.sqrt(_x * _x + _y * _y + _z * _z)
    );
  }
  static squaredDistance(t, e) {
    return (
      (_x = e.x - t.x),
      (_y = e.y - t.y),
      (_z = e.z - t.z),
      _x * _x + _y * _y + _z * _z
    );
  }
  static len(t) {
    return (
      (_x = t.x),
      (_y = t.y),
      (_z = t.z),
      Math.sqrt(_x * _x + _y * _y + _z * _z)
    );
  }
  static lengthSqr(t) {
    return ((_x = t.x), (_y = t.y), (_z = t.z), _x * _x + _y * _y + _z * _z);
  }
  static negate(t, e) {
    return ((t.x = -e.x), (t.y = -e.y), (t.z = -e.z), t);
  }
  static inverse(t, e) {
    return ((t.x = 1 / e.x), (t.y = 1 / e.y), (t.z = 1 / e.z), t);
  }
  static inverseSafe(t, e) {
    return (
      (_x = e.x),
      (_y = e.y),
      (_z = e.z),
      Math.abs(_x) < utils_1.EPSILON ? (t.x = 0) : (t.x = 1 / _x),
      Math.abs(_y) < utils_1.EPSILON ? (t.y = 0) : (t.y = 1 / _y),
      Math.abs(_z) < utils_1.EPSILON ? (t.z = 0) : (t.z = 1 / _z),
      t
    );
  }
  static normalize(t, e) {
    return (
      (_x = e.x),
      (_y = e.y),
      (_z = e.z),
      0 < (e = _x * _x + _y * _y + _z * _z) &&
        ((e = 1 / Math.sqrt(e)),
        (t.x = _x * e),
        (t.y = _y * e),
        (t.z = _z * e)),
      t
    );
  }
  static dot(t, e) {
    return t.x * e.x + t.y * e.y + t.z * e.z;
  }
  static cross(t, e, r) {
    var { x: e, y: s, z: a } = e,
      { x: r, y: i, z: y } = r;
    return (
      (t.x = s * y - a * i),
      (t.y = a * r - e * y),
      (t.z = e * i - s * r),
      t
    );
  }
  static lerp(t, e, r, s) {
    return (
      (t.x = e.x + s * (r.x - e.x)),
      (t.y = e.y + s * (r.y - e.y)),
      (t.z = e.z + s * (r.z - e.z)),
      t
    );
  }
  static random(t, e) {
    e = e || 1;
    var r = 2 * (0, utils_1.random)() * Math.PI,
      s = 2 * (0, utils_1.random)() - 1,
      a = Math.sqrt(1 - s * s);
    return (
      (t.x = a * Math.cos(r) * e),
      (t.y = a * Math.sin(r) * e),
      (t.z = s * e),
      t
    );
  }
  static transformMat4(t, e, r) {
    return (
      (_x = e.x),
      (_y = e.y),
      (_z = e.z),
      (r = (r = (e = r.m)[3] * _x + e[7] * _y + e[11] * _z + e[15])
        ? 1 / r
        : 1),
      (t.x = (e[0] * _x + e[4] * _y + e[8] * _z + e[12]) * r),
      (t.y = (e[1] * _x + e[5] * _y + e[9] * _z + e[13]) * r),
      (t.z = (e[2] * _x + e[6] * _y + e[10] * _z + e[14]) * r),
      t
    );
  }
  static transformMat4Normal(t, e, r) {
    return (
      (_x = e.x),
      (_y = e.y),
      (_z = e.z),
      (r = (r = (e = r.m)[3] * _x + e[7] * _y + e[11] * _z) ? 1 / r : 1),
      (t.x = (e[0] * _x + e[4] * _y + e[8] * _z) * r),
      (t.y = (e[1] * _x + e[5] * _y + e[9] * _z) * r),
      (t.z = (e[2] * _x + e[6] * _y + e[10] * _z) * r),
      t
    );
  }
  static transformMat3(t, e, r) {
    return (
      (_x = e.x),
      (_y = e.y),
      (_z = e.z),
      (e = r.m),
      (t.x = _x * e[0] + _y * e[3] + _z * e[6]),
      (t.y = _x * e[1] + _y * e[4] + _z * e[7]),
      (t.z = _x * e[2] + _y * e[5] + _z * e[8]),
      t
    );
  }
  static transformAffine(t, e, r) {
    return (
      (_x = e.x),
      (_y = e.y),
      (_z = e.z),
      (e = r.m),
      (t.x = e[0] * _x + e[1] * _y + e[2] * _z + e[3]),
      (t.y = e[4] * _x + e[5] * _y + e[6] * _z + e[7]),
      (t.x = e[8] * _x + e[9] * _y + e[10] * _z + e[11]),
      t
    );
  }
  static transformQuat(t, e, r) {
    var s = r.w * e.x + r.y * e.z - r.z * e.y,
      a = r.w * e.y + r.z * e.x - r.x * e.z,
      i = r.w * e.z + r.x * e.y - r.y * e.x,
      e = -r.x * e.x - r.y * e.y - r.z * e.z;
    return (
      (t.x = s * r.w + e * -r.x + a * -r.z - i * -r.y),
      (t.y = a * r.w + e * -r.y + i * -r.x - s * -r.z),
      (t.z = i * r.w + e * -r.z + s * -r.y - a * -r.x),
      t
    );
  }
  static transformRTS(t, e, r, s, a) {
    var i = e.x * a.x,
      y = e.y * a.y,
      e = e.z * a.z,
      a = r.w * i + r.y * e - r.z * y,
      x = r.w * y + r.z * i - r.x * e,
      z = r.w * e + r.x * y - r.y * i;
    return (
      (t.x =
        a * r.w +
        (i = -r.x * i - r.y * y - r.z * e) * -r.x +
        x * -r.z -
        z * -r.y +
        s.x),
      (t.y = x * r.w + i * -r.y + z * -r.x - a * -r.z + s.y),
      (t.z = z * r.w + i * -r.z + a * -r.y - x * -r.x + s.z),
      t
    );
  }
  static transformInverseRTS(t, e, r, s, a) {
    var i = e.x - s.x,
      y = e.y - s.y,
      e = e.z - s.z,
      s = r.w * i - r.y * e + r.z * y,
      x = r.w * y - r.z * i + r.x * e,
      z = r.w * e - r.x * y + r.y * i;
    return (
      (t.x =
        (s * r.w +
          (i = r.x * i + r.y * y + r.z * e) * r.x +
          x * r.z -
          z * r.y) /
        a.x),
      (t.y = (x * r.w + i * r.y + z * r.x - s * r.z) / a.y),
      (t.z = (z * r.w + i * r.z + s * r.y - x * r.x) / a.z),
      t
    );
  }
  static rotateX(t, e, r, s) {
    ((_x = e.x - r.x), (_y = e.y - r.y), (_z = e.z - r.z));
    var e = Math.cos(s),
      s = Math.sin(s),
      a = _x,
      i = _y * e - _z * s,
      s = _y * s + _z * e;
    return ((t.x = a + r.x), (t.y = i + r.y), (t.z = s + r.z), t);
  }
  static rotateY(t, e, r, s) {
    ((_x = e.x - r.x), (_y = e.y - r.y), (_z = e.z - r.z));
    var e = Math.cos(s),
      s = Math.sin(s),
      a = _z * s + _x * e,
      i = _y,
      e = _z * e - _x * s;
    return ((t.x = a + r.x), (t.y = i + r.y), (t.z = e + r.z), t);
  }
  static rotateZ(t, e, r, s) {
    ((_x = e.x - r.x), (_y = e.y - r.y), (_z = e.z - r.z));
    var e = Math.cos(s),
      s = Math.sin(s),
      a = _x * e - _y * s,
      s = _x * s + _y * e,
      e = _z;
    return ((t.x = a + r.x), (t.y = s + r.y), (t.z = e + r.z), t);
  }
  static strictEquals(t, e) {
    return t.x === e.x && t.y === e.y && t.z === e.z;
  }
  static equals(t, e, r = utils_1.EPSILON) {
    var { x: t, y: s, z: a } = t,
      { x: e, y: i, z: y } = e;
    return (
      Math.abs(t - e) <= r * Math.max(1, Math.abs(t), Math.abs(e)) &&
      Math.abs(s - i) <= r * Math.max(1, Math.abs(s), Math.abs(i)) &&
      Math.abs(a - y) <= r * Math.max(1, Math.abs(a), Math.abs(y))
    );
  }
  static angle(t, e) {
    return (
      Vec3.normalize(v3_1, t),
      Vec3.normalize(v3_2, e),
      1 < (t = Vec3.dot(v3_1, v3_2)) ? 0 : t < -1 ? Math.PI : Math.acos(t)
    );
  }
  static projectOnPlane(t, e, r) {
    return Vec3.subtract(t, e, Vec3.project(t, e, r));
  }
  static project(t, e, r) {
    var s = Vec3.lengthSqr(r);
    return s < 1e-6
      ? Vec3.set(t, 0, 0, 0)
      : Vec3.multiplyScalar(t, r, Vec3.dot(e, r) / s);
  }
  static toArray(t, e, r = 0) {
    return ((t[r + 0] = e.x), (t[r + 1] = e.y), (t[r + 2] = e.z), t);
  }
  static fromArray(t, e, r = 0) {
    return ((t.x = e[r + 0]), (t.y = e[r + 1]), (t.z = e[r + 2]), t);
  }
  constructor(t = 0, e = 0, r = 0) {
    (super(),
      (this.mag = Vec3.prototype.len),
      (this.magSqr = Vec3.prototype.lengthSqr),
      (this.subSelf = Vec3.prototype.subtract),
      (this.mulSelf = Vec3.prototype.multiplyScalar),
      (this.divSelf = Vec3.prototype.divide),
      (this.scaleSelf = Vec3.prototype.multiply),
      (this.negSelf = Vec3.prototype.negate),
      (this.angle = vec2_1.default.prototype.angle),
      (this.project = vec2_1.default.prototype.project),
      t && "object" == typeof t
        ? ((this.x = t.x), (this.y = t.y), (this.z = t.z))
        : ((this.x = t), (this.y = e), (this.z = r)));
  }
  clone() {
    return new Vec3(this.x, this.y, this.z);
  }
  set(t) {
    return ((this.x = t.x), (this.y = t.y), (this.z = t.z), this);
  }
  equals(t) {
    return t && this.x === t.x && this.y === t.y && this.z === t.z;
  }
  fuzzyEquals(t, e) {
    return (
      this.x - e <= t.x &&
      t.x <= this.x + e &&
      this.y - e <= t.y &&
      t.y <= this.y + e &&
      this.z - e <= t.z &&
      t.z <= this.z + e
    );
  }
  toString() {
    return (
      "(" +
      this.x.toFixed(2) +
      ", " +
      this.y.toFixed(2) +
      ", " +
      this.z.toFixed(2) +
      ")"
    );
  }
  lerp(t, e, r) {
    return ((r = r || new Vec3()), Vec3.lerp(r, this, t, e), r);
  }
  clampf(t, e) {
    return (
      (this.x = misc_1.default.clampf(this.x, t.x, e.x)),
      (this.y = misc_1.default.clampf(this.y, t.y, e.y)),
      (this.z = misc_1.default.clampf(this.z, t.z, e.z)),
      this
    );
  }
  addSelf(t) {
    return ((this.x += t.x), (this.y += t.y), (this.z += t.z), this);
  }
  add(t, e) {
    return (
      ((e = e || new Vec3()).x = this.x + t.x),
      (e.y = this.y + t.y),
      (e.z = this.z + t.z),
      e
    );
  }
  subtract(t) {
    return ((this.x -= t.x), (this.y -= t.y), (this.z -= t.z), this);
  }
  multiplyScalar(t) {
    return ((this.x *= t), (this.y *= t), (this.z *= t), this);
  }
  multiply(t) {
    return ((this.x *= t.x), (this.y *= t.y), (this.z *= t.z), this);
  }
  divide(t) {
    return ((this.x /= t), (this.y /= t), (this.z /= t), this);
  }
  negate() {
    return ((this.x = -this.x), (this.y = -this.y), (this.z = -this.z), this);
  }
  dot(t) {
    return this.x * t.x + this.y * t.y + this.z * t.z;
  }
  cross(t, e) {
    return ((e = e || new Vec3()), Vec3.cross(e, this, t), e);
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  lengthSqr() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  normalizeSelf() {
    return (Vec3.normalize(this, this), this);
  }
  normalize(t) {
    return ((t = t || new Vec3()), Vec3.normalize(t, this), t);
  }
  transformMat4(t, e) {
    return ((e = e || new Vec3()), Vec3.transformMat4(e, this, t), e);
  }
  maxAxis() {
    return Math.max(this.x, this.y, this.z);
  }
  signAngle(t) {
    var e = new vec2_1.default(this.x, this.y),
      t = new vec2_1.default(t.x, t.y);
    return e.signAngle(t);
  }
  rotate(t, e) {
    return vec2_1.default.prototype.rotate.call(this, t, e);
  }
  rotateSelf(t) {
    return vec2_1.default.prototype.rotateSelf.call(this, t);
  }
}
((Vec3.sub = Vec3.subtract),
  (Vec3.mul = Vec3.multiply),
  (Vec3.scale = Vec3.multiplyScalar),
  (Vec3.mag = Vec3.len),
  (Vec3.squaredMagnitude = Vec3.lengthSqr),
  (Vec3.div = Vec3.divide),
  (Vec3.ONE_R = Vec3.ONE),
  (Vec3.ZERO_R = Vec3.ZERO),
  (Vec3.UP_R = Vec3.UP),
  (Vec3.RIGHT_R = Vec3.RIGHT),
  (Vec3.FRONT_R = Vec3.FORWARD));
let v3_1 = new (exports.default = Vec3)(),
  v3_2 = new Vec3();
