var __importDefault =
  (this && this.__importDefault) ||
  function (t) {
    return t && t.__esModule ? t : { default: t };
  };
Object.defineProperty(exports, "__esModule", { value: !0 });
let value_type_1 = __importDefault(require("./value-type")),
  miss_1 = __importDefault(require("./miss"));
class Color extends value_type_1.default {
  static get WHITE() {
    return new Color(255, 255, 255, 255);
  }
  static get BLACK() {
    return new Color(0, 0, 0, 255);
  }
  static get TRANSPARENT() {
    return new Color(0, 0, 0, 0);
  }
  static get GRAY() {
    return new Color(127.5, 127.5, 127.5);
  }
  static get RED() {
    return new Color(255, 0, 0);
  }
  static get GREEN() {
    return new Color(0, 255, 0);
  }
  static get BLUE() {
    return new Color(0, 0, 255);
  }
  static get YELLOW() {
    return new Color(255, 235, 4);
  }
  static get ORANGE() {
    return new Color(255, 127, 0);
  }
  static get CYAN() {
    return new Color(0, 255, 255);
  }
  static get MAGENTA() {
    return new Color(255, 0, 255);
  }
  static copy(t, r) {
    return ((t.r = r.r), (t.g = r.g), (t.b = r.b), (t.a = r.a), t);
  }
  static clone(t) {
    return new Color(t.r, t.g, t.b, t.a);
  }
  static set(t, r = 255, s = 255, e = 255, a = 255) {
    return ((t.r = r), (t.g = s), (t.b = e), (t.a = a), t);
  }
  static fromHex(t, r) {
    var s = (r >> 16) & 255,
      e = (r >> 8) & 255,
      a = 255 & r;
    return ((t.r = (r >> 24) & 255), (t.g = s), (t.b = e), (t.a = a), t);
  }
  static fromHEX(t, r) {
    return (
      (r = 0 === r.indexOf("#") ? r.substring(1) : r),
      (t.r = parseInt(r.substr(0, 2), 16) || 0),
      (t.g = parseInt(r.substr(2, 2), 16) || 0),
      (t.b = parseInt(r.substr(4, 2), 16) || 0),
      (t.a = parseInt(r.substr(6, 2), 16) || 255),
      (t._val = ((t.a << 24) >>> 0) + (t.b << 16) + (t.g << 8) + t.r),
      t
    );
  }
  static add(t, r, s) {
    return (
      (t.r = r.r + s.r),
      (t.g = r.g + s.g),
      (t.b = r.b + s.b),
      (t.a = r.a + s.a),
      t
    );
  }
  static subtract(t, r, s) {
    return (
      (t.r = r.r - s.r),
      (t.g = r.g - s.g),
      (t.b = r.b - s.b),
      (t.a = r.a - s.a),
      t
    );
  }
  static multiply(t, r, s) {
    return (
      (t.r = r.r * s.r),
      (t.g = r.g * s.g),
      (t.b = r.b * s.b),
      (t.a = r.a * s.a),
      t
    );
  }
  static divide(t, r, s) {
    return (
      (t.r = r.r / s.r),
      (t.g = r.g / s.g),
      (t.b = r.b / s.b),
      (t.a = r.a / s.a),
      t
    );
  }
  static scale(t, r, s) {
    return (
      (t.r = r.r * s),
      (t.g = r.g * s),
      (t.b = r.b * s),
      (t.a = r.a * s),
      t
    );
  }
  static lerp(t, r, s, e) {
    var a = r.r,
      i = r.g,
      o = r.b,
      r = r.a;
    return (
      (t.r = a + e * (s.r - a)),
      (t.g = i + e * (s.g - i)),
      (t.b = o + e * (s.b - o)),
      (t.a = r + e * (s.a - r)),
      t
    );
  }
  static toArray(t, r, s = 0) {
    var e = r instanceof Color || 1 < r.a ? 1 / 255 : 1;
    return (
      (t[s + 0] = r.r * e),
      (t[s + 1] = r.g * e),
      (t[s + 2] = r.b * e),
      (t[s + 3] = r.a * e),
      t
    );
  }
  static fromArray(t, r, s = 0) {
    return (
      (r.r = 255 * t[s + 0]),
      (r.g = 255 * t[s + 1]),
      (r.b = 255 * t[s + 2]),
      (r.a = 255 * t[s + 3]),
      r
    );
  }
  static premultiplyAlpha(t, r) {
    var s = r.a / 255;
    return (
      (t.r = r.r * s),
      (t.g = r.g * s),
      (t.b = r.b * s),
      t._fastSetA(r.a),
      t
    );
  }
  constructor(t = 0, r = 0, s = 0, e = 255) {
    (super(),
      (this._val = 0),
      "object" == typeof t && ((r = t.g), (s = t.b), (e = t.a), (t = t.r)),
      (this._val = ((e << 24) >>> 0) + (s << 16) + (r << 8) + (0 | t)));
  }
  clone() {
    var t = new Color();
    return ((t._val = this._val), t);
  }
  equals(t) {
    return t && this._val === t._val;
  }
  lerp(t, r, s) {
    s = s || new Color();
    var e = this.r,
      a = this.g,
      i = this.b,
      o = this.a;
    return (
      (s.r = e + (t.r - e) * r),
      (s.g = a + (t.g - a) * r),
      (s.b = i + (t.b - i) * r),
      (s.a = o + (t.a - o) * r),
      s
    );
  }
  toString() {
    return (
      "rgba(" +
      this.r.toFixed() +
      ", " +
      this.g.toFixed() +
      ", " +
      this.b.toFixed() +
      ", " +
      this.a.toFixed() +
      ")"
    );
  }
  get r() {
    return this.getR();
  }
  set r(t) {
    this.setR(t);
  }
  get g() {
    return this.getG();
  }
  set g(t) {
    this.setG(t);
  }
  get b() {
    return this.getB();
  }
  set b(t) {
    this.setB(t);
  }
  get a() {
    return this.getA();
  }
  set a(t) {
    this.setA(t);
  }
  getR() {
    return 255 & this._val;
  }
  setR(t) {
    return (
      (t = ~~miss_1.default.clampf(t, 0, 255)),
      (this._val = ((4294967040 & this._val) | t) >>> 0),
      this
    );
  }
  getG() {
    return (65280 & this._val) >> 8;
  }
  setG(t) {
    return (
      (t = ~~miss_1.default.clampf(t, 0, 255)),
      (this._val = ((4294902015 & this._val) | (t << 8)) >>> 0),
      this
    );
  }
  getB() {
    return (16711680 & this._val) >> 16;
  }
  setB(t) {
    return (
      (t = ~~miss_1.default.clampf(t, 0, 255)),
      (this._val = ((4278255615 & this._val) | (t << 16)) >>> 0),
      this
    );
  }
  getA() {
    return (4278190080 & this._val) >>> 24;
  }
  setA(t) {
    return (
      (t = ~~miss_1.default.clampf(t, 0, 255)),
      (this._val = ((16777215 & this._val) | (t << 24)) >>> 0),
      this
    );
  }
  toCSS(t) {
    return t && "rgba" !== t
      ? "rgb" === t
        ? "rgb(" + this.r + "," + this.g + "," + this.b + ")"
        : "#" + this.toHEX(t)
      : "rgba(" +
          this.r +
          "," +
          this.g +
          "," +
          this.b +
          "," +
          (this.a / 255).toFixed(2) +
          ")";
  }
  fromHEX(t) {
    t = 0 === t.indexOf("#") ? t.substring(1) : t;
    var r = parseInt(t.substr(0, 2), 16) || 0,
      s = parseInt(t.substr(2, 2), 16) || 0,
      e = parseInt(t.substr(4, 2), 16) || 0,
      t = parseInt(t.substr(6, 2), 16) || 255;
    return ((this._val = ((t << 24) >>> 0) + (e << 16) + (s << 8) + r), this);
  }
  toHEX(t) {
    var r = [
      (this.r < 16 ? "0" : "") + this.r.toString(16),
      (this.g < 16 ? "0" : "") + this.g.toString(16),
      (this.b < 16 ? "0" : "") + this.b.toString(16),
    ];
    return (
      "#rgb" === t
        ? ((r[0] = r[0][0]), (r[1] = r[1][0]), (r[2] = r[2][0]))
        : "#rrggbbaa" === t &&
          r.push((this.a < 16 ? "0" : "") + this.a.toString(16)),
      r.join("")
    );
  }
  toRGBValue() {
    return 16777215 & this._val;
  }
  fromHSV(t, r, s) {
    var e, a, i;
    if (0 === r) e = a = i = s;
    else if (0 === s) e = a = i = 0;
    else {
      (1 === t && (t = 0), (t *= 6));
      var o = Math.floor(t),
        l = s * (1 - r),
        u = s * (1 - r * (t = t - o)),
        n = s * (1 - r * (1 - t));
      switch (o) {
        case 0:
          ((e = s), (a = n), (i = l));
          break;
        case 1:
          ((e = u), (a = s), (i = l));
          break;
        case 2:
          ((e = l), (a = s), (i = n));
          break;
        case 3:
          ((e = l), (a = u), (i = s));
          break;
        case 4:
          ((e = n), (a = l), (i = s));
          break;
        case 5:
          ((e = s), (a = l), (i = u));
      }
    }
    return (
      (this._val =
        ((this.a << 24) >>> 0) +
        ((i *= 255) << 16) +
        ((a *= 255) << 8) +
        (0 | (e *= 255))),
      this
    );
  }
  toHSV() {
    var t = this.r / 255,
      r = this.g / 255,
      s = this.b / 255,
      e = { h: 0, s: 0, v: 0 },
      a = Math.max(t, r, s),
      i = Math.min(t, r, s);
    return (
      (e.v = a),
      (e.s = a ? (a - i) / a : 0),
      e.s
        ? ((i = a - i),
          (e.h =
            t === a
              ? (r - s) / i
              : r === a
                ? 2 + (s - t) / i
                : 4 + (t - r) / i),
          (e.h /= 6),
          e.h < 0 && (e.h += 1))
        : (e.h = 0),
      e
    );
  }
  set(t) {
    return (
      t._val
        ? (this._val = t._val)
        : ((this.r = t.r), (this.g = t.g), (this.b = t.b), (this.a = t.a)),
      this
    );
  }
  _fastSetA(t) {
    this._val = ((16777215 & this._val) | (t << 24)) >>> 0;
  }
  multiply(t) {
    var r = ((255 & this._val) * t.r) >> 8,
      s = ((65280 & this._val) * t.g) >> 8,
      e = ((16711680 & this._val) * t.b) >> 8,
      t = ((4278190080 & this._val) >>> 8) * t.a;
    return (
      (this._val = (4278190080 & t) | (16711680 & e) | (65280 & s) | (255 & r)),
      this
    );
  }
}
((Color.div = Color.divide),
  (Color.sub = Color.subtract),
  (Color.mul = Color.multiply),
  (Color.WHITE_R = Color.WHITE),
  (Color.BLACK_R = Color.BLACK),
  (Color.TRANSPARENT_R = Color.TRANSPARENT),
  (Color.GRAY_R = Color.GRAY),
  (Color.RED_R = Color.RED),
  (Color.GREEN_R = Color.GREEN),
  (Color.BLUE_R = Color.BLUE),
  (Color.YELLOW_R = Color.YELLOW),
  (Color.ORANGE_R = Color.ORANGE),
  (Color.CYAN_R = Color.CYAN),
  (Color.MAGENTA_R = Color.MAGENTA),
  (exports.default = Color));
