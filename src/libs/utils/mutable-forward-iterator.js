/**
 * @example
 * var array = [0, 1, 2, 3, 4];
 * var iterator = new cc.js.array.MutableForwardIterator(array);
 * for (iterator.i = 0; iterator.i < array.length; ++iterator.i) {
 *     var item = array[iterator.i];
 *     ...
 * }
 */
function MutableForwardIterator(array) {
    this.i = 0;
    this.array = array;
}

var proto = MutableForwardIterator.prototype;

proto.remove = function (value) {
    var index = this.array.indexOf(value);
    if (index >= 0) {
        this.removeAt(index);
    }
};
proto.removeAt = function (i) {
    this.array.splice(i, 1);

    if (i <= this.i) {
        --this.i;
    }
};
proto.fastRemove = function (value) {
    var index = this.array.indexOf(value);
    if (index >= 0) {
        this.fastRemoveAt(index);
    }
};
proto.fastRemoveAt = function (i) {
    var array = this.array;
    array[i] = array[array.length - 1];
    --array.length;

    if (i <= this.i) {
        --this.i;
    }
};

proto.push = function (item) {
    this.array.push(item);
};

//js.getset(proto, 'length',
//    function () {
//        return this.array.length;
//    },
//    function (len) {
//        this.array.length = len;
//        if (this.i >= len) {
//            this.i = len - 1;
//        }
//    }
//);

module.exports = MutableForwardIterator;
