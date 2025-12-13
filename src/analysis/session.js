const fs = require("fs");
const path = require("path");

const { createContext } = require("../core/context");
const { runScriptExtraction } = require("../core/plugins/script-extractor");

class Session {
    constructor(pid) {
        this.pid = pid;
        this.global = { filePath: `analysis/${pid}` };
        this.analysis = null;
    }

    async analysisCode(callback) {
        try {
            console.warn('[DEPRECATED] 请使用: node src/main.js --scripts (可选: --scripts-entry/--scripts-needjs)');

            const ctx = createContext({
                dirIn: path.resolve("./input/assets"),
                dirOut: path.resolve("./output"),
                log: console,
            });

            await runScriptExtraction(ctx, {
                needJsPath: path.resolve("needjs.json"),
                beautify: true,
            });

            callback && callback();
        } catch (error) {
            console.log("读取或解析文件时出错:", error.message);
            callback && callback();
        }
    }

    delete_dir(targetPath) {
        if (!fs.existsSync(targetPath)) return;

        // 递归删除目录
        const deleteDirRecursive = (dirPath) => {
            fs.readdirSync(dirPath).forEach((name) => {
                const fullPath = path.join(dirPath, name);
                const stat = fs.lstatSync(fullPath);

                if (stat.isDirectory()) {
                    console.log("delete_dir", fullPath);
                    deleteDirRecursive(fullPath);
                } else {
                    console.log("delete_dir", fullPath);
                    fs.unlinkSync(fullPath);
                }
            });

            console.log("delete_dir", dirPath);
            fs.rmSync(dirPath, { recursive: true, force: true });
        };

        deleteDirRecursive(targetPath);
    }
}

function NewSession(pid) {
    return new Session(pid);
}

module.exports = { NewSession };
