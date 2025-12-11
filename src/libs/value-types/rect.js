var __importDefault =
  (this && this.__importDefault) ||
  function (t) {
    return t && t.__esModule ? t : { default: t };
  };
Object.defineProperty(exports, "__esModule", { value: !0 });
let value_type_1 = __importDefault(require("./value-type")),
  vec2_1 = __importDefault(require("./vec2")),
  size_1 = __importDefault(require("./size"));
class Rect extends value_type_1.default {
  static fromMinMax(t, h) {
    var i = Math.min(t.x, h.x),
      e = Math.min(t.y, h.y),
      s = Math.max(t.x, h.x),
      t = Math.max(t.y, h.y);
    return new Rect(i, e, s - i, t - e);
  }
  constructor(t = 0, h = 0, i = 0, e = 0) {
    (super(),
      t &&
        "object" == typeof t &&
        ((h = t.y), (i = t.width), (e = t.height), (t = t.x)),
      (this.x = t || 0),
      (this.y = h || 0),
      (this.width = i || 0),
      (this.height = e || 0));
  }
  clone() {
    return new Rect(this.x, this.y, this.width, this.height);
  }
  equals(t) {
    return (
      t &&
      this.x === t.x &&
      this.y === t.y &&
      this.width === t.width &&
      this.height === t.height
    );
  }
  lerp(t, h, i) {
    i = i || new Rect();
    var e = this.x,
      s = this.y,
      r = this.width,
      x = this.height;
    return (
      (i.x = e + (t.x - e) * h),
      (i.y = s + (t.y - s) * h),
      (i.width = r + (t.width - r) * h),
      (i.height = x + (t.height - x) * h),
      i
    );
  }
  set(t) {
    return (
      (this.x = t.x),
      (this.y = t.y),
      (this.width = t.width),
      (this.height = t.height),
      this
    );
  }
  intersects(t) {
    var h = this.x + this.width,
      i = this.y + this.height,
      e = t.x + t.width;
    return !(h < t.x || e < this.x || i < t.y || t.y + t.height < this.y);
  }
  intersection(t, h) {
    var i = this.x,
      e = this.y,
      s = this.x + this.width,
      r = this.y + this.height,
      x = h.x,
      n = h.y,
      y = h.x + h.width,
      h = h.y + h.height;
    return (
      (t.x = Math.max(i, x)),
      (t.y = Math.max(e, n)),
      (t.width = Math.min(s, y) - t.x),
      (t.height = Math.min(r, h) - t.y),
      t
    );
  }
  contains(t) {
    return (
      this.x <= t.x &&
      this.x + this.width >= t.x &&
      this.y <= t.y &&
      this.y + this.height >= t.y
    );
  }
  containsRect(t) {
    return (
      this.x <= t.x &&
      this.x + this.width >= t.x + t.width &&
      this.y <= t.y &&
      this.y + this.height >= t.y + t.height
    );
  }
  union(t, h) {
    var i = this.x,
      e = this.y,
      s = this.width,
      r = this.height,
      x = h.x,
      n = h.y,
      y = h.width,
      h = h.height;
    return (
      (t.x = Math.min(i, x)),
      (t.y = Math.min(e, n)),
      (t.width = Math.max(i + s, x + y) - t.x),
      (t.height = Math.max(e + r, n + h) - t.y),
      t
    );
  }
  transformMat4(t, h) {
    var i = this.x,
      e = this.y,
      s = i + this.width,
      r = e + this.height,
      x = (h = h.m)[0] * i + h[4] * e + h[12],
      n = h[1] * i + h[5] * e + h[13],
      y = h[0] * s + h[4] * e + h[12],
      e = h[1] * s + h[5] * e + h[13],
      a = h[0] * i + h[4] * r + h[12],
      i = h[1] * i + h[5] * r + h[13],
      d = h[0] * s + h[4] * r + h[12],
      s = h[1] * s + h[5] * r + h[13],
      r = Math.min(x, y, a, d),
      h = Math.max(x, y, a, d),
      x = Math.min(n, e, i, s),
      y = Math.max(n, e, i, s);
    return ((t.x = r), (t.y = x), (t.width = h - r), (t.height = y - x), t);
  }
  toString() {
    return (
      "(" +
      this.x.toFixed(2) +
      ", " +
      this.y.toFixed(2) +
      ", " +
      this.width.toFixed(2) +
      ", " +
      this.height.toFixed(2) +
      ")"
    );
  }
  get xMin() {
    return this.x;
  }
  set xMin(t) {
    ((this.width += this.x - t), (this.x = t));
  }
  get yMin() {
    return this.y;
  }
  set yMin(t) {
    ((this.height += this.y - t), (this.y = t));
  }
  get xMax() {
    return this.x + this.width;
  }
  set xMax(t) {
    this.width = t - this.x;
  }
  get yMax() {
    return this.y + this.height;
  }
  set yMax(t) {
    this.height = t - this.y;
  }
  get center() {
    return new vec2_1.default(
      this.x + 0.5 * this.width,
      this.y + 0.5 * this.height,
    );
  }
  set center(t) {
    ((this.x = t.x - 0.5 * this.width), (this.y = t.y - 0.5 * this.height));
  }
  get origin() {
    return new vec2_1.default(this.x, this.y);
  }
  set origin(t) {
    ((this.x = t.x), (this.y = t.y));
  }
  get size() {
    return new size_1.default(this.width, this.height);
  }
  set size(t) {
    ((this.width = t.width), (this.height = t.height));
  }
}
exports.default = Rect;
