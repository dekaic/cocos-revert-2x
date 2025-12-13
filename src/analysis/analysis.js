const fs = require("fs");
const path = require("path");
const vm = require("vm");

const UuidUtils = require("../utils/uuid-utils");

// 负责把打包后的 Cocos Creator 模块代码拆成单独脚本文件
class Analysis {
    constructor(needmap, options = {}) {
        // classes:   模块名 -> 源码字符串
        // mapping:   webpack 内部 id -> 真实脚本路径（相对 outputRoot）
        // metamap:   模块名 -> uuid（来自 cc._RF.push）
        // needmap:   外部传入的“需要导出的脚本白名单”
        this.classes = {};
        this.mapping = {};
        this.metamap = {};
        this.needmap = needmap || {};

        this.outputRoot = options.outputRoot ? path.resolve(options.outputRoot) : path.resolve("output", "scripts");
        this.logger = options.logger || console;
    }

    // 拆分一整个 bundle 的 js 文本
    async splitCompile(codeText) {
        this.classes = {};
        this.mapping = {};
        this.metamap = {};

        if (Analysis.isEmptyBundleIndex(codeText)) {
            this.logger.log("bundle 未包含脚本模块（modules 为空），跳过。");
            return false;
        }

        const modulesSource = Analysis.extractModulesObjectSource(codeText);
        if (!modulesSource) {
            this.logger.warn("无法定位 bundle 的 modules 对象，跳过脚本拆分。");
            return false;
        }

        let modules;
        try {
            modules = vm.runInNewContext(`(${modulesSource})`, {}, { timeout: 10_000 });
        } catch (err) {
            this.logger.warn("解析 bundle modules 对象失败，跳过脚本拆分。", err);
            return false;
        }

        this.buildMappingFromModules(modules);

        let wroteAny = false;

        for (const [moduleName, moduleTuple] of Object.entries(modules)) {
            if (!Array.isArray(moduleTuple) || typeof moduleTuple[0] !== "function") continue;

            const factoryFn = moduleTuple[0];
            const { sourceText, uuid } = this.renderModule(factoryFn);

            this.classes[moduleName] = sourceText;
            if (uuid) {
                this.metamap[moduleName] = uuid;
            }

            const mappedRelativePath = this.mapping[moduleName];
            const relativePath = mappedRelativePath || `${moduleName}.js`;

            let outputRelativePath = relativePath;

            if (!uuid) {
                let base = relativePath;
                const parts = base.split(".");
                base = parts[0];

                outputRelativePath = `unkown/${relativePath}`;

                if (this.needmap && this.needmap.allcodes && this.needmap.allcodes > 0) {
                    // export all non-uuid scripts
                } else if (!this.needmap || !this.needmap[base]) {
                    continue;
                }
            }

            const outputPath = path.join(this.outputRoot, Analysis.sanitizeRelativePath(outputRelativePath));
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, sourceText, "utf-8");

            if (uuid) {
                const meta = {
                    ver: "1.1.0",
                    uuid,
                    importer: "javascript",
                    isPlugin: false,
                    loadPluginInWeb: true,
                    loadPluginInNative: true,
                    loadPluginInEditor: false,
                    subMetas: {},
                };
                fs.writeFileSync(`${outputPath}.meta`, JSON.stringify(meta, null, 2), "utf-8");
            }

            wroteAny = true;
        }

        return wroteAny;
    }

    // 判断字符串是否是数字
    isNumber(str) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    }

    buildMappingFromModules(modules) {
        for (const moduleTuple of Object.values(modules)) {
            if (!Array.isArray(moduleTuple) || !moduleTuple[1] || typeof moduleTuple[1] !== "object") continue;

            for (const [requestPath, internalId] of Object.entries(moduleTuple[1])) {
                const fileName = Analysis.ensureScriptExtension(requestPath);
                this.mapping[String(internalId)] = fileName;
            }
        }
    }

    renderModule(factoryFn) {
        const fnSource = factoryFn.toString();

        const paramMatch = fnSource.match(/^[^(]*\(([^)]*)\)/);
        const params = paramMatch
            ? paramMatch[1]
                  .split(",")
                  .map((value) => value.trim())
                  .filter((value) => value.length > 0)
            : [];

        const header = [];
        if (params.length >= 1) header.push(`let ${params[0]} = require;`);
        if (params.length >= 2) header.push(`let ${params[1]} = module;`);
        if (params.length >= 3) header.push(`let ${params[2]} = exports;`);

        const bodyStartIndex = fnSource.indexOf("{");
        const bodyEndIndex = fnSource.lastIndexOf("}");
        const body = bodyStartIndex !== -1 && bodyEndIndex !== -1 && bodyEndIndex > bodyStartIndex ? fnSource.slice(bodyStartIndex + 1, bodyEndIndex) : "";

        const sourceText = `${header.length ? `${header.join("\n")}\n` : ""}${body}\n`;
        const uuid = Analysis.extractUuidFromModuleBody(body);

        return { sourceText, uuid };
    }

    static extractUuidFromModuleBody(body) {
        const match = body.match(/cc\._RF\.push\(\s*[^,]+,\s*["']([^"']+)["']/);
        if (!match) return null;
        return UuidUtils.decompressUuid(match[1]);
    }

    static ensureScriptExtension(value) {
        let fileName = String(value).replace(/\\/g, "/");
        if (!fileName.endsWith(".js") && !fileName.endsWith(".ts")) {
            fileName += ".js";
        }
        return fileName;
    }

    static sanitizeRelativePath(value) {
        let normalized = String(value).replace(/\\/g, "/");
        normalized = normalized.replace(/^[a-zA-Z]:/, "");
        normalized = normalized.replace(/^\/+/, "");
        normalized = normalized.replace(/^(\.\/)+/, "");
        normalized = normalized.replace(/\.\.\//g, "");
        normalized = normalized.replace(/\/+/g, "/");
        return normalized;
    }

    static extractModulesObjectSource(codeText) {
        const entryMatch = /:\s*\[\s*function\s*\(/m.exec(codeText);
        if (!entryMatch) return null;

        const startIndex = codeText.lastIndexOf("{", entryMatch.index);
        if (startIndex === -1) return null;

        const candidates = [];
        const endRegex = /}\s*,\s*{\s*}\s*,\s*\[/g;

        let match;
        while ((match = endRegex.exec(codeText))) {
            if (match.index > startIndex) candidates.push(match.index);
        }

        if (candidates.length === 0) {
            const legacyIndex = codeText.lastIndexOf("},{},[");
            if (legacyIndex !== -1 && legacyIndex > startIndex) candidates.push(legacyIndex);
        }

        if (candidates.length === 0) return null;

        candidates.sort((a, b) => b - a);
        for (const endIndex of candidates) {
            const source = codeText.slice(startIndex, endIndex + 1);
            try {
                vm.runInNewContext(`(${source})`, {}, { timeout: 10_000 });
                return source;
            } catch {
                // try next candidate
            }
        }

        return null;
    }

    static isEmptyBundleIndex(codeText) {
        // Typical empty bundle index.js:
        // (function r(e,n,t){...})( {}, {}, [] );
        const iifeCall = /\)\s*\(\s*\{\s*}\s*,\s*\{\s*}\s*,\s*\[\s*]\s*\)\s*;?\s*$/.test(codeText);
        const unaryIifeCall = /}\s*\(\s*\{\s*}\s*,\s*\{\s*}\s*,\s*\[\s*]\s*\)\s*;?\s*$/.test(codeText);
        return iifeCall || unaryIifeCall;
    }
}

module.exports = Analysis;
