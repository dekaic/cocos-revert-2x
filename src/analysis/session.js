let fs = require("fs");
let path = require("path");
let DirUtils = require("../utils/dir-utils");

class Session {
    constructor(pid) {
        this.pid = pid;
        this.global = { filePath: `analysis/${pid}` };
        this.analysis = null;
    }

    async analysisCode(callback) {
        try {
            // 统一项目根路径，避免执行目录变化导致的相对路径失效
            const projectRoot = path.resolve(__dirname, "../..");
            const resolveFromRoot = (...segments) => path.join(projectRoot, ...segments);

            // 设置全局资源路径
            global.currPath = resolveFromRoot("input", "res");

            // 加载并解析 settings.js，构造 CCSettings
            const settingsContent = fs.readFileSync(resolveFromRoot("input", "src", "settings.js"));
            const settingsStr = settingsContent.toString("utf-8");
            const firstStatement = settingsStr.split(";")[0]; // 只取第一段定义
            const wrappedSettings = `let window = {CCSettings: {}};${firstStatement}`;

            // eval 生成 Settings（保持原有行为）
            global.Settings = eval(wrappedSettings);

            // 初始化 conf，生成 output/mapsubs.json
            const conf = require("../porject/conf");
            await conf.init();

            const mapSubsPath = resolveFromRoot("output", "mapsubs.json");
            const mapSubsContent = fs.readFileSync(mapSubsPath, "utf-8");
            const mapSubsJson = JSON.parse(mapSubsContent);
            const bundleNames = Object.keys(mapSubsJson);

            const needJsPath = resolveFromRoot("needjs.json");
            let needMap = {};

            // 读取需要分析的 js 映射表
            const needJsStat = await DirUtils.getStat(needJsPath);
            if (needJsStat) {
                const needJsContent = fs.readFileSync(needJsPath);
                needMap = JSON.parse(needJsContent);
            }

            let hasResult = false;

            // 遍历所有 bundle 分析 index.js
            for (const bundleName of bundleNames) {
                console.log("处理模块:", bundleName);

                const bundleIndexPath = resolveFromRoot("input", "assets", bundleName, "index.js");
                const indexStat = await DirUtils.getStat(bundleIndexPath);

                if (!indexStat) continue;

                console.log("分析文件:", bundleIndexPath);

                const code = fs.readFileSync(bundleIndexPath, "utf-8");
                const Analysis = require("./analysis");

                this.analysis = new Analysis(needMap);
                const thisBundleHasResult = this.analysis.splitCompile(code);

                if (thisBundleHasResult) {
                    hasResult = true;
                }
            }

            // 如果有分析结果，对 output/scripts 下所有 js 做一次美化
            if (hasResult) {
                const beautify = require("js-beautify").js;

                const beautifyDirectory = (dirPath) => {
                    fs.readdirSync(dirPath).forEach((name) => {
                        const fullPath = path.join(dirPath, name);
                        const stat = fs.statSync(fullPath);

                        if (stat.isDirectory()) {
                            beautifyDirectory(fullPath);
                            return;
                        }

                        if (stat.isFile() && path.extname(fullPath) === ".js") {
                            let content = fs.readFileSync(fullPath, "utf8");
                            content = beautify(content, {
                                indent_size: 2,
                                space_in_empty_paren: true,
                            });
                            fs.writeFileSync(fullPath, content, "utf8");
                            console.log("Beautified:", fullPath);
                        }
                    });
                };

                beautifyDirectory(resolveFromRoot("output", "scripts"));
            }

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
