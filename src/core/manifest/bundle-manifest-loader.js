const path = require("path");
const DirUtils = require("../../utils/dir-utils");

const CONFIG_JSON_REGEX = /^config(\.[^.]+)?\.json$/i;

function collectBundleConfigPaths(dirIn) {
    const candidates = new Map();

    DirUtils.walkSync(
        dirIn,
        (entry) => entry.isFile() && CONFIG_JSON_REGEX.test(entry.name),
        (name, fullPath, bundleName) => {
            const current = candidates.get(bundleName);
            if (!current) {
                candidates.set(bundleName, fullPath);
                return;
            }

            const currentBase = path.basename(current);
            const nextBase = path.basename(fullPath);

            if (currentBase !== "config.json" && nextBase === "config.json") {
                candidates.set(bundleName, fullPath);
            }
        }
    );

    return Array.from(candidates.entries()).map(([bundleName, fullPath]) => ({
        bundleName,
        fullPath,
    }));
}

module.exports = {
    collectBundleConfigPaths,
};

