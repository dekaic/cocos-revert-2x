function MutableForwardIterator(t) {
  ((this.i = 0), (this.array = t));
}
var proto = MutableForwardIterator.prototype;
((proto.remove = function (t) {
  0 <= (t = this.array.indexOf(t)) && this.removeAt(t);
}),
  (proto.removeAt = function (t) {
    (this.array.splice(t, 1), t <= this.i && --this.i);
  }),
  (proto.fastRemove = function (t) {
    0 <= (t = this.array.indexOf(t)) && this.fastRemoveAt(t);
  }),
  (proto.fastRemoveAt = function (t) {
    var r = this.array;
    ((r[t] = r[r.length - 1]), --r.length, t <= this.i && --this.i);
  }),
  (proto.push = function (t) {
    this.array.push(t);
  }),
  (module.exports = MutableForwardIterator));
