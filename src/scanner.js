const fs = require("fs");
const path = require("path");

// 深度优先遍历目录
function walkSync(rootDir, fileFilter, onFile, bundleName) {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(rootDir, entry.name);
        if (entry.isFile()) {
            if (fileFilter(entry)) {
                onFile(entry.name, fullPath, bundleName);
            }
            continue;
        }

        if (entry.isDirectory()) {
            const subBundle = bundleName || entry.name;
            this.walkSync(fullPath, fileFilter, onFile, subBundle);
        }
    }
}

module.exports = {
    walkSync,
};
