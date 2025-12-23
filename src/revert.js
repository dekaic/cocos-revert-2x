const path = require("path");
const { createContext } = require("./core/context");
const { runRevert } = require("./core/pipeline");
const { initErrorLog } = require("./utils/error-log");

const dirPath = path.resolve(".");

const revert = {
    dirIn: `${dirPath}/input/assets`,
    dirOut: `${dirPath}/output/`,

    async start(done) {
        initErrorLog({ logFilePath: path.join(this.dirOut, "error.log") });
        const ctx = createContext({ dirIn: this.dirIn, dirOut: this.dirOut, log: console });
        await runRevert(ctx);
        if (done) done();
    },
};

module.exports = revert;
