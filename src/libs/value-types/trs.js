var __importDefault =
  (this && this.__importDefault) ||
  function (t) {
    return t && t.__esModule ? t : { default: t };
  };
Object.defineProperty(exports, "__esModule", { value: !0 });
let quat_1 = __importDefault(require("./quat")),
  tmp_quat = new quat_1.default();
class Trs {
  static toRotation(t, r) {
    return ((t.x = r[3]), (t.y = r[4]), (t.z = r[5]), (t.w = r[6]), t);
  }
  static fromRotation(t, r) {
    return ((t[3] = r.x), (t[4] = r.y), (t[5] = r.z), (t[6] = r.w), t);
  }
  static toEuler(t, r) {
    return (
      Trs.toRotation(tmp_quat, r),
      quat_1.default.toEuler(t, tmp_quat),
      t
    );
  }
  static fromEuler(t, r) {
    return (
      quat_1.default.fromEuler(tmp_quat, r.x, r.y, r.z),
      Trs.fromRotation(t, tmp_quat),
      t
    );
  }
  static fromEulerNumber(t, r, a, u) {
    return (
      quat_1.default.fromEuler(tmp_quat, r, a, u),
      Trs.fromRotation(t, tmp_quat),
      t
    );
  }
  static toScale(t, r) {
    return ((t.x = r[7]), (t.y = r[8]), (t.z = r[9]), t);
  }
  static fromScale(t, r) {
    return ((t[7] = r.x), (t[8] = r.y), (t[9] = r.z), t);
  }
  static toPosition(t, r) {
    return ((t.x = r[0]), (t.y = r[1]), (t.z = r[2]), t);
  }
  static fromPosition(t, r) {
    return ((t[0] = r.x), (t[1] = r.y), (t[2] = r.z), t);
  }
  static fromAngleZ(t, r) {
    return (
      quat_1.default.fromAngleZ(tmp_quat, r),
      Trs.fromRotation(t, tmp_quat),
      t
    );
  }
  static toMat4(t, r) {
    var a = r[3],
      u = r[5],
      e = u + u,
      o = a * (n = a + a),
      i = a * (l = (m = r[4]) + m),
      a = a * e,
      s = m * l,
      m = m * e,
      n = (_ = r[6]) * n,
      l = _ * l,
      _ = _ * e,
      f = r[8],
      q = r[9],
      c = t.m;
    return (
      (c[0] = (1 - (s + (u = u * e))) * (e = r[7])),
      (c[1] = (i + _) * e),
      (c[2] = (a - l) * e),
      (c[3] = 0),
      (c[4] = (i - _) * f),
      (c[5] = (1 - (o + u)) * f),
      (c[6] = (m + n) * f),
      (c[7] = 0),
      (c[8] = (a + l) * q),
      (c[9] = (m - n) * q),
      (c[10] = (1 - (o + s)) * q),
      (c[11] = 0),
      (c[12] = r[0]),
      (c[13] = r[1]),
      (c[14] = r[2]),
      (c[15] = 1),
      t
    );
  }
}
exports.default = Trs;
