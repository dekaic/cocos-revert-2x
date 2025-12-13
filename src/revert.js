const path = require("path");
const { createContext } = require("./core/context");
const { runRevert } = require("./core/pipeline");

const dirPath = path.resolve(".");

const revert = {
    dirIn: `${dirPath}/input/assets`,
    dirOut: `${dirPath}/output/`,

    async start(done) {
        const ctx = createContext({ dirIn: this.dirIn, dirOut: this.dirOut, log: console });
        await runRevert(ctx);
        if (done) done();
    },
};

module.exports = revert;

