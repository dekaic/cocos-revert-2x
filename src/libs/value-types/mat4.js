var __importDefault =
  (this && this.__importDefault) ||
  function (a) {
    return a && a.__esModule ? a : { default: a };
  };
Object.defineProperty(exports, "__esModule", { value: !0 });
let value_type_1 = __importDefault(require("./value-type")),
  vec3_1 = __importDefault(require("./vec3")),
  quat_1 = __importDefault(require("./quat")),
  utils_1 = require("./utils"),
  mat3_1 = __importDefault(require("./mat3")),
  _a00 = 0,
  _a01 = 0,
  _a02 = 0,
  _a03 = 0,
  _a10 = 0,
  _a11 = 0,
  _a12 = 0,
  _a13 = 0,
  _a20 = 0,
  _a21 = 0,
  _a22 = 0,
  _a23 = 0,
  _a30 = 0,
  _a31 = 0,
  _a32 = 0,
  _a33 = 0;
class Mat4 extends value_type_1.default {
  mul(a, t) {
    return Mat4.multiply(t || new Mat4(), this, a);
  }
  mulScalar(a, t) {
    Mat4.multiplyScalar(t || new Mat4(), this, a);
  }
  sub(a, t) {
    Mat4.subtract(t || new Mat4(), this, a);
  }
  static clone(a) {
    return (
      (a = a.m),
      new Mat4(
        a[0],
        a[1],
        a[2],
        a[3],
        a[4],
        a[5],
        a[6],
        a[7],
        a[8],
        a[9],
        a[10],
        a[11],
        a[12],
        a[13],
        a[14],
        a[15],
      )
    );
  }
  static copy(a, t) {
    var _ = a.m,
      t = t.m;
    return (
      (_[0] = t[0]),
      (_[1] = t[1]),
      (_[2] = t[2]),
      (_[3] = t[3]),
      (_[4] = t[4]),
      (_[5] = t[5]),
      (_[6] = t[6]),
      (_[7] = t[7]),
      (_[8] = t[8]),
      (_[9] = t[9]),
      (_[10] = t[10]),
      (_[11] = t[11]),
      (_[12] = t[12]),
      (_[13] = t[13]),
      (_[14] = t[14]),
      (_[15] = t[15]),
      a
    );
  }
  static set(a, t, _, r, e, s, n, i, m, u, M, h, l, c, o, v, b) {
    var y = a.m;
    return (
      (y[0] = t),
      (y[1] = _),
      (y[2] = r),
      (y[3] = e),
      (y[4] = s),
      (y[5] = n),
      (y[6] = i),
      (y[7] = m),
      (y[8] = u),
      (y[9] = M),
      (y[10] = h),
      (y[11] = l),
      (y[12] = c),
      (y[13] = o),
      (y[14] = v),
      (y[15] = b),
      a
    );
  }
  static identity(a) {
    var t = a.m;
    return (
      (t[0] = 1),
      (t[1] = 0),
      (t[2] = 0),
      (t[3] = 0),
      (t[4] = 0),
      (t[5] = 1),
      (t[6] = 0),
      (t[7] = 0),
      (t[8] = 0),
      (t[9] = 0),
      (t[10] = 1),
      (t[11] = 0),
      (t[12] = 0),
      (t[13] = 0),
      (t[14] = 0),
      (t[15] = 1),
      a
    );
  }
  static transpose(a, t) {
    var _,
      r,
      e,
      s,
      n,
      i = a.m,
      m = t.m;
    return (
      a === t
        ? ((t = m[1]),
          (_ = m[2]),
          (r = m[3]),
          (e = m[6]),
          (s = m[7]),
          (n = m[11]),
          (i[1] = m[4]),
          (i[2] = m[8]),
          (i[3] = m[12]),
          (i[4] = t),
          (i[6] = m[9]),
          (i[7] = m[13]),
          (i[8] = _),
          (i[9] = e),
          (i[11] = m[14]),
          (i[12] = r),
          (i[13] = s),
          (i[14] = n))
        : ((i[0] = m[0]),
          (i[1] = m[4]),
          (i[2] = m[8]),
          (i[3] = m[12]),
          (i[4] = m[1]),
          (i[5] = m[5]),
          (i[6] = m[9]),
          (i[7] = m[13]),
          (i[8] = m[2]),
          (i[9] = m[6]),
          (i[10] = m[10]),
          (i[11] = m[14]),
          (i[12] = m[3]),
          (i[13] = m[7]),
          (i[14] = m[11]),
          (i[15] = m[15])),
      a
    );
  }
  static invert(a, t) {
    var _,
      r,
      t = t.m,
      t =
        ((_a00 = t[0]),
        (_a01 = t[1]),
        (_a02 = t[2]),
        (_a03 = t[3]),
        (_a10 = t[4]),
        (_a11 = t[5]),
        (_a12 = t[6]),
        (_a13 = t[7]),
        (_a20 = t[8]),
        (_a21 = t[9]),
        (_a22 = t[10]),
        (_a23 = t[11]),
        (_a30 = t[12]),
        (_a31 = t[13]),
        (_a32 = t[14]),
        (_a33 = t[15]),
        _a00 * _a11 - _a01 * _a10),
      e = _a00 * _a12 - _a02 * _a10,
      s = _a00 * _a13 - _a03 * _a10,
      n = _a01 * _a12 - _a02 * _a11,
      i = _a01 * _a13 - _a03 * _a11,
      m = _a02 * _a13 - _a03 * _a12,
      u = _a20 * _a31 - _a21 * _a30,
      M = _a20 * _a32 - _a22 * _a30,
      h = _a20 * _a33 - _a23 * _a30,
      l = _a21 * _a32 - _a22 * _a31,
      c = _a21 * _a33 - _a23 * _a31,
      o = _a22 * _a33 - _a23 * _a32;
    return 0 == (_ = t * o - e * c + s * l + n * h - i * M + m * u)
      ? null
      : ((_ = 1 / _),
        ((r = a.m)[0] = (_a11 * o - _a12 * c + _a13 * l) * _),
        (r[1] = (_a02 * c - _a01 * o - _a03 * l) * _),
        (r[2] = (_a31 * m - _a32 * i + _a33 * n) * _),
        (r[3] = (_a22 * i - _a21 * m - _a23 * n) * _),
        (r[4] = (_a12 * h - _a10 * o - _a13 * M) * _),
        (r[5] = (_a00 * o - _a02 * h + _a03 * M) * _),
        (r[6] = (_a32 * s - _a30 * m - _a33 * e) * _),
        (r[7] = (_a20 * m - _a22 * s + _a23 * e) * _),
        (r[8] = (_a10 * c - _a11 * h + _a13 * u) * _),
        (r[9] = (_a01 * h - _a00 * c - _a03 * u) * _),
        (r[10] = (_a30 * i - _a31 * s + _a33 * t) * _),
        (r[11] = (_a21 * s - _a20 * i - _a23 * t) * _),
        (r[12] = (_a11 * M - _a10 * l - _a12 * u) * _),
        (r[13] = (_a00 * l - _a01 * M + _a02 * u) * _),
        (r[14] = (_a31 * e - _a30 * n - _a32 * t) * _),
        (r[15] = (_a20 * n - _a21 * e + _a22 * t) * _),
        a);
  }
  static determinant(a) {
    var a = a.m,
      a =
        ((_a00 = a[0]),
        (_a01 = a[1]),
        (_a02 = a[2]),
        (_a03 = a[3]),
        (_a10 = a[4]),
        (_a11 = a[5]),
        (_a12 = a[6]),
        (_a13 = a[7]),
        (_a20 = a[8]),
        (_a21 = a[9]),
        (_a22 = a[10]),
        (_a23 = a[11]),
        (_a30 = a[12]),
        (_a31 = a[13]),
        (_a32 = a[14]),
        (_a33 = a[15]),
        _a00 * _a11 - _a01 * _a10),
      t = _a00 * _a12 - _a02 * _a10,
      _ = _a00 * _a13 - _a03 * _a10,
      r = _a01 * _a12 - _a02 * _a11,
      e = _a01 * _a13 - _a03 * _a11,
      s = _a02 * _a13 - _a03 * _a12,
      n = _a20 * _a31 - _a21 * _a30,
      i = _a20 * _a32 - _a22 * _a30,
      m = _a20 * _a33 - _a23 * _a30,
      u = _a21 * _a32 - _a22 * _a31,
      M = _a21 * _a33 - _a23 * _a31;
    return (
      a * (_a22 * _a33 - _a23 * _a32) - t * M + _ * u + r * m - e * i + s * n
    );
  }
  static multiply(a, t, _) {
    var r = a.m,
      t = t.m,
      _ = _.m,
      t =
        ((_a00 = t[0]),
        (_a01 = t[1]),
        (_a02 = t[2]),
        (_a03 = t[3]),
        (_a10 = t[4]),
        (_a11 = t[5]),
        (_a12 = t[6]),
        (_a13 = t[7]),
        (_a20 = t[8]),
        (_a21 = t[9]),
        (_a22 = t[10]),
        (_a23 = t[11]),
        (_a30 = t[12]),
        (_a31 = t[13]),
        (_a32 = t[14]),
        (_a33 = t[15]),
        _[0]),
      e = _[1],
      s = _[2],
      n = _[3];
    return (
      (r[0] = t * _a00 + e * _a10 + s * _a20 + n * _a30),
      (r[1] = t * _a01 + e * _a11 + s * _a21 + n * _a31),
      (r[2] = t * _a02 + e * _a12 + s * _a22 + n * _a32),
      (r[3] = t * _a03 + e * _a13 + s * _a23 + n * _a33),
      (e = _[5]),
      (s = _[6]),
      (n = _[7]),
      (r[4] = (t = _[4]) * _a00 + e * _a10 + s * _a20 + n * _a30),
      (r[5] = t * _a01 + e * _a11 + s * _a21 + n * _a31),
      (r[6] = t * _a02 + e * _a12 + s * _a22 + n * _a32),
      (r[7] = t * _a03 + e * _a13 + s * _a23 + n * _a33),
      (e = _[9]),
      (s = _[10]),
      (n = _[11]),
      (r[8] = (t = _[8]) * _a00 + e * _a10 + s * _a20 + n * _a30),
      (r[9] = t * _a01 + e * _a11 + s * _a21 + n * _a31),
      (r[10] = t * _a02 + e * _a12 + s * _a22 + n * _a32),
      (r[11] = t * _a03 + e * _a13 + s * _a23 + n * _a33),
      (e = _[13]),
      (s = _[14]),
      (n = _[15]),
      (r[12] = (t = _[12]) * _a00 + e * _a10 + s * _a20 + n * _a30),
      (r[13] = t * _a01 + e * _a11 + s * _a21 + n * _a31),
      (r[14] = t * _a02 + e * _a12 + s * _a22 + n * _a32),
      (r[15] = t * _a03 + e * _a13 + s * _a23 + n * _a33),
      a
    );
  }
  static transform(a, t, _) {
    var r = _.x,
      e = _.y,
      _ = _.z,
      s = a.m,
      n = t.m;
    return (
      t === a
        ? ((s[12] = n[0] * r + n[4] * e + n[8] * _ + n[12]),
          (s[13] = n[1] * r + n[5] * e + n[9] * _ + n[13]),
          (s[14] = n[2] * r + n[6] * e + n[10] * _ + n[14]),
          (s[15] = n[3] * r + n[7] * e + n[11] * _ + n[15]))
        : ((_a00 = n[0]),
          (_a01 = n[1]),
          (_a02 = n[2]),
          (_a03 = n[3]),
          (_a10 = n[4]),
          (_a11 = n[5]),
          (_a12 = n[6]),
          (_a13 = n[7]),
          (_a20 = n[8]),
          (_a21 = n[9]),
          (_a22 = n[10]),
          (_a23 = n[11]),
          (_a30 = n[12]),
          (_a31 = n[13]),
          (_a32 = n[14]),
          (_a33 = n[15]),
          (s[0] = _a00),
          (s[1] = _a01),
          (s[2] = _a02),
          (s[3] = _a03),
          (s[4] = _a10),
          (s[5] = _a11),
          (s[6] = _a12),
          (s[7] = _a13),
          (s[8] = _a20),
          (s[9] = _a21),
          (s[10] = _a22),
          (s[11] = _a23),
          (s[12] = _a00 * r + _a10 * e + _a20 * _ + n[12]),
          (s[13] = _a01 * r + _a11 * e + _a21 * _ + n[13]),
          (s[14] = _a02 * r + _a12 * e + _a22 * _ + n[14]),
          (s[15] = _a03 * r + _a13 * e + _a23 * _ + n[15])),
      a
    );
  }
  static translate(a, t, _) {
    var r = a.m,
      e = t.m;
    return (
      t === a
        ? ((r[12] += _.x), (r[13] += _.y), (r[14] += _.z))
        : ((r[0] = e[0]),
          (r[1] = e[1]),
          (r[2] = e[2]),
          (r[3] = e[3]),
          (r[4] = e[4]),
          (r[5] = e[5]),
          (r[6] = e[6]),
          (r[7] = e[7]),
          (r[8] = e[8]),
          (r[9] = e[9]),
          (r[10] = e[10]),
          (r[11] = e[11]),
          (r[12] += _.x),
          (r[13] += _.y),
          (r[14] += _.z),
          (r[15] = e[15])),
      a
    );
  }
  static scale(a, t, _) {
    var r = _.x,
      e = _.y,
      _ = _.z,
      s = a.m,
      t = t.m;
    return (
      (s[0] = t[0] * r),
      (s[1] = t[1] * r),
      (s[2] = t[2] * r),
      (s[3] = t[3] * r),
      (s[4] = t[4] * e),
      (s[5] = t[5] * e),
      (s[6] = t[6] * e),
      (s[7] = t[7] * e),
      (s[8] = t[8] * _),
      (s[9] = t[9] * _),
      (s[10] = t[10] * _),
      (s[11] = t[11] * _),
      (s[12] = t[12]),
      (s[13] = t[13]),
      (s[14] = t[14]),
      (s[15] = t[15]),
      a
    );
  }
  static rotate(a, t, _, r) {
    var e = r.x,
      s = r.y,
      r = r.z,
      n = Math.sqrt(e * e + s * s + r * r);
    if (Math.abs(n) < utils_1.EPSILON) return null;
    ((e *= n = 1 / n), (s *= n), (r *= n));
    var n = Math.sin(_),
      i = 1 - (_ = Math.cos(_)),
      m = t.m,
      u =
        ((_a00 = m[0]),
        (_a01 = m[1]),
        (_a02 = m[2]),
        (_a03 = m[3]),
        (_a10 = m[4]),
        (_a11 = m[5]),
        (_a12 = m[6]),
        (_a13 = m[7]),
        (_a20 = m[8]),
        (_a21 = m[9]),
        (_a22 = m[10]),
        (_a23 = m[11]),
        e * e * i + _),
      M = s * e * i + r * n,
      h = r * e * i - s * n,
      l = e * s * i - r * n,
      c = s * s * i + _,
      o = r * s * i + e * n,
      v = e * r * i + s * n,
      s = s * r * i - e * n,
      e = r * r * i + _;
    return (
      ((n = a.m)[0] = _a00 * u + _a10 * M + _a20 * h),
      (n[1] = _a01 * u + _a11 * M + _a21 * h),
      (n[2] = _a02 * u + _a12 * M + _a22 * h),
      (n[3] = _a03 * u + _a13 * M + _a23 * h),
      (n[4] = _a00 * l + _a10 * c + _a20 * o),
      (n[5] = _a01 * l + _a11 * c + _a21 * o),
      (n[6] = _a02 * l + _a12 * c + _a22 * o),
      (n[7] = _a03 * l + _a13 * c + _a23 * o),
      (n[8] = _a00 * v + _a10 * s + _a20 * e),
      (n[9] = _a01 * v + _a11 * s + _a21 * e),
      (n[10] = _a02 * v + _a12 * s + _a22 * e),
      (n[11] = _a03 * v + _a13 * s + _a23 * e),
      t !== a &&
        ((n[12] = m[12]), (n[13] = m[13]), (n[14] = m[14]), (n[15] = m[15])),
      a
    );
  }
  static rotateX(a, t, _) {
    var r = a.m,
      e = t.m,
      s = Math.sin(_),
      _ = Math.cos(_),
      n = e[4],
      i = e[5],
      m = e[6],
      u = e[7],
      M = e[8],
      h = e[9],
      l = e[10],
      c = e[11];
    return (
      t !== a &&
        ((r[0] = e[0]),
        (r[1] = e[1]),
        (r[2] = e[2]),
        (r[3] = e[3]),
        (r[12] = e[12]),
        (r[13] = e[13]),
        (r[14] = e[14]),
        (r[15] = e[15])),
      (r[4] = n * _ + M * s),
      (r[5] = i * _ + h * s),
      (r[6] = m * _ + l * s),
      (r[7] = u * _ + c * s),
      (r[8] = M * _ - n * s),
      (r[9] = h * _ - i * s),
      (r[10] = l * _ - m * s),
      (r[11] = c * _ - u * s),
      a
    );
  }
  static rotateY(a, t, _) {
    var r = a.m,
      e = t.m,
      s = Math.sin(_),
      _ = Math.cos(_),
      n = e[0],
      i = e[1],
      m = e[2],
      u = e[3],
      M = e[8],
      h = e[9],
      l = e[10],
      c = e[11];
    return (
      t !== a &&
        ((r[4] = e[4]),
        (r[5] = e[5]),
        (r[6] = e[6]),
        (r[7] = e[7]),
        (r[12] = e[12]),
        (r[13] = e[13]),
        (r[14] = e[14]),
        (r[15] = e[15])),
      (r[0] = n * _ - M * s),
      (r[1] = i * _ - h * s),
      (r[2] = m * _ - l * s),
      (r[3] = u * _ - c * s),
      (r[8] = n * s + M * _),
      (r[9] = i * s + h * _),
      (r[10] = m * s + l * _),
      (r[11] = u * s + c * _),
      a
    );
  }
  static rotateZ(a, t, _) {
    var r = t.m,
      e = a.m,
      s = Math.sin(_),
      _ = Math.cos(_),
      n = t.m[0],
      i = t.m[1],
      m = t.m[2],
      u = t.m[3],
      M = t.m[4],
      h = t.m[5],
      l = t.m[6],
      c = t.m[7];
    return (
      t !== a &&
        ((e[8] = r[8]),
        (e[9] = r[9]),
        (e[10] = r[10]),
        (e[11] = r[11]),
        (e[12] = r[12]),
        (e[13] = r[13]),
        (e[14] = r[14]),
        (e[15] = r[15])),
      (e[0] = n * _ + M * s),
      (e[1] = i * _ + h * s),
      (e[2] = m * _ + l * s),
      (e[3] = u * _ + c * s),
      (e[4] = M * _ - n * s),
      (e[5] = h * _ - i * s),
      (e[6] = l * _ - m * s),
      (e[7] = c * _ - u * s),
      a
    );
  }
  static fromTranslation(a, t) {
    var _ = a.m;
    return (
      (_[0] = 1),
      (_[1] = 0),
      (_[2] = 0),
      (_[3] = 0),
      (_[4] = 0),
      (_[5] = 1),
      (_[6] = 0),
      (_[7] = 0),
      (_[8] = 0),
      (_[9] = 0),
      (_[10] = 1),
      (_[11] = 0),
      (_[12] = t.x),
      (_[13] = t.y),
      (_[14] = t.z),
      (_[15] = 1),
      a
    );
  }
  static fromScaling(a, t) {
    var _ = a.m;
    return (
      (_[0] = t.x),
      (_[1] = 0),
      (_[2] = 0),
      (_[3] = 0),
      (_[4] = 0),
      (_[5] = t.y),
      (_[6] = 0),
      (_[7] = 0),
      (_[8] = 0),
      (_[9] = 0),
      (_[10] = t.z),
      (_[11] = 0),
      (_[12] = 0),
      (_[13] = 0),
      (_[14] = 0),
      (_[15] = 1),
      a
    );
  }
  static fromRotation(a, t, _) {
    var r = _.x,
      e = _.y,
      _ = _.z,
      s = Math.sqrt(r * r + e * e + _ * _);
    if (Math.abs(s) < utils_1.EPSILON) return null;
    ((r *= s = 1 / s), (e *= s), (_ *= s));
    var s = Math.sin(t),
      n = 1 - (t = Math.cos(t)),
      i = a.m;
    return (
      (i[0] = r * r * n + t),
      (i[1] = e * r * n + _ * s),
      (i[2] = _ * r * n - e * s),
      (i[3] = 0),
      (i[4] = r * e * n - _ * s),
      (i[5] = e * e * n + t),
      (i[6] = _ * e * n + r * s),
      (i[7] = 0),
      (i[8] = r * _ * n + e * s),
      (i[9] = e * _ * n - r * s),
      (i[10] = _ * _ * n + t),
      (i[11] = 0),
      (i[12] = 0),
      (i[13] = 0),
      (i[14] = 0),
      (i[15] = 1),
      a
    );
  }
  static fromXRotation(a, t) {
    var _ = Math.sin(t),
      t = Math.cos(t),
      r = a.m;
    return (
      (r[0] = 1),
      (r[1] = 0),
      (r[2] = 0),
      (r[3] = 0),
      (r[4] = 0),
      (r[5] = t),
      (r[6] = _),
      (r[7] = 0),
      (r[8] = 0),
      (r[9] = -_),
      (r[10] = t),
      (r[11] = 0),
      (r[12] = 0),
      (r[13] = 0),
      (r[14] = 0),
      (r[15] = 1),
      a
    );
  }
  static fromYRotation(a, t) {
    var _ = Math.sin(t),
      t = Math.cos(t),
      r = a.m;
    return (
      (r[0] = t),
      (r[1] = 0),
      (r[2] = -_),
      (r[3] = 0),
      (r[4] = 0),
      (r[5] = 1),
      (r[6] = 0),
      (r[7] = 0),
      (r[8] = _),
      (r[9] = 0),
      (r[10] = t),
      (r[11] = 0),
      (r[12] = 0),
      (r[13] = 0),
      (r[14] = 0),
      (r[15] = 1),
      a
    );
  }
  static fromZRotation(a, t) {
    var _ = Math.sin(t),
      t = Math.cos(t),
      r = a.m;
    return (
      (r[0] = t),
      (r[1] = _),
      (r[2] = 0),
      (r[3] = 0),
      (r[4] = -_),
      (r[5] = t),
      (r[6] = 0),
      (r[7] = 0),
      (r[8] = 0),
      (r[9] = 0),
      (r[10] = 1),
      (r[11] = 0),
      (r[12] = 0),
      (r[13] = 0),
      (r[14] = 0),
      (r[15] = 1),
      a
    );
  }
  static fromRT(a, t, _) {
    var r = t.x,
      e = (u = t.z) + u,
      s = r * (M = r + r),
      n = r * (h = (m = t.y) + m),
      r = r * e,
      i = m * h,
      m = m * e,
      u = u * e,
      M = (t = t.w) * M,
      h = t * h,
      t = t * e;
    return (
      ((e = a.m)[0] = 1 - (i + u)),
      (e[1] = n + t),
      (e[2] = r - h),
      (e[3] = 0),
      (e[4] = n - t),
      (e[5] = 1 - (s + u)),
      (e[6] = m + M),
      (e[7] = 0),
      (e[8] = r + h),
      (e[9] = m - M),
      (e[10] = 1 - (s + i)),
      (e[11] = 0),
      (e[12] = _.x),
      (e[13] = _.y),
      (e[14] = _.z),
      (e[15] = 1),
      a
    );
  }
  static getTranslation(a, t) {
    return ((t = t.m), (a.x = t[12]), (a.y = t[13]), (a.z = t[14]), a);
  }
  static getScaling(a, t) {
    var t = t.m,
      _ = ((M = m3_1.m)[0] = t[0]),
      r = (M[1] = t[1]),
      e = (M[2] = t[2]),
      s = (M[3] = t[4]),
      n = (M[4] = t[5]),
      i = (M[5] = t[6]),
      m = (M[6] = t[8]),
      u = (M[7] = t[9]),
      M = (M[8] = t[10]);
    return (
      (a.x = Math.sqrt(_ * _ + r * r + e * e)),
      (a.y = Math.sqrt(s * s + n * n + i * i)),
      (a.z = Math.sqrt(m * m + u * u + M * M)),
      mat3_1.default.determinant(m3_1) < 0 && (a.x *= -1),
      a
    );
  }
  static getRotation(a, t) {
    var _ = (t = t.m)[0] + t[5] + t[10];
    let r = 0;
    return (
      0 < _
        ? ((r = 2 * Math.sqrt(_ + 1)),
          (a.w = 0.25 * r),
          (a.x = (t[6] - t[9]) / r),
          (a.y = (t[8] - t[2]) / r),
          (a.z = (t[1] - t[4]) / r))
        : t[0] > t[5] && t[0] > t[10]
          ? ((r = 2 * Math.sqrt(1 + t[0] - t[5] - t[10])),
            (a.w = (t[6] - t[9]) / r),
            (a.x = 0.25 * r),
            (a.y = (t[1] + t[4]) / r),
            (a.z = (t[8] + t[2]) / r))
          : t[5] > t[10]
            ? ((r = 2 * Math.sqrt(1 + t[5] - t[0] - t[10])),
              (a.w = (t[8] - t[2]) / r),
              (a.x = (t[1] + t[4]) / r),
              (a.y = 0.25 * r),
              (a.z = (t[6] + t[9]) / r))
            : ((r = 2 * Math.sqrt(1 + t[10] - t[0] - t[5])),
              (a.w = (t[1] - t[4]) / r),
              (a.x = (t[8] + t[2]) / r),
              (a.y = (t[6] + t[9]) / r),
              (a.z = 0.25 * r)),
      a
    );
  }
  static toRTS(a, t, _, r) {
    var a = a.m,
      e = m3_1.m;
    ((r.x = vec3_1.default.set(v3_1, a[0], a[1], a[2]).mag()),
      (e[0] = a[0] / r.x),
      (e[1] = a[1] / r.x),
      (e[2] = a[2] / r.x),
      (r.y = vec3_1.default.set(v3_1, a[4], a[5], a[6]).mag()),
      (e[3] = a[4] / r.y),
      (e[4] = a[5] / r.y),
      (e[5] = a[6] / r.y),
      (r.z = vec3_1.default.set(v3_1, a[8], a[9], a[10]).mag()),
      (e[6] = a[8] / r.z),
      (e[7] = a[9] / r.z),
      (e[8] = a[10] / r.z),
      mat3_1.default.determinant(m3_1) < 0 &&
        ((r.x *= -1), (e[0] *= -1), (e[1] *= -1), (e[2] *= -1)),
      quat_1.default.fromMat3(t, m3_1),
      vec3_1.default.set(_, a[12], a[13], a[14]));
  }
  static fromRTS(a, t, _, r) {
    var e = (n = t.x) * (M = n + n),
      s = n * (h = (m = t.y) + m),
      n = n * (l = (u = t.z) + u),
      i = m * h,
      m = m * l,
      u = u * l,
      M = (t = t.w) * M,
      h = t * h,
      t = t * l,
      l = r.x,
      c = r.y,
      r = r.z,
      o = a.m;
    return (
      (o[0] = (1 - (i + u)) * l),
      (o[1] = (s + t) * l),
      (o[2] = (n - h) * l),
      (o[3] = 0),
      (o[4] = (s - t) * c),
      (o[5] = (1 - (e + u)) * c),
      (o[6] = (m + M) * c),
      (o[7] = 0),
      (o[8] = (n + h) * r),
      (o[9] = (m - M) * r),
      (o[10] = (1 - (e + i)) * r),
      (o[11] = 0),
      (o[12] = _.x),
      (o[13] = _.y),
      (o[14] = _.z),
      (o[15] = 1),
      a
    );
  }
  static fromRTSOrigin(a, t, _, r, e) {
    var s = (i = t.x) * (h = i + i),
      n = i * (l = (u = t.y) + u),
      i = i * (c = (M = t.z) + M),
      m = u * l,
      u = u * c,
      M = M * c,
      h = (t = t.w) * h,
      l = t * l,
      t = t * c,
      c = r.x,
      o = r.y,
      r = r.z,
      v = e.x,
      b = e.y,
      e = e.z,
      y = a.m;
    return (
      (y[0] = (1 - (m + M)) * c),
      (y[1] = (n + t) * c),
      (y[2] = (i - l) * c),
      (y[3] = 0),
      (y[4] = (n - t) * o),
      (y[5] = (1 - (s + M)) * o),
      (y[6] = (u + h) * o),
      (y[7] = 0),
      (y[8] = (i + l) * r),
      (y[9] = (u - h) * r),
      (y[10] = (1 - (s + m)) * r),
      (y[11] = 0),
      (y[12] = _.x + v - (y[0] * v + y[4] * b + y[8] * e)),
      (y[13] = _.y + b - (y[1] * v + y[5] * b + y[9] * e)),
      (y[14] = _.z + e - (y[2] * v + y[6] * b + y[10] * e)),
      (y[15] = 1),
      a
    );
  }
  static fromQuat(a, t) {
    var _ = t.x,
      r = (m = t.z) + m,
      _ = _ * (u = _ + _),
      e = (s = t.y) * u,
      s = s * (M = s + s),
      n = m * u,
      i = m * M,
      m = m * r,
      u = (t = t.w) * u,
      M = t * M,
      t = t * r;
    return (
      ((r = a.m)[0] = 1 - s - m),
      (r[1] = e + t),
      (r[2] = n - M),
      (r[3] = 0),
      (r[4] = e - t),
      (r[5] = 1 - _ - m),
      (r[6] = i + u),
      (r[7] = 0),
      (r[8] = n + M),
      (r[9] = i - u),
      (r[10] = 1 - _ - s),
      (r[11] = 0),
      (r[12] = 0),
      (r[13] = 0),
      (r[14] = 0),
      (r[15] = 1),
      a
    );
  }
  static frustum(a, t, _, r, e, s, n) {
    var i = 1 / (_ - t),
      m = 1 / (e - r),
      u = 1 / (s - n),
      M = a.m;
    return (
      (M[0] = 2 * s * i),
      (M[1] = 0),
      (M[2] = 0),
      (M[3] = 0),
      (M[4] = 0),
      (M[5] = 2 * s * m),
      (M[6] = 0),
      (M[7] = 0),
      (M[8] = (_ + t) * i),
      (M[9] = (e + r) * m),
      (M[10] = (n + s) * u),
      (M[11] = -1),
      (M[12] = 0),
      (M[13] = 0),
      (M[14] = n * s * 2 * u),
      (M[15] = 0),
      a
    );
  }
  static perspective(a, t, _, r, e) {
    var t = 1 / Math.tan(t / 2),
      s = 1 / (r - e),
      n = a.m;
    return (
      (n[0] = t / _),
      (n[1] = 0),
      (n[2] = 0),
      (n[3] = 0),
      (n[4] = 0),
      (n[5] = t),
      (n[6] = 0),
      (n[7] = 0),
      (n[8] = 0),
      (n[9] = 0),
      (n[10] = (e + r) * s),
      (n[11] = -1),
      (n[12] = 0),
      (n[13] = 0),
      (n[14] = 2 * e * r * s),
      (n[15] = 0),
      a
    );
  }
  static ortho(a, t, _, r, e, s, n) {
    var i = 1 / (t - _),
      m = 1 / (r - e),
      u = 1 / (s - n),
      M = a.m;
    return (
      (M[0] = -2 * i),
      (M[1] = 0),
      (M[2] = 0),
      (M[3] = 0),
      (M[4] = 0),
      (M[5] = -2 * m),
      (M[6] = 0),
      (M[7] = 0),
      (M[8] = 0),
      (M[9] = 0),
      (M[10] = 2 * u),
      (M[11] = 0),
      (M[12] = (t + _) * i),
      (M[13] = (e + r) * m),
      (M[14] = (n + s) * u),
      (M[15] = 1),
      a
    );
  }
  static lookAt(a, t, _, r) {
    var e = t.x,
      s = t.y,
      t = t.z,
      n = r.x,
      i = r.y,
      r = r.z,
      m = e - _.x,
      u = s - _.y,
      _ = t - _.z,
      M = i * (_ *= h = 1 / Math.sqrt(m * m + u * u + _ * _)) - r * (u *= h),
      r = r * (m *= h) - n * _,
      n = n * u - i * m,
      i =
        ((M *= h = 1 / Math.sqrt(M * M + r * r + n * n)),
        u * (n *= h) - _ * (r *= h)),
      h = _ * M - m * n,
      l = m * r - u * M,
      c = a.m;
    return (
      (c[0] = M),
      (c[1] = i),
      (c[2] = m),
      (c[3] = 0),
      (c[4] = r),
      (c[5] = h),
      (c[6] = u),
      (c[7] = 0),
      (c[8] = n),
      (c[9] = l),
      (c[10] = _),
      (c[11] = 0),
      (c[12] = -(M * e + r * s + n * t)),
      (c[13] = -(i * e + h * s + l * t)),
      (c[14] = -(m * e + u * s + _ * t)),
      (c[15] = 1),
      a
    );
  }
  static inverseTranspose(a, t) {
    var t = t.m,
      _ =
        ((_a00 = t[0]),
        (_a01 = t[1]),
        (_a02 = t[2]),
        (_a03 = t[3]),
        (_a10 = t[4]),
        (_a11 = t[5]),
        (_a12 = t[6]),
        (_a13 = t[7]),
        (_a20 = t[8]),
        (_a21 = t[9]),
        (_a22 = t[10]),
        (_a23 = t[11]),
        (_a30 = t[12]),
        (_a31 = t[13]),
        (_a32 = t[14]),
        (_a33 = t[15]),
        _a00 * _a11 - _a01 * _a10),
      r = _a00 * _a12 - _a02 * _a10,
      e = _a00 * _a13 - _a03 * _a10,
      s = _a01 * _a12 - _a02 * _a11,
      n = _a01 * _a13 - _a03 * _a11,
      i = _a02 * _a13 - _a03 * _a12,
      m = _a20 * _a31 - _a21 * _a30,
      u = _a20 * _a32 - _a22 * _a30,
      M = _a20 * _a33 - _a23 * _a30,
      h = _a21 * _a32 - _a22 * _a31,
      l = _a21 * _a33 - _a23 * _a31,
      c = _a22 * _a33 - _a23 * _a32,
      o = _ * c - r * l + e * h + s * M - n * u + i * m;
    return o
      ? ((o = 1 / o),
        ((t = a.m)[0] = (_a11 * c - _a12 * l + _a13 * h) * o),
        (t[1] = (_a12 * M - _a10 * c - _a13 * u) * o),
        (t[2] = (_a10 * l - _a11 * M + _a13 * m) * o),
        (t[3] = 0),
        (t[4] = (_a02 * l - _a01 * c - _a03 * h) * o),
        (t[5] = (_a00 * c - _a02 * M + _a03 * u) * o),
        (t[6] = (_a01 * M - _a00 * l - _a03 * m) * o),
        (t[7] = 0),
        (t[8] = (_a31 * i - _a32 * n + _a33 * s) * o),
        (t[9] = (_a32 * e - _a30 * i - _a33 * r) * o),
        (t[10] = (_a30 * n - _a31 * e + _a33 * _) * o),
        (t[11] = 0),
        (t[12] = 0),
        (t[13] = 0),
        (t[14] = 0),
        (t[15] = 1),
        a)
      : null;
  }
  static add(a, t, _) {
    var r = a.m,
      t = t.m,
      _ = _.m;
    return (
      (r[0] = t[0] + _[0]),
      (r[1] = t[1] + _[1]),
      (r[2] = t[2] + _[2]),
      (r[3] = t[3] + _[3]),
      (r[4] = t[4] + _[4]),
      (r[5] = t[5] + _[5]),
      (r[6] = t[6] + _[6]),
      (r[7] = t[7] + _[7]),
      (r[8] = t[8] + _[8]),
      (r[9] = t[9] + _[9]),
      (r[10] = t[10] + _[10]),
      (r[11] = t[11] + _[11]),
      (r[12] = t[12] + _[12]),
      (r[13] = t[13] + _[13]),
      (r[14] = t[14] + _[14]),
      (r[15] = t[15] + _[15]),
      a
    );
  }
  static subtract(a, t, _) {
    var r = a.m,
      t = t.m,
      _ = _.m;
    return (
      (r[0] = t[0] - _[0]),
      (r[1] = t[1] - _[1]),
      (r[2] = t[2] - _[2]),
      (r[3] = t[3] - _[3]),
      (r[4] = t[4] - _[4]),
      (r[5] = t[5] - _[5]),
      (r[6] = t[6] - _[6]),
      (r[7] = t[7] - _[7]),
      (r[8] = t[8] - _[8]),
      (r[9] = t[9] - _[9]),
      (r[10] = t[10] - _[10]),
      (r[11] = t[11] - _[11]),
      (r[12] = t[12] - _[12]),
      (r[13] = t[13] - _[13]),
      (r[14] = t[14] - _[14]),
      (r[15] = t[15] - _[15]),
      a
    );
  }
  static multiplyScalar(a, t, _) {
    var r = a.m,
      t = t.m;
    return (
      (r[0] = t[0] * _),
      (r[1] = t[1] * _),
      (r[2] = t[2] * _),
      (r[3] = t[3] * _),
      (r[4] = t[4] * _),
      (r[5] = t[5] * _),
      (r[6] = t[6] * _),
      (r[7] = t[7] * _),
      (r[8] = t[8] * _),
      (r[9] = t[9] * _),
      (r[10] = t[10] * _),
      (r[11] = t[11] * _),
      (r[12] = t[12] * _),
      (r[13] = t[13] * _),
      (r[14] = t[14] * _),
      (r[15] = t[15] * _),
      a
    );
  }
  static multiplyScalarAndAdd(a, t, _, r) {
    var e = a.m,
      t = t.m,
      _ = _.m;
    return (
      (e[0] = t[0] + _[0] * r),
      (e[1] = t[1] + _[1] * r),
      (e[2] = t[2] + _[2] * r),
      (e[3] = t[3] + _[3] * r),
      (e[4] = t[4] + _[4] * r),
      (e[5] = t[5] + _[5] * r),
      (e[6] = t[6] + _[6] * r),
      (e[7] = t[7] + _[7] * r),
      (e[8] = t[8] + _[8] * r),
      (e[9] = t[9] + _[9] * r),
      (e[10] = t[10] + _[10] * r),
      (e[11] = t[11] + _[11] * r),
      (e[12] = t[12] + _[12] * r),
      (e[13] = t[13] + _[13] * r),
      (e[14] = t[14] + _[14] * r),
      (e[15] = t[15] + _[15] * r),
      a
    );
  }
  static strictEquals(a, t) {
    return (
      (a = a.m),
      (t = t.m),
      a[0] === t[0] &&
        a[1] === t[1] &&
        a[2] === t[2] &&
        a[3] === t[3] &&
        a[4] === t[4] &&
        a[5] === t[5] &&
        a[6] === t[6] &&
        a[7] === t[7] &&
        a[8] === t[8] &&
        a[9] === t[9] &&
        a[10] === t[10] &&
        a[11] === t[11] &&
        a[12] === t[12] &&
        a[13] === t[13] &&
        a[14] === t[14] &&
        a[15] === t[15]
    );
  }
  static equals(a, t, _ = utils_1.EPSILON) {
    return (
      (a = a.m),
      (t = t.m),
      Math.abs(a[0] - t[0]) <=
        _ * Math.max(1, Math.abs(a[0]), Math.abs(t[0])) &&
        Math.abs(a[1] - t[1]) <=
          _ * Math.max(1, Math.abs(a[1]), Math.abs(t[1])) &&
        Math.abs(a[2] - t[2]) <=
          _ * Math.max(1, Math.abs(a[2]), Math.abs(t[2])) &&
        Math.abs(a[3] - t[3]) <=
          _ * Math.max(1, Math.abs(a[3]), Math.abs(t[3])) &&
        Math.abs(a[4] - t[4]) <=
          _ * Math.max(1, Math.abs(a[4]), Math.abs(t[4])) &&
        Math.abs(a[5] - t[5]) <=
          _ * Math.max(1, Math.abs(a[5]), Math.abs(t[5])) &&
        Math.abs(a[6] - t[6]) <=
          _ * Math.max(1, Math.abs(a[6]), Math.abs(t[6])) &&
        Math.abs(a[7] - t[7]) <=
          _ * Math.max(1, Math.abs(a[7]), Math.abs(t[7])) &&
        Math.abs(a[8] - t[8]) <=
          _ * Math.max(1, Math.abs(a[8]), Math.abs(t[8])) &&
        Math.abs(a[9] - t[9]) <=
          _ * Math.max(1, Math.abs(a[9]), Math.abs(t[9])) &&
        Math.abs(a[10] - t[10]) <=
          _ * Math.max(1, Math.abs(a[10]), Math.abs(t[10])) &&
        Math.abs(a[11] - t[11]) <=
          _ * Math.max(1, Math.abs(a[11]), Math.abs(t[11])) &&
        Math.abs(a[12] - t[12]) <=
          _ * Math.max(1, Math.abs(a[12]), Math.abs(t[12])) &&
        Math.abs(a[13] - t[13]) <=
          _ * Math.max(1, Math.abs(a[13]), Math.abs(t[13])) &&
        Math.abs(a[14] - t[14]) <=
          _ * Math.max(1, Math.abs(a[14]), Math.abs(t[14])) &&
        Math.abs(a[15] - t[15]) <=
          _ * Math.max(1, Math.abs(a[15]), Math.abs(t[15]))
    );
  }
  static adjoint(a, t) {
    var t = t.m,
      _ = a.m,
      r = t[0],
      e = t[1],
      s = t[2],
      n = t[3],
      i = t[4],
      m = t[5],
      u = t[6],
      M = t[7],
      h = t[8],
      l = t[9],
      c = t[10],
      o = t[11],
      v = t[12],
      b = t[13],
      y = t[14],
      t = t[15];
    return (
      (_[0] = m * (c * t - o * y) - l * (u * t - M * y) + b * (u * o - M * c)),
      (_[1] = -(
        e * (c * t - o * y) -
        l * (s * t - n * y) +
        b * (s * o - n * c)
      )),
      (_[2] = e * (u * t - M * y) - m * (s * t - n * y) + b * (s * M - n * u)),
      (_[3] = -(
        e * (u * o - M * c) -
        m * (s * o - n * c) +
        l * (s * M - n * u)
      )),
      (_[4] = -(
        i * (c * t - o * y) -
        h * (u * t - M * y) +
        v * (u * o - M * c)
      )),
      (_[5] = r * (c * t - o * y) - h * (s * t - n * y) + v * (s * o - n * c)),
      (_[6] = -(
        r * (u * t - M * y) -
        i * (s * t - n * y) +
        v * (s * M - n * u)
      )),
      (_[7] = r * (u * o - M * c) - i * (s * o - n * c) + h * (s * M - n * u)),
      (_[8] = i * (l * t - o * b) - h * (m * t - M * b) + v * (m * o - M * l)),
      (_[9] = -(
        r * (l * t - o * b) -
        h * (e * t - n * b) +
        v * (e * o - n * l)
      )),
      (_[10] = r * (m * t - M * b) - i * (e * t - n * b) + v * (e * M - n * m)),
      (_[11] = -(
        r * (m * o - M * l) -
        i * (e * o - n * l) +
        h * (e * M - n * m)
      )),
      (_[12] = -(
        i * (l * y - c * b) -
        h * (m * y - u * b) +
        v * (m * c - u * l)
      )),
      (_[13] = r * (l * y - c * b) - h * (e * y - s * b) + v * (e * c - s * l)),
      (_[14] = -(
        r * (m * y - u * b) -
        i * (e * y - s * b) +
        v * (e * u - s * m)
      )),
      (_[15] = r * (m * c - u * l) - i * (e * c - s * l) + h * (e * u - s * m)),
      a
    );
  }
  static toArray(t, a, _ = 0) {
    var r = a.m;
    for (let a = 0; a < 16; a++) t[_ + a] = r[a];
    return t;
  }
  static fromArray(a, t, _ = 0) {
    var r = a.m;
    for (let a = 0; a < 16; a++) r[a] = t[_ + a];
    return a;
  }
  constructor(
    a = 1,
    t = 0,
    _ = 0,
    r = 0,
    e = 0,
    s = 1,
    n = 0,
    i = 0,
    m = 0,
    u = 0,
    M = 1,
    h = 0,
    l = 0,
    c = 0,
    o = 0,
    v = 1,
  ) {
    var b;
    (super(),
      a instanceof utils_1.FLOAT_ARRAY_TYPE
        ? (this.m = a)
        : ((this.m = new utils_1.FLOAT_ARRAY_TYPE(16)),
          ((b = this.m)[0] = a),
          (b[1] = t),
          (b[2] = _),
          (b[3] = r),
          (b[4] = e),
          (b[5] = s),
          (b[6] = n),
          (b[7] = i),
          (b[8] = m),
          (b[9] = u),
          (b[10] = M),
          (b[11] = h),
          (b[12] = l),
          (b[13] = c),
          (b[14] = o),
          (b[15] = v)));
  }
  clone() {
    var a = this.m;
    return new Mat4(
      a[0],
      a[1],
      a[2],
      a[3],
      a[4],
      a[5],
      a[6],
      a[7],
      a[8],
      a[9],
      a[10],
      a[11],
      a[12],
      a[13],
      a[14],
      a[15],
    );
  }
  set(a) {
    var t = this.m,
      a = a.m;
    return (
      (t[0] = a[0]),
      (t[1] = a[1]),
      (t[2] = a[2]),
      (t[3] = a[3]),
      (t[4] = a[4]),
      (t[5] = a[5]),
      (t[6] = a[6]),
      (t[7] = a[7]),
      (t[8] = a[8]),
      (t[9] = a[9]),
      (t[10] = a[10]),
      (t[11] = a[11]),
      (t[12] = a[12]),
      (t[13] = a[13]),
      (t[14] = a[14]),
      (t[15] = a[15]),
      this
    );
  }
  equals(a) {
    return Mat4.strictEquals(this, a);
  }
  fuzzyEquals(a) {
    return Mat4.equals(this, a);
  }
  toString() {
    var a = this.m;
    return a
      ? "[\n" +
          a[0] +
          ", " +
          a[1] +
          ", " +
          a[2] +
          ", " +
          a[3] +
          ",\n" +
          a[4] +
          ", " +
          a[5] +
          ", " +
          a[6] +
          ", " +
          a[7] +
          ",\n" +
          a[8] +
          ", " +
          a[9] +
          ", " +
          a[10] +
          ", " +
          a[11] +
          ",\n" +
          a[12] +
          ", " +
          a[13] +
          ", " +
          a[14] +
          ", " +
          a[15] +
          "\n]"
      : "[\n1, 0, 0, 0\n0, 1, 0, 0\n0, 0, 1, 0\n0, 0, 0, 1\n]";
  }
  identity() {
    return Mat4.identity(this);
  }
  transpose(a) {
    return ((a = a || new Mat4()), Mat4.transpose(a, this));
  }
  invert(a) {
    return ((a = a || new Mat4()), Mat4.invert(a, this));
  }
  adjoint(a) {
    return ((a = a || new Mat4()), Mat4.adjoint(a, this));
  }
  determinant() {
    return Mat4.determinant(this);
  }
  add(a, t) {
    return ((t = t || new Mat4()), Mat4.add(t, this, a));
  }
  subtract(a) {
    return Mat4.subtract(this, this, a);
  }
  multiply(a) {
    return Mat4.multiply(this, this, a);
  }
  multiplyScalar(a) {
    return Mat4.multiplyScalar(this, this, a);
  }
  translate(a, t) {
    return ((t = t || new Mat4()), Mat4.translate(t, this, a));
  }
  scale(a, t) {
    return ((t = t || new Mat4()), Mat4.scale(t, this, a));
  }
  rotate(a, t, _) {
    return ((_ = _ || new Mat4()), Mat4.rotate(_, this, a, t));
  }
  getTranslation(a) {
    return ((a = a || new vec3_1.default()), Mat4.getTranslation(a, this));
  }
  getScale(a) {
    return ((a = a || new vec3_1.default()), Mat4.getScaling(a, this));
  }
  getRotation(a) {
    return ((a = a || new quat_1.default()), Mat4.getRotation(a, this));
  }
  fromRTS(a, t, _) {
    return Mat4.fromRTS(this, a, t, _);
  }
  fromQuat(a) {
    return Mat4.fromQuat(this, a);
  }
}
((Mat4.mul = Mat4.multiply),
  (Mat4.sub = Mat4.subtract),
  (Mat4.IDENTITY = Object.freeze(new Mat4())),
  (exports.default = Mat4));
let v3_1 = new vec3_1.default(),
  m3_1 = new mat3_1.default();
for (let t = 0; t < 16; t++)
  Object.defineProperty(Mat4.prototype, "m" + t, {
    get() {
      return this.m[t];
    },
    set(a) {
      this.m[t] = a;
    },
  });
