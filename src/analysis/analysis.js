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
        this.bundleName = options.bundleName || null;
        this.entryFile = options.entryFile || null;
        this.selfContainedRf = Boolean(options.selfContainedRf);
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
            const defineModules = Analysis.extractDefineModules(codeText, this.logger);
            if (defineModules.length > 0) {
                return this.writeDefineModules(defineModules);
            }

            this.logger.warn("无法定位 bundle 的 modules 对象，跳过脚本拆分。");
            return false;
        }

        let modules;
        try {
            modules = vm.runInNewContext(`(${modulesSource})`, {}, { timeout: 10000 });
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
            const relativePath = mappedRelativePath || Analysis.ensureScriptExtension(moduleName);

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
        const targets = ["require", "module", "exports"];
        for (let idx = 0; idx < Math.min(params.length, targets.length); idx += 1) {
            const alias = params[idx];
            const target = targets[idx];
            if (!alias || alias === target) continue;
            if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(alias)) continue;
            header.push(`let ${alias} = ${target};`);
        }

        const bodyStartIndex = fnSource.indexOf("{");
        const bodyEndIndex = fnSource.lastIndexOf("}");
        const body = bodyStartIndex !== -1 && bodyEndIndex !== -1 && bodyEndIndex > bodyStartIndex ? fnSource.slice(bodyStartIndex + 1, bodyEndIndex) : "";

        const sourceText = `${header.length ? `${header.join("\n")}\n` : ""}${body}\n`;
        const uuid = Analysis.extractUuidFromModuleBody(body);

        return { sourceText, uuid };
    }

    writeDefineModules(defineModules) {
        let wroteAny = false;

        for (const moduleDef of defineModules) {
            const { sourceText } = this.renderModule(moduleDef.factoryFn);
            const moduleRelativePath = Analysis.sanitizeRelativePath(Analysis.ensureScriptExtension(moduleDef.id));
            const rfCount = Analysis.countOccurrences(sourceText, "cc._RF.push(");
            if (rfCount > 1) {
                const baseDir = path.posix.dirname(moduleRelativePath);
                const bundleFileName = `_bundle_${path.posix.basename(moduleRelativePath)}`;
                const bundleRelativePath = Analysis.sanitizeRelativePath(baseDir ? `${baseDir}/${bundleFileName}` : bundleFileName);
                const bundleOutputPath = path.join(this.outputRoot, bundleRelativePath);

                fs.mkdirSync(path.dirname(bundleOutputPath), { recursive: true });
                fs.writeFileSync(bundleOutputPath, sourceText, "utf-8");
                wroteAny = true;

                if (this.selfContainedRf) {
                    const splitCount = this.writeRfPushScriptsSelfContained(sourceText, baseDir);
                    wroteAny = wroteAny || splitCount > 0;
                    continue;
                }

                if (!Analysis.isSafeRfSplit(sourceText)) {
                    this.logger.warn(`RF 脚本拆分跳过：检测到共享前置代码，bundle 输出为 ${bundleRelativePath}`);
                    continue;
                }

                const splitCount = this.writeRfPushScripts(sourceText, baseDir);
                wroteAny = wroteAny || splitCount > 0;
                continue;
            }

            const moduleOutputPath = path.join(this.outputRoot, moduleRelativePath);
            fs.mkdirSync(path.dirname(moduleOutputPath), { recursive: true });
            fs.writeFileSync(moduleOutputPath, sourceText, "utf-8");
            wroteAny = true;
        }

        return wroteAny;
    }

    writeRfPushScripts(sourceText, baseDir) {
        const PUSH_MARK = "cc._RF.push(";
        const POP_MARK = "cc._RF.pop";
        const nameUuidRegex = /cc\._RF\.push\(\s*[^,]+,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/;

        let count = 0;
        let cursor = 0;
        const used = new Set();

        while (true) {
            const pushIndex = sourceText.indexOf(PUSH_MARK, cursor);
            if (pushIndex === -1) break;

            const popIndex = sourceText.indexOf(POP_MARK, pushIndex);
            if (popIndex === -1) break;

            const popParenIndex = sourceText.indexOf(")", popIndex);
            if (popParenIndex === -1) break;

            const headerSlice = sourceText.slice(pushIndex, Math.min(pushIndex + 400, sourceText.length));
            const match = headerSlice.match(nameUuidRegex);
            const compressedUuid = match ? match[1] : null;
            const scriptName = match ? match[2] : null;
            const uuid = compressedUuid ? UuidUtils.decompressUuid(compressedUuid) : null;

            let fileBase = scriptName ? scriptName.trim() : null;
            if (!fileBase) {
                fileBase = uuid ? uuid.replace(/-/g, "") : `script_${count + 1}`;
            }

            fileBase = fileBase.replace(/[<>:"|?*\u0000-\u001f]/g, "_").replace(/\s+/g, " ").trim();
            if (fileBase.length === 0) {
                fileBase = uuid ? uuid.replace(/-/g, "") : `script_${count + 1}`;
            }

            const relativeFileName = Analysis.ensureScriptExtension(fileBase);
            let relativePath = baseDir ? `${baseDir}/${relativeFileName}` : relativeFileName;
            relativePath = Analysis.sanitizeRelativePath(relativePath);
            const caseFolded = relativePath.toLowerCase();

            if (used.has(caseFolded)) {
                const suffix = uuid ? uuid.slice(0, 8) : String(count + 1);
                relativePath = baseDir ? `${baseDir}/${fileBase}-${suffix}.js` : `${fileBase}-${suffix}.js`;
                relativePath = Analysis.sanitizeRelativePath(relativePath);
            }
            used.add(relativePath.toLowerCase());

            const outputPath = path.join(this.outputRoot, relativePath);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });

            const segment = `${sourceText.slice(pushIndex, popParenIndex + 1)};\n`;
            fs.writeFileSync(outputPath, segment, "utf-8");

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

            count += 1;
            cursor = popParenIndex + 1;
        }

        if (count > 0) {
            this.logger.log(`RF 脚本拆分完成: ${count} 个脚本`);
        }

        return count;
    }

    writeRfPushScriptsSelfContained(sourceText, baseDir) {
        const blocks = Analysis.buildRfBlocks(sourceText);
        if (blocks.length === 0) return 0;

        const prelude = Analysis.normalizePrelude(blocks[0].prefix || "");
        blocks[0].prefix = "";

        const defMap = Analysis.scanGlobalDefinitions(sourceText);
        const preludeEnd = blocks[0].start;
        const preludeNames = new Set();
        for (const [name, pos] of defMap.entries()) {
            if (pos < preludeEnd) {
                preludeNames.add(name);
            }
        }

        const defBlockIndex = new Map();
        for (const [name, pos] of defMap.entries()) {
            defBlockIndex.set(name, Analysis.findBlockIndexForPos(pos, blocks));
        }

        const globalNames = new Set(defMap.keys());
        const depsByBlock = blocks.map((block, index) => {
            const ids = Analysis.collectIdentifiers(block.code, globalNames);
            const deps = new Set();
            for (const id of ids) {
                if (preludeNames.has(id)) continue;
                const defIdx = defBlockIndex.get(id);
                if (defIdx == null || defIdx < 0 || defIdx >= index) continue;
                deps.add(defIdx);
            }
            return deps;
        });

        const bundleKey = Analysis.normalizeBundleKey(this.bundleName || baseDir || "bundle");
        const header = Analysis.buildSelfContainedHeader(bundleKey, prelude);

        let count = 0;
        const used = new Set();

        for (const block of blocks) {
            const needed = Analysis.collectDependencyClosure(block.index, depsByBlock);
            const ordered = Array.from(needed).sort((a, b) => a - b);

            let fileBase = block.scriptName ? block.scriptName.trim() : null;
            if (!fileBase) {
                fileBase = block.uuid ? block.uuid.replace(/-/g, "") : `script_${count + 1}`;
            }

            fileBase = fileBase.replace(/[<>:"|?*\u0000-\u001f]/g, "_").replace(/\s+/g, " ").trim();
            if (fileBase.length === 0) {
                fileBase = block.uuid ? block.uuid.replace(/-/g, "") : `script_${count + 1}`;
            }

            const relativeFileName = Analysis.ensureScriptExtension(fileBase);
            let relativePath = baseDir ? `${baseDir}/${relativeFileName}` : relativeFileName;
            relativePath = Analysis.sanitizeRelativePath(relativePath);
            const caseFolded = relativePath.toLowerCase();

            if (used.has(caseFolded)) {
                const suffix = block.uuid ? block.uuid.slice(0, 8) : String(count + 1);
                relativePath = baseDir ? `${baseDir}/${fileBase}-${suffix}.js` : `${fileBase}-${suffix}.js`;
                relativePath = Analysis.sanitizeRelativePath(relativePath);
            }
            used.add(relativePath.toLowerCase());

            const outputPath = path.join(this.outputRoot, relativePath);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });

            let content = header;
            for (const idx of ordered) {
                const part = blocks[idx];
                const guardKey = part.uuid || part.scriptName || `block_${idx}`;
                const guardKeySafe = Analysis.escapeForDoubleQuotes(String(guardKey));
                const prefix = Analysis.normalizePrefix(part.prefix);
                content += `__ccExec("${guardKeySafe}", function () {\n${prefix}${part.code}\n});\n`;
            }
            fs.writeFileSync(outputPath, content, "utf-8");

            if (block.uuid) {
                const meta = {
                    ver: "1.1.0",
                    uuid: block.uuid,
                    importer: "javascript",
                    isPlugin: false,
                    loadPluginInWeb: true,
                    loadPluginInNative: true,
                    loadPluginInEditor: false,
                    subMetas: {},
                };
                fs.writeFileSync(`${outputPath}.meta`, JSON.stringify(meta, null, 2), "utf-8");
            }

            count += 1;
        }

        if (count > 0) {
            this.logger.log(`RF self-contained split: ${count} scripts`);
        }

        return count;
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
                vm.runInNewContext(`(${source})`, {}, { timeout: 10000 });
                return source;
            } catch {
                // try next candidate
            }
        }

        return null;
    }

    static extractDefineModules(codeText, logger) {
        if (!/\bdefine\(\s*["']/.test(codeText)) return [];

        const definitions = new Map();

        function define(...args) {
            let id;
            let factoryFn;

            if (typeof args[0] === "string") {
                id = args[0];
                if (typeof args[1] === "function") {
                    factoryFn = args[1];
                } else if (Array.isArray(args[1]) && typeof args[2] === "function") {
                    factoryFn = args[2];
                }
            }

            if (id && typeof factoryFn === "function") {
                definitions.set(id, factoryFn);
            }
        }

        define.amd = true;

        function require() {
            return {};
        }

        const sandboxConsole = {
            log: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            debug: () => {},
        };

        try {
            vm.runInNewContext(codeText, { define, require, console: sandboxConsole }, { timeout: 60000 });
        } catch (err) {
            if (logger && typeof logger.warn === "function") {
                logger.warn("define 模式脚本解析失败，跳过。", err);
            }
            return [];
        }

        return Array.from(definitions.entries()).map(([id, factoryFn]) => ({ id, factoryFn }));
    }

    static isSafeRfSplit(sourceText) {
        const pushIndex = sourceText.indexOf("cc._RF.push(");
        if (pushIndex === -1) return false;

        const prelude = sourceText.slice(0, pushIndex);
        const stripped = prelude
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/.*$/gm, "")
            .trim();

        if (!stripped) return true;
        if (/^["']use strict["'];?$/.test(stripped)) return true;

        return false;
    }

    static buildRfBlocks(sourceText) {
        const PUSH_MARK = "cc._RF.push(";
        const POP_MARK = "cc._RF.pop";
        const nameUuidRegex = /cc\._RF\.push\(\s*[^,]+,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/;

        const blocks = [];
        let cursor = 0;
        let prevEnd = 0;

        while (true) {
            const pushIndex = sourceText.indexOf(PUSH_MARK, cursor);
            if (pushIndex === -1) break;

            const popIndex = sourceText.indexOf(POP_MARK, pushIndex);
            if (popIndex === -1) break;

            const popParenIndex = sourceText.indexOf(")", popIndex);
            if (popParenIndex === -1) break;

            const headerSlice = sourceText.slice(pushIndex, Math.min(pushIndex + 400, sourceText.length));
            const match = headerSlice.match(nameUuidRegex);
            const compressedUuid = match ? match[1] : null;
            const scriptName = match ? match[2] : null;
            const uuid = compressedUuid ? UuidUtils.decompressUuid(compressedUuid) : null;

            const prefixRaw = sourceText.slice(prevEnd, pushIndex);
            const prefix = Analysis.normalizePrefix(prefixRaw);
            const code = `${sourceText.slice(pushIndex, popParenIndex + 1)};\n`;

            blocks.push({
                index: blocks.length,
                start: pushIndex,
                end: popParenIndex + 1,
                prefix,
                code,
                uuid,
                scriptName,
                compressedUuid,
            });

            prevEnd = popParenIndex + 1;
            cursor = popParenIndex + 1;
        }

        return blocks;
    }

    static normalizePrefix(prefix) {
        if (!prefix) return "";
        let cleaned = prefix.replace(/^\s*,\s*/, "");
        if (!cleaned.trim()) return "";
        return cleaned;
    }

    static normalizePrelude(prelude) {
        if (!prelude) return "";
        let cleaned = prelude.replace(/\s+$/, "");
        if (cleaned.endsWith(",")) {
            cleaned = cleaned.slice(0, -1).replace(/\s+$/, "");
            if (cleaned && !/[;}]$/.test(cleaned)) {
                cleaned += ";";
            }
        }
        if (!cleaned.trim()) return "";
        return `${cleaned}\n`;
    }

    static stripStringsAndComments(code) {
        let out = "";
        let i = 0;

        while (i < code.length) {
            const ch = code[i];
            const next = code[i + 1];

            if (ch === "'" || ch === '"' || ch === "`") {
                const quote = ch;
                out += " ";
                i += 1;
                while (i < code.length) {
                    const c = code[i];
                    out += " ";
                    if (c === "\\") {
                        i += 2;
                        out += " ";
                        continue;
                    }
                    if (c === quote) {
                        i += 1;
                        break;
                    }
                    i += 1;
                }
                continue;
            }

            if (ch === "/" && next === "/") {
                out += "  ";
                i += 2;
                while (i < code.length && code[i] !== "\n") {
                    out += " ";
                    i += 1;
                }
                continue;
            }

            if (ch === "/" && next === "*") {
                out += "  ";
                i += 2;
                while (i + 1 < code.length && !(code[i] === "*" && code[i + 1] === "/")) {
                    out += " ";
                    i += 1;
                }
                if (i + 1 < code.length) {
                    out += "  ";
                    i += 2;
                }
                continue;
            }

            out += ch;
            i += 1;
        }

        return out;
    }

    static scanGlobalDefinitions(code) {
        const stripped = Analysis.stripStringsAndComments(code);
        const defs = new Map();
        let depth = 0;
        let i = 0;

        while (i < stripped.length) {
            const ch = stripped[i];

            if (ch === "{") {
                depth += 1;
                i += 1;
                continue;
            }

            if (ch === "}") {
                depth = Math.max(0, depth - 1);
                i += 1;
                continue;
            }

            if (depth === 0 && Analysis.isIdentifierStart(ch)) {
                const { name, end } = Analysis.readIdentifier(stripped, i);
                if (name === "var" || name === "let" || name === "const") {
                    i = Analysis.parseVarDecl(stripped, end, defs);
                    continue;
                }
                if (name === "function" || name === "class") {
                    i = Analysis.parseNamedDecl(stripped, end, defs);
                    continue;
                }
                i = end;
                continue;
            }

            i += 1;
        }

        return defs;
    }

    static collectIdentifiers(code, globalNames) {
        const stripped = Analysis.stripStringsAndComments(code);
        const ids = new Set();
        let i = 0;

        while (i < stripped.length) {
            const ch = stripped[i];
            if (!Analysis.isIdentifierStart(ch)) {
                i += 1;
                continue;
            }

            const { name, end } = Analysis.readIdentifier(stripped, i);
            if (globalNames.has(name) && !Analysis.isReservedWord(name) && !Analysis.isPropertyAccess(stripped, i)) {
                ids.add(name);
            }
            i = end;
        }

        return ids;
    }

    static findBlockIndexForPos(pos, blocks) {
        if (!blocks.length) return -1;
        if (pos < blocks[0].start) return -1;

        for (let i = 0; i < blocks.length; i += 1) {
            const block = blocks[i];
            if (pos >= block.start && pos <= block.end) {
                return block.index;
            }
            if (pos < block.start) {
                return block.index;
            }
        }

        return blocks[blocks.length - 1].index;
    }

    static collectDependencyClosure(startIndex, depsByBlock) {
        const result = new Set([startIndex]);
        const stack = [startIndex];

        while (stack.length) {
            const index = stack.pop();
            const deps = depsByBlock[index] || [];
            for (const dep of deps) {
                if (result.has(dep)) continue;
                result.add(dep);
                stack.push(dep);
            }
        }

        return result;
    }

    static normalizeBundleKey(value) {
        return String(value || "bundle").replace(/\\/g, "/");
    }

    static escapeForDoubleQuotes(value) {
        return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    }

    static buildSelfContainedHeader(bundleKey, prelude) {
        const safeKey = Analysis.escapeForDoubleQuotes(bundleKey);
        const headerLines = [
            'var __ccGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this;',
            "var __ccBundles = __ccGlobal.__ccScriptBundles || (__ccGlobal.__ccScriptBundles = {});",
            `var __ccBundle = __ccBundles["${safeKey}"] || (__ccBundles["${safeKey}"] = { prelude: false, loaded: {} });`,
            "if (!__ccBundle.prelude) {",
            "__ccBundle.prelude = true;",
            prelude,
            "}",
            "function __ccExec(id, fn) { if (__ccBundle.loaded[id]) return; __ccBundle.loaded[id] = true; fn(); }",
            "",
        ];
        return headerLines.join("\n");
    }

    static isIdentifierStart(ch) {
        return /[A-Za-z_$]/.test(ch);
    }

    static isIdentifierPart(ch) {
        return /[A-Za-z0-9_$]/.test(ch);
    }

    static readIdentifier(code, startIndex) {
        let end = startIndex + 1;
        while (end < code.length && Analysis.isIdentifierPart(code[end])) {
            end += 1;
        }
        return { name: code.slice(startIndex, end), end };
    }

    static parseVarDecl(code, startIndex, defs) {
        let i = startIndex;
        let expectName = true;
        let depthParen = 0;
        let depthBracket = 0;
        let depthBrace = 0;

        while (i < code.length) {
            const ch = code[i];
            if (ch === ";" && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
                return i + 1;
            }
            if (ch === "," && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
                expectName = true;
                i += 1;
                continue;
            }
            if (expectName && Analysis.isIdentifierStart(ch)) {
                const { name, end } = Analysis.readIdentifier(code, i);
                if (!defs.has(name)) {
                    defs.set(name, i);
                }
                expectName = false;
                i = end;
                continue;
            }

            if (ch === "(") depthParen += 1;
            else if (ch === ")") depthParen = Math.max(0, depthParen - 1);
            else if (ch === "[") depthBracket += 1;
            else if (ch === "]") depthBracket = Math.max(0, depthBracket - 1);
            else if (ch === "{") depthBrace += 1;
            else if (ch === "}") depthBrace = Math.max(0, depthBrace - 1);

            i += 1;
        }

        return i;
    }

    static parseNamedDecl(code, startIndex, defs) {
        let i = startIndex;
        while (i < code.length && /\s/.test(code[i])) i += 1;
        if (code[i] === "*") {
            i += 1;
            while (i < code.length && /\s/.test(code[i])) i += 1;
        }
        if (Analysis.isIdentifierStart(code[i])) {
            const { name, end } = Analysis.readIdentifier(code, i);
            if (!defs.has(name)) {
                defs.set(name, i);
            }
            return end;
        }
        return i;
    }

    static isPropertyAccess(code, startIndex) {
        let i = startIndex - 1;
        while (i >= 0 && /\s/.test(code[i])) i -= 1;
        if (i >= 0 && code[i] === ".") return true;
        if (i >= 1 && code[i] === "?" && code[i - 1] === ".") return true;
        return false;
    }

    static isReservedWord(word) {
        if (!Analysis._reservedWords) {
            Analysis._reservedWords = new Set([
                "break",
                "case",
                "catch",
                "class",
                "const",
                "continue",
                "debugger",
                "default",
                "delete",
                "do",
                "else",
                "enum",
                "export",
                "extends",
                "false",
                "finally",
                "for",
                "function",
                "if",
                "import",
                "in",
                "instanceof",
                "new",
                "null",
                "return",
                "super",
                "switch",
                "this",
                "throw",
                "true",
                "try",
                "typeof",
                "var",
                "void",
                "while",
                "with",
                "yield",
                "let",
                "static",
            ]);
        }
        return Analysis._reservedWords.has(word);
    }

    static countOccurrences(haystack, needle) {
        if (!haystack || !needle) return 0;
        let count = 0;
        let index = 0;
        while (true) {
            const next = haystack.indexOf(needle, index);
            if (next === -1) break;
            count += 1;
            index = next + needle.length;
        }
        return count;
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
