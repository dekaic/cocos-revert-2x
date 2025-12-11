var __importDefault =
  (this && this.__importDefault) ||
  function (t) {
    return t && t.__esModule ? t : { default: t };
  };
Object.defineProperty(exports, "__esModule", { value: !0 });
let utils_1 = require("./utils"),
  vec3_1 = __importDefault(require("./vec3"));
class Mat3 {
  static create(t = 1, a = 0, r = 0, e = 0, s = 1, u = 0, m = 0, i = 0, n = 1) {
    return new Mat3(t, a, r, e, s, u, m, i, n);
  }
  static clone(t) {
    return (
      (t = t.m),
      new Mat3(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8])
    );
  }
  static copy(t, a) {
    return (t.m.set(a.m), t);
  }
  static set(t, a, r, e, s, u, m, i, n, M) {
    var l = t.m;
    return (
      (l[0] = a),
      (l[1] = r),
      (l[2] = e),
      (l[3] = s),
      (l[4] = u),
      (l[5] = m),
      (l[6] = i),
      (l[7] = n),
      (l[8] = M),
      t
    );
  }
  static identity(t) {
    var a = t.m;
    return (
      (a[0] = 1),
      (a[1] = 0),
      (a[2] = 0),
      (a[3] = 0),
      (a[4] = 1),
      (a[5] = 0),
      (a[6] = 0),
      (a[7] = 0),
      (a[8] = 1),
      t
    );
  }
  static transpose(t, a) {
    var r,
      e,
      s = a.m,
      u = t.m;
    return (
      t === a
        ? ((a = s[1]),
          (r = s[2]),
          (e = s[5]),
          (u[1] = s[3]),
          (u[2] = s[6]),
          (u[3] = a),
          (u[5] = s[7]),
          (u[6] = r),
          (u[7] = e))
        : ((u[0] = s[0]),
          (u[1] = s[3]),
          (u[2] = s[6]),
          (u[3] = s[1]),
          (u[4] = s[4]),
          (u[5] = s[7]),
          (u[6] = s[2]),
          (u[7] = s[5]),
          (u[8] = s[8])),
      t
    );
  }
  static invert(t, a) {
    var a = a.m,
      r = t.m,
      e = a[0],
      s = a[1],
      u = a[2],
      m = a[3],
      i = a[4],
      n = a[5],
      M = a[6],
      l = a[7],
      c = (a = a[8]) * i - n * l,
      h = -a * m + n * M,
      o = l * m - i * M,
      v = e * c + s * h + u * o;
    return (
      v &&
        ((r[0] = c * (v = 1 / v)),
        (r[1] = (-a * s + u * l) * v),
        (r[2] = (n * s - u * i) * v),
        (r[3] = h * v),
        (r[4] = (a * e - u * M) * v),
        (r[5] = (-n * e + u * m) * v),
        (r[6] = o * v),
        (r[7] = (-l * e + s * M) * v),
        (r[8] = (i * e - s * m) * v)),
      t
    );
  }
  static adjoint(t, a) {
    var a = a.m,
      r = t.m,
      e = a[0],
      s = a[1],
      u = a[2],
      m = a[3],
      i = a[4],
      n = a[5],
      M = a[6],
      l = a[7],
      a = a[8];
    return (
      (r[0] = i * a - n * l),
      (r[1] = u * l - s * a),
      (r[2] = s * n - u * i),
      (r[3] = n * M - m * a),
      (r[4] = e * a - u * M),
      (r[5] = u * m - e * n),
      (r[6] = m * l - i * M),
      (r[7] = s * M - e * l),
      (r[8] = e * i - s * m),
      t
    );
  }
  static determinant(t) {
    var a = (t = t.m)[0],
      r = t[3],
      e = t[4],
      s = t[5],
      u = t[6],
      m = t[7],
      i = t[8];
    return (
      a * (i * e - s * m) + t[1] * (-i * r + s * u) + t[2] * (m * r - e * u)
    );
  }
  static multiply(t, a, r) {
    var a = a.m,
      r = r.m,
      e = t.m,
      s = a[0],
      u = a[1],
      m = a[2],
      i = a[3],
      n = a[4],
      M = a[5],
      l = a[6],
      c = a[7],
      a = a[8],
      h = r[0],
      o = r[1],
      v = r[2],
      _ = r[3],
      b = r[4],
      f = r[5],
      p = r[6],
      d = r[7],
      r = r[8];
    return (
      (e[0] = h * s + o * i + v * l),
      (e[1] = h * u + o * n + v * c),
      (e[2] = h * m + o * M + v * a),
      (e[3] = _ * s + b * i + f * l),
      (e[4] = _ * u + b * n + f * c),
      (e[5] = _ * m + b * M + f * a),
      (e[6] = p * s + d * i + r * l),
      (e[7] = p * u + d * n + r * c),
      (e[8] = p * m + d * M + r * a),
      t
    );
  }
  static multiplyMat4(t, a, r) {
    var a = a.m,
      r = r.m,
      e = t.m,
      s = a[0],
      u = a[1],
      m = a[2],
      i = a[3],
      n = a[4],
      M = a[5],
      l = a[6],
      c = a[7],
      a = a[8],
      h = r[0],
      o = r[1],
      v = r[2],
      _ = r[4],
      b = r[5],
      f = r[6],
      p = r[8],
      d = r[9],
      r = r[10];
    return (
      (e[0] = h * s + o * i + v * l),
      (e[1] = h * u + o * n + v * c),
      (e[2] = h * m + o * M + v * a),
      (e[3] = _ * s + b * i + f * l),
      (e[4] = _ * u + b * n + f * c),
      (e[5] = _ * m + b * M + f * a),
      (e[6] = p * s + d * i + r * l),
      (e[7] = p * u + d * n + r * c),
      (e[8] = p * m + d * M + r * a),
      t
    );
  }
  static translate(t, a, r) {
    var a = a.m,
      e = t.m,
      s = a[0],
      u = a[1],
      m = a[2],
      i = a[3],
      n = a[4],
      M = a[5],
      l = a[6],
      c = a[7],
      a = a[8],
      h = r.x,
      r = r.y;
    return (
      (e[0] = s),
      (e[1] = u),
      (e[2] = m),
      (e[3] = i),
      (e[4] = n),
      (e[5] = M),
      (e[6] = h * s + r * i + l),
      (e[7] = h * u + r * n + c),
      (e[8] = h * m + r * M + a),
      t
    );
  }
  static rotate(t, a, r) {
    var a = a.m,
      e = t.m,
      s = a[0],
      u = a[1],
      m = a[2],
      i = a[3],
      n = a[4],
      M = a[5],
      l = a[6],
      c = a[7],
      a = a[8],
      h = Math.sin(r),
      r = Math.cos(r);
    return (
      (e[0] = r * s + h * i),
      (e[1] = r * u + h * n),
      (e[2] = r * m + h * M),
      (e[3] = r * i - h * s),
      (e[4] = r * n - h * u),
      (e[5] = r * M - h * m),
      (e[6] = l),
      (e[7] = c),
      (e[8] = a),
      t
    );
  }
  static scale(t, a, r) {
    var e = r.x,
      r = r.y,
      a = a.m,
      s = t.m;
    return (
      (s[0] = e * a[0]),
      (s[1] = e * a[1]),
      (s[2] = e * a[2]),
      (s[3] = r * a[3]),
      (s[4] = r * a[4]),
      (s[5] = r * a[5]),
      (s[6] = a[6]),
      (s[7] = a[7]),
      (s[8] = a[8]),
      t
    );
  }
  static fromMat4(t, a) {
    var a = a.m,
      r = t.m;
    return (
      (r[0] = a[0]),
      (r[1] = a[1]),
      (r[2] = a[2]),
      (r[3] = a[4]),
      (r[4] = a[5]),
      (r[5] = a[6]),
      (r[6] = a[8]),
      (r[7] = a[9]),
      (r[8] = a[10]),
      t
    );
  }
  static fromTranslation(t, a) {
    var r = t.m;
    return (
      (r[0] = 1),
      (r[1] = 0),
      (r[2] = 0),
      (r[3] = 0),
      (r[4] = 1),
      (r[5] = 0),
      (r[6] = a.x),
      (r[7] = a.y),
      (r[8] = 1),
      t
    );
  }
  static fromRotation(t, a) {
    var r = Math.sin(a),
      a = Math.cos(a),
      e = t.m;
    return (
      (e[0] = a),
      (e[1] = r),
      (e[2] = 0),
      (e[3] = -r),
      (e[4] = a),
      (e[5] = 0),
      (e[6] = 0),
      (e[7] = 0),
      (e[8] = 1),
      t
    );
  }
  static fromScaling(t, a) {
    var r = t.m;
    return (
      (r[0] = a.x),
      (r[1] = 0),
      (r[2] = 0),
      (r[3] = 0),
      (r[4] = a.y),
      (r[5] = 0),
      (r[6] = 0),
      (r[7] = 0),
      (r[8] = 1),
      t
    );
  }
  static fromQuat(t, a) {
    var r = t.m,
      e = a.x,
      s = a.z,
      u = s + s,
      e = e * (l = e + e),
      m = (i = a.y) * l,
      i = i * (c = i + i),
      n = s * l,
      M = s * c,
      l = (a = a.w) * l,
      c = a * c,
      a = a * u;
    return (
      (r[0] = 1 - i - (s = s * u)),
      (r[3] = m - a),
      (r[6] = n + c),
      (r[1] = m + a),
      (r[4] = 1 - e - s),
      (r[7] = M - l),
      (r[2] = n - c),
      (r[5] = M + l),
      (r[8] = 1 - e - i),
      t
    );
  }
  static fromViewUp(t, a, r) {
    return (() => {
      let e = new vec3_1.default(0, 1, 0),
        s = new vec3_1.default(),
        u = new vec3_1.default();
      return function (t, a, r) {
        return (
          vec3_1.default.lengthSqr(a) < utils_1.EPSILON * utils_1.EPSILON ||
          ((r = r || e),
          vec3_1.default.normalize(s, vec3_1.default.cross(s, r, a)),
          vec3_1.default.lengthSqr(s) < utils_1.EPSILON * utils_1.EPSILON)
            ? Mat3.identity(t)
            : (vec3_1.default.cross(u, a, s),
              Mat3.set(t, s.x, s.y, s.z, u.x, u.y, u.z, a.x, a.y, a.z)),
          t
        );
      };
    })()(t, a, r);
  }
  static normalFromMat4(t, a) {
    var a = a.m,
      r = t.m,
      e = a[0],
      s = a[1],
      u = a[2],
      m = a[3],
      i = a[4],
      n = a[5],
      M = a[6],
      l = a[7],
      c = a[8],
      h = a[9],
      o = a[10],
      v = a[11],
      _ = a[12],
      b = a[13],
      f = a[14],
      p = e * n - s * i,
      d = e * M - u * i,
      x = e * l - m * i,
      y = s * M - u * n,
      S = s * l - m * n,
      w = u * l - m * M,
      E = c * b - h * _,
      O = c * f - o * _,
      P = h * f - o * b;
    return (
      (v =
        p * (o = o * (a = a[15]) - v * f) -
        d * (h = h * a - v * b) +
        x * P +
        y * (c = c * a - v * _) -
        S * O +
        w * E) &&
        ((r[0] = (n * o - M * h + l * P) * (v = 1 / v)),
        (r[1] = (M * c - i * o - l * O) * v),
        (r[2] = (i * h - n * c + l * E) * v),
        (r[3] = (u * h - s * o - m * P) * v),
        (r[4] = (e * o - u * c + m * O) * v),
        (r[5] = (s * c - e * h - m * E) * v),
        (r[6] = (b * w - f * S + a * y) * v),
        (r[7] = (f * x - _ * w - a * d) * v),
        (r[8] = (_ * S - b * x + a * p) * v)),
      t
    );
  }
  static frob(t) {
    return (
      (t = t.m),
      Math.sqrt(
        Math.pow(t[0], 2) +
          Math.pow(t[1], 2) +
          Math.pow(t[2], 2) +
          Math.pow(t[3], 2) +
          Math.pow(t[4], 2) +
          Math.pow(t[5], 2) +
          Math.pow(t[6], 2) +
          Math.pow(t[7], 2) +
          Math.pow(t[8], 2),
      )
    );
  }
  static add(t, a, r) {
    var a = a.m,
      r = r.m,
      e = t.m;
    return (
      (e[0] = a[0] + r[0]),
      (e[1] = a[1] + r[1]),
      (e[2] = a[2] + r[2]),
      (e[3] = a[3] + r[3]),
      (e[4] = a[4] + r[4]),
      (e[5] = a[5] + r[5]),
      (e[6] = a[6] + r[6]),
      (e[7] = a[7] + r[7]),
      (e[8] = a[8] + r[8]),
      t
    );
  }
  static subtract(t, a, r) {
    var a = a.m,
      r = r.m,
      e = t.m;
    return (
      (e[0] = a[0] - r[0]),
      (e[1] = a[1] - r[1]),
      (e[2] = a[2] - r[2]),
      (e[3] = a[3] - r[3]),
      (e[4] = a[4] - r[4]),
      (e[5] = a[5] - r[5]),
      (e[6] = a[6] - r[6]),
      (e[7] = a[7] - r[7]),
      (e[8] = a[8] - r[8]),
      t
    );
  }
  static multiplyScalar(t, a, r) {
    var a = a.m,
      e = t.m;
    return (
      (e[0] = a[0] * r),
      (e[1] = a[1] * r),
      (e[2] = a[2] * r),
      (e[3] = a[3] * r),
      (e[4] = a[4] * r),
      (e[5] = a[5] * r),
      (e[6] = a[6] * r),
      (e[7] = a[7] * r),
      (e[8] = a[8] * r),
      t
    );
  }
  static multiplyScalarAndAdd(t, a, r, e) {
    var a = a.m,
      r = r.m,
      s = t.m;
    return (
      (s[0] = a[0] + r[0] * e),
      (s[1] = a[1] + r[1] * e),
      (s[2] = a[2] + r[2] * e),
      (s[3] = a[3] + r[3] * e),
      (s[4] = a[4] + r[4] * e),
      (s[5] = a[5] + r[5] * e),
      (s[6] = a[6] + r[6] * e),
      (s[7] = a[7] + r[7] * e),
      (s[8] = a[8] + r[8] * e),
      t
    );
  }
  static exactEquals(t, a) {
    return (
      (t = t.m),
      (a = a.m),
      t[0] === a[0] &&
        t[1] === a[1] &&
        t[2] === a[2] &&
        t[3] === a[3] &&
        t[4] === a[4] &&
        t[5] === a[5] &&
        t[6] === a[6] &&
        t[7] === a[7] &&
        t[8] === a[8]
    );
  }
  static equals(t, a) {
    var t = t.m,
      a = a.m,
      r = t[0],
      e = t[1],
      s = t[2],
      u = t[3],
      m = t[4],
      i = t[5],
      n = t[6],
      M = t[7],
      t = t[8],
      l = a[0],
      c = a[1],
      h = a[2],
      o = a[3],
      v = a[4],
      _ = a[5],
      b = a[6],
      f = a[7],
      a = a[8];
    return (
      Math.abs(r - l) <=
        utils_1.EPSILON * Math.max(1, Math.abs(r), Math.abs(l)) &&
      Math.abs(e - c) <=
        utils_1.EPSILON * Math.max(1, Math.abs(e), Math.abs(c)) &&
      Math.abs(s - h) <=
        utils_1.EPSILON * Math.max(1, Math.abs(s), Math.abs(h)) &&
      Math.abs(u - o) <=
        utils_1.EPSILON * Math.max(1, Math.abs(u), Math.abs(o)) &&
      Math.abs(m - v) <=
        utils_1.EPSILON * Math.max(1, Math.abs(m), Math.abs(v)) &&
      Math.abs(i - _) <=
        utils_1.EPSILON * Math.max(1, Math.abs(i), Math.abs(_)) &&
      Math.abs(n - b) <=
        utils_1.EPSILON * Math.max(1, Math.abs(n), Math.abs(b)) &&
      Math.abs(M - f) <=
        utils_1.EPSILON * Math.max(1, Math.abs(M), Math.abs(f)) &&
      Math.abs(t - a) <= utils_1.EPSILON * Math.max(1, Math.abs(t), Math.abs(a))
    );
  }
  static toArray(a, t, r = 0) {
    var e = t.m;
    for (let t = 0; t < 9; t++) a[r + t] = e[t];
    return a;
  }
  static fromArray(t, a, r = 0) {
    var e = t.m;
    for (let t = 0; t < 9; t++) e[t] = a[r + t];
    return t;
  }
  constructor(t = 1, a = 0, r = 0, e = 0, s = 1, u = 0, m = 0, i = 0, n = 1) {
    var M;
    t instanceof utils_1.FLOAT_ARRAY_TYPE
      ? (this.m = t)
      : ((this.m = new utils_1.FLOAT_ARRAY_TYPE(9)),
        ((M = this.m)[0] = t),
        (M[1] = a),
        (M[2] = r),
        (M[3] = e),
        (M[4] = s),
        (M[5] = u),
        (M[6] = m),
        (M[7] = i),
        (M[8] = n));
  }
  toString() {
    var t = this.m;
    return `mat3(${t[0]}, ${t[1]}, ${t[2]}, ${t[3]}, ${t[4]}, ${t[5]}, ${t[6]}, ${t[7]}, ${t[8]})`;
  }
}
((Mat3.sub = Mat3.subtract),
  (Mat3.mul = Mat3.multiply),
  (Mat3.IDENTITY = Object.freeze(new Mat3())),
  (exports.default = Mat3));
