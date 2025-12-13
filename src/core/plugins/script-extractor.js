const fs = require("fs");
const path = require("path");

const DirUtils = require("../../utils/dir-utils");
const Analysis = require("../../analysis/analysis");
const { collectBundleConfigPaths } = require("../manifest/bundle-manifest-loader");

const INDEX_JS_REGEX = /^index(\.[^.]+)?\.js$/i;

function resolveBundleEntryScript(bundleRoot) {
    const candidates = fs
        .readdirSync(bundleRoot, { withFileTypes: true })
        .filter((entry) => entry.isFile() && INDEX_JS_REGEX.test(entry.name))
        .map((entry) => entry.name)
        .sort((a, b) => {
            if (a === "index.js") return -1;
            if (b === "index.js") return 1;
            return a.localeCompare(b);
        });

    if (candidates.length === 0) return null;
    return path.join(bundleRoot, candidates[0]);
}

function beautifyScriptsDirectory(rootDir) {
    const beautify = require("js-beautify").js;

    DirUtils.walkSync(
        rootDir,
        (entry) => entry.isFile() && path.extname(entry.name) === ".js",
        (name, fullPath) => {
            const content = fs.readFileSync(fullPath, "utf8");
            const pretty = beautify(content, {
                indent_size: 2,
                space_in_empty_paren: true,
            });
            fs.writeFileSync(fullPath, pretty, "utf8");
        }
    );
}

async function runScriptExtraction(ctx, options = {}) {
    const outputRoot = path.join(ctx.dirOut, "scripts");
    fs.mkdirSync(outputRoot, { recursive: true });

    const needJsPath = options.needJsPath ? path.resolve(options.needJsPath) : path.resolve("needjs.json");
    let needMap = {};
    const needJsStat = await DirUtils.getStat(needJsPath);
    if (needJsStat) {
        needMap = JSON.parse(fs.readFileSync(needJsPath, "utf-8"));
    }

    const entries = Array.isArray(options.entries) ? options.entries : [];
    const entryFiles = entries.length
        ? entries.map((value) => path.resolve(value))
        : collectBundleConfigPaths(ctx.dirIn)
              .map(({ fullPath }) => resolveBundleEntryScript(path.dirname(fullPath)))
              .filter(Boolean);

    let hasResult = false;

    for (const entryFile of entryFiles) {
        const stat = await DirUtils.getStat(entryFile);
        if (!stat) continue;

        ctx.log.log("分析脚本入口:", entryFile);
        const codeText = fs.readFileSync(entryFile, "utf-8");

        const analysis = new Analysis(needMap, {
            outputRoot,
            logger: ctx.log,
        });

        const ok = await analysis.splitCompile(codeText);
        hasResult = hasResult || ok;
    }

    if (hasResult && options.beautify !== false) {
        beautifyScriptsDirectory(outputRoot);
    }

    return { hasResult, outputRoot };
}

module.exports = {
    runScriptExtraction,
};

