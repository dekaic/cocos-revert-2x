const path = require("path");
const baseHelpers = require("../utils/helpers");
const { EXT_MAP, createRevertState } = require("./state");

const ensureTrailingSlash = (dirPath) => (dirPath.endsWith(path.sep) ? dirPath : `${dirPath}${path.sep}`);

function createHelpers() {
    return { ...baseHelpers };
}

function createContext(options) {
    if (!options) {
        throw new Error("createContext(options) is required");
    }

    const dirIn = options.dirIn ? path.resolve(options.dirIn) : path.resolve("./input/assets");
    const dirOut = ensureTrailingSlash(options.dirOut ? path.resolve(options.dirOut) : path.resolve("./output"));

    return {
        dirIn,
        dirOut,
        extMap: EXT_MAP,
        helpers: createHelpers(),
        state: createRevertState(),
        log: options.log || console,
    };
}

module.exports = {
    createContext,
};
