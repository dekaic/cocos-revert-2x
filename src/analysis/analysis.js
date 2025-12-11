let fs = require("fs");
let path = require("path");
let UuidUtils = require("./utils/uuid-utils");

// 负责把打包后的 Cocos Creator 模块代码拆成单独脚本文件
class Analysis {
    constructor(needmap) {
        // classes:   模块名 -> 源码字符串
        // mapping:   webpack 内部 id -> 真实脚本路径（相对 output/scripts）
        // metamap:   模块名 -> uuid（来自 cc._RF.push）
        // needmap:   外部传入的“需要导出的脚本白名单”
        this.classes = {};
        this.mapping = {};
        this.metamap = {};
        this.needmap = needmap || {};
    }

    // 拆分一整个 bundle 的 js 文本
    async splitCompile(codeText) {
        let startIndex = codeText.indexOf(":[function(");
        if (startIndex === -1) {
            console.log("查找代码结束");
            return null;
        }

        // 从 ":[function(" 向前找到最近的 "{"
        startIndex = codeText.lastIndexOf("{", startIndex);
        if (startIndex === -1) {
            console.log('没有找到起始的 "{"');
            return null;
        }

        // bundle 末尾标记 "},{},["
        let endIndex = codeText.lastIndexOf("},{},[");
        if (endIndex === -1) {
            console.log('没有找到结束的 "},{},["');
            return null;
        }

        console.log("generatorCode start");

        // 截出所有模块定义代码
        let modulesBlock = codeText.substring(startIndex, endIndex + 1);
        // 原实现前面加一个逗号，方便后面解析
        modulesBlock = "," + modulesBlock.slice(1);

        // 递归解析出 this.classes / this.mapping / this.metamap
        this.generatorCode(modulesBlock);

        // 按模块名输出脚本
        for (const moduleName in this.classes) {
            let mappedRelativePath = this.mapping[moduleName];
            // 有映射则用映射路径，否则模块名 + ".js"
            let relativePath = mappedRelativePath || `${moduleName}.js`;
            let outputPath = `output/scripts/${relativePath}`;

            // 没有 uuid（非 Engine 组件脚本）时，按 needmap 过滤
            if (!this.metamap[moduleName]) {
                let base = relativePath;
                const parts = base.split(".");
                base = parts[0];

                // 无 uuid 的脚本统一丢到 unkown 目录
                outputPath = `output/scripts/unkown/${relativePath}`;

                if (this.needmap.allcodes && this.needmap.allcodes > 0) {
                    console.log("need all codes");
                } else if (!this.needmap || !this.needmap[base]) {
                    // 不在白名单内则跳过
                    continue;
                }
            }

            // 归一化路径，创建目录并写出文件
            const normalizedPath = outputPath.replace(/\.\.\//g, "").replace(/\\/g, "/");
            const pathParts = normalizedPath.split("/");
            pathParts.pop(); // 去掉文件名，留下目录
            fs.mkdirSync(pathParts.join("/"), { recursive: true });

            fs.writeFileSync(normalizedPath, this.classes[moduleName], { undefined: void 0 }, (err) => {
                if (err) {
                    console.log("new script err:", err);
                }
            });

            // 如果有 uuid，则额外写 .meta
            if (this.metamap[moduleName]) {
                let meta = {
                    ver: "1.1.0",
                    uuid: this.metamap[moduleName],
                    importer: "javascript",
                    isPlugin: false,
                    loadPluginInWeb: true,
                    loadPluginInNative: true,
                    loadPluginInEditor: false,
                    subMetas: {},
                };

                const metaStr = JSON.stringify(meta, null, 2);
                console.log("create script = ", moduleName);

                fs.writeFileSync(normalizedPath + ".meta", metaStr, { undefined: void 0 }, (err) => {
                    if (err) {
                        console.log("newMetaSbine err:", err);
                    }
                });
            }
        }

        console.log("generatorCode over");
        return true;
    }

    // 判断字符串是否是数字
    isNumber(str) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    }

