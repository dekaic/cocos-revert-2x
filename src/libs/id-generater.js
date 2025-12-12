var NonUuidMark = ".";

/*
 * @param {string} [category] - You can specify a unique category to avoid id collision with other instance of IdGenerater
 */
function IdGenerater(category) {
    // init with a random id to emphasize that the returns id should not be stored in persistence data
    this.id = 0 | (Math.random() * 998);

    this.prefix = category ? category + NonUuidMark : "";
}

/*
 * @method getNewId
 * @return {string}
 */
IdGenerater.prototype.getNewId = function () {
    return this.prefix + ++this.id;
};

/*
 * The global id generater might have a conflict problem once every 365 days,
 * if the game runs at 60 FPS and each frame 4760273 counts of new id are requested.
 */
IdGenerater.global = new IdGenerater("global");

module.exports = IdGenerater;
