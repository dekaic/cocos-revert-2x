var NonUuidMark = ".";
function IdGenerater(e) {
  ((this.id = 0 | (998 * Math.random())),
    (this.prefix = e ? e + NonUuidMark : ""));
}
((IdGenerater.prototype.getNewId = function () {
  return this.prefix + ++this.id;
}),
  (IdGenerater.global = new IdGenerater("global")),
  (module.exports = IdGenerater));