    // 解析 modulesBlock，把每个 [function(require,module,exports){...}] 拆出来
    generatorCode(source) {
        const FUNCTION_MARK = ":[function(";
        const RF_PUSH_MARK = "cc._RF.push(";

        let fnMarkIndex = source.indexOf(FUNCTION_MARK);
        if (fnMarkIndex === -1) {
            console.log("查找代码结束");
            return null;
        }

        // 向前找到模块名和函数定义之间的逗号
        let moduleNameCommaIndex = source.lastIndexOf(",", fnMarkIndex);
        if (moduleNameCommaIndex === -1) {
            console.log('没有找到起始的 ","');
            return null;
        }

        // 提取模块名
        let moduleName = source.substring(moduleNameCommaIndex + 1, fnMarkIndex);
        moduleName = moduleName.replace(/"/g, "");

        console.log("name = ", moduleName);
        if (moduleName.includes("DialogConfig")) {
            console.log();
        }

        // 找到函数体起始 "){"
        let bodyStartIndex = source.indexOf("){");
        if (bodyStartIndex === -1) {
            console.log("没有找到起始的 use strict");
            return null;
        }

        // 解析 (require,module,exports) 参数列表
        const params = source.substring(fnMarkIndex + FUNCTION_MARK.length, source.indexOf(")")).split(",");

        this.classes[moduleName] = "";

        if (params.length >= 3) {
            this.classes[moduleName] = `let ${params[0]} = require;
let ${params[1]} = module;
let ${params[2]} = exports;
`;
        } else if (params.length >= 2) {
            this.classes[moduleName] = `let ${params[0]} = require;
let ${params[1]} = module;
`;
        } else if (params.length >= 1 && params[0].length > 0) {
            this.classes[moduleName] = `let ${params[0]} = require;
`;
        }

        // 去掉函数头部，直接从 body 开始
        let rest = source.substring(bodyStartIndex + 2);

        // 查找下一个模块定义或 bundle 末尾
        let cutIndex = -1;
        const nextMatch = rest.match(/}],"?[\w.-]+"?:\[function\(/);
        if (nextMatch) {
            cutIndex = nextMatch.index;
        } else if (fnMarkIndex < rest.length && (cutIndex = rest.lastIndexOf("}]}")) === -1) {
            console.log('没有下一个 "}]}');
            return null;
        }

        const currentModuleBlock = rest.substring(0, cutIndex);
        const lastSplitIndex = currentModuleBlock.lastIndexOf("},{");
        if (lastSplitIndex === -1) {
            console.log("分割代码失败 },{");
            return null;
        }

        // 填充当前模块主体代码
        this.classes[moduleName] += currentModuleBlock.substring(0, lastSplitIndex);

        // 提取 cc._RF.push 信息，记录 uuid
        let rfIndex = this.classes[moduleName].indexOf(RF_PUSH_MARK);
        if (rfIndex !== -1) {
            let part = this.classes[moduleName].substring(rfIndex + RF_PUSH_MARK.length);
            const endParenIndex = part.indexOf(")");
            part = part.substring(0, endParenIndex);
            const args = part.split(",");
            this.metamap[moduleName] = UuidUtils.decompressUuid(args[1].replace(/"/g, ""));
        }

        // 解析模块间的重映射关系 a:b,c:d...
        let mappingRaw = currentModuleBlock.substring(lastSplitIndex + "},{".length, currentModuleBlock.length);

        if (moduleName.includes("wxpopuppush")) {
            console.log();
        }

        if (mappingRaw.includes(":")) {
            mappingRaw = mappingRaw.endsWith("}") ? mappingRaw.substring(0, mappingRaw.length - 1) : mappingRaw;

            const mappingPairs = mappingRaw.split(",");

            for (let idx = 0; idx < mappingPairs.length; idx++) {
                const pair = mappingPairs[idx].split(":");
                let left = pair[0];
                const right = pair[1];

                // a:b 且 b 非数字，才做字符串替换与 mapping 记录
                if (left !== right && !this.isNumber(right)) {
                    let from = left;
                    let to = right;
                    let tmpSplit;

                    // 左边没有引号，右边有，引号补齐
                    if (!from.includes('"') && to.includes('"')) {
                        from = `"${from}"`;
                    }
                    if (!from.includes("'") && to.includes("'")) {
                        from = `'${from}'`;
                    }

                    // void 0 形式，取路径最后一段
                    if (to.includes("void 0")) {
                        tmpSplit = from.split("/");
                        to = tmpSplit[tmpSplit.length - 1];
                        if (from[0] === '"') {
                            to = `"${to}"`;
                        }
                    }

                    if (from !== to) {
                        try {
                            const reg = new RegExp(from, "g");
                            this.classes[moduleName] = this.classes[moduleName].replace(reg, to);
                        } catch (err) {
                            console.log("error = ", err);
                        }
                    }
                }

                // 记录 webpack id -> 文件名 映射
                let fileName = pair[0].replace(/"/g, "");
                if (!fileName.endsWith(".js") && !fileName.endsWith(".ts")) {
                    fileName += ".js";
                }

                let key = pair[1].replace(/"/g, "");
                key = key.replace(/'/g, "");

                this.mapping[key] = fileName;
            }
        }

        // 递归处理剩余模块
        const nextSource = rest.substring(cutIndex + 2);
        this.generatorCode(nextSource);
    }
}

module.exports = Analysis;
