const fs = require("fs");
const path = require("path");

const getStat = (targetPath) => {
    try {
        return fs.statSync(targetPath);
    } catch {
        return false;
    }
};

const mkdir = (targetPath) => {
    try {
        fs.mkdirSync(targetPath);
        return true;
    } catch {
        return false;
    }
};

const dirExists = async (targetPath) => {
    const stats = getStat(targetPath);
    if (stats && stats.isDirectory()) {
        return true;
    }

    if (!stats) {
        const parentDir = path.parse(targetPath).dir;
        const parentExists = await dirExists(parentDir);
        return parentExists && mkdir(targetPath);
    }

    return false;
};

const walkSync = (rootDir, fileFilter, onFile, bundleName) => {
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
            walkSync(fullPath, fileFilter, onFile, subBundle);
        }
    }
};

// 清理目录
const clearDir = (targetPath) => {
    if (!fs.existsSync(targetPath)) return;

    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(targetPath, entry.name);
        if (entry.isDirectory()) {
            clearDir(fullPath);
            fs.rmdirSync(fullPath);
        } else {
            fs.unlinkSync(fullPath);
        }
    }
};

const DirUtils = {
    getStat,
    mkdir,
    dirExists,
    walkSync,
    clearDir,
};

module.exports = DirUtils;
