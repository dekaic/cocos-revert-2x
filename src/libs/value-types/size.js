var __importDefault =
  (this && this.__importDefault) ||
  function (t) {
    return t && t.__esModule ? t : { default: t };
  };
Object.defineProperty(exports, "__esModule", { value: !0 });
let value_type_1 = __importDefault(require("./value-type"));
class Size extends value_type_1.default {
  static get ZERO() {
    return new Size();
  }
  constructor(t = 0, e = 0) {
    (super(),
      t && "object" == typeof t
        ? ((this.width = t.width), (this.height = t.height))
        : ((this.width = t || 0), (this.height = e || 0)));
  }
  clone() {
    return new Size(this.width, this.height);
  }
  equals(t) {
    return t && this.width === t.width && this.height === t.height;
  }
  lerp(t, e, i) {
    i = i || new Size();
    var h = this.width,
      r = this.height;
    return (
      (i.width = h + (t.width - h) * e),
      (i.height = r + (t.height - r) * e),
      i
    );
  }
  set(t) {
    return ((this.width = t.width), (this.height = t.height), this);
  }
  toString() {
    return "(" + this.width.toFixed(2) + ", " + this.height.toFixed(2) + ")";
  }
}
((Size.ZERO_R = Size.ZERO), (exports.default = Size));
