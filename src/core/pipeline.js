const fs = require("fs");
const path = require("path");
const imageSize = require("image-size");
const { v4: uuidv4 } = require("uuid");

const DirUtils = require("../utils/dir-utils");
const RevertMeta = require("../revert-meta");
const RevertPrefab = require("../revert-prefab");
const { SplitAutoAtlas } = require("../auto-atlas");
const { parseBundleConfig } = require("../bundle-config");
const {
    copyFiles,
    newJsonFiles,
    newDragonJsonFiles,
    newTextFiles,
    newMaterialFiles,
    newTTFFiles,
    newAnimsFiles,
    newFontsFiles,
    newPlistFiles,
} = require("../generators");

const { collectBundleConfigPaths } = require("./manifest/bundle-manifest-loader");
const { normalizeManifest } = require("./manifest/normalize-manifest");
const { getAstcSize } = require("../utils/astc-utils");

const CONFIG_JSON_REGEX = /^config(\.[^.]+)?\.json$/i;
const INDEX_JS_REGEX = /^index(\.[^.]+)?\.js$/i;

function scanSourceFiles(ctx) {
    const { assets, configs } = ctx.state;
    const { isPicture } = ctx.helpers;

    DirUtils.walkSync(
        ctx.dirIn,
        () => true,
        (name, fullPath, bundleName) => {
            ctx.log.log("Scanning file:", fullPath);

            const extname = path.extname(name).toLowerCase();
            if (CONFIG_JSON_REGEX.test(name) || INDEX_JS_REGEX.test(name)) return;

            const filename = path.basename(name, extname);
            const uuid = filename.split(".")[0];
            const content = fs.readFileSync(fullPath);

            const item = {
                filein: fullPath,
                ext: extname,
                plists: null,
                bitmap: null,
                bundle: bundleName,
                sbines: null,
                content,
            };

            if (assets[uuid]) {
                if (assets[uuid].ext === ".json") {
                    configs[uuid] = assets[uuid];
                    assets[uuid] = item;
                } else {
                    configs[uuid] = item;
                }

                if (configs[uuid].sbines) {
                    assets[uuid].sbines = configs[uuid].sbines;
                    configs[uuid].sbines = null;
                }
            } else {
                assets[uuid] = item;
            }

            if (isPicture(extname)) {
                try {
                    if (extname === ".astc") {
                        const sizeInfo = getAstcSize(content);
                        if (sizeInfo) {
                            item.width = sizeInfo.width;
                            item.height = sizeInfo.height;
                        }
                    } else {
                        const sizeInfo = imageSize(content);
                        item.width = sizeInfo.width;
                        item.height = sizeInfo.height;
                    }
                } catch {
                    // ignore
                }
                return;
            }

            if (extname === ".json") {
                try {
                    if (content.includes("sp.SkeletonData")) {
                        ctx.log.log(`${name} is a sp.SkeletonData`);
                        item.sbines = { datas: JSON.parse(content) };
                    }
                } catch (err) {
                    ctx.log.log("scanSourceFiles json err:", err);
                }
            }
        }
    );
}

function writeBundleFolderMeta(ctx, bundleName) {
    const { bundlePriority } = ctx.state;

    const folderMeta = {
        ver: "1.1.3",
        uuid: uuidv4(),
        importer: "folder",
        isBundle: true,
        bundleName: "",
        priority: bundlePriority[bundleName],
        compressionType: {},
        optimizeHotUpdate: {},
        inlineSpriteFrames: {},
        isRemoteBundle: {},
        subMetas: {},
    };

    const metaStr = JSON.stringify(folderMeta, null, 2);
    fs.writeFileSync(`${ctx.dirOut}${bundleName}.meta`, metaStr, { undefined: void 0 }, () => {});
}

async function runRevert(ctx) {
    ctx.log.log("Revert start with dirIn:", ctx.dirIn, " dirOut:", ctx.dirOut);

    if (!fs.existsSync(ctx.dirOut)) {
        fs.mkdirSync(ctx.dirOut, { recursive: true });
    } else {
        DirUtils.clearDir(ctx.dirOut);
    }

    const stat = await DirUtils.getStat(ctx.dirIn);
    if (!stat || !stat.isDirectory()) {
        ctx.log.log("Input path is not a directory:", ctx.dirIn);
        process.exit(0);
    }

    const bundleConfigs = collectBundleConfigPaths(ctx.dirIn);

    scanSourceFiles(ctx);

    // manifest 规范化（供后续定位/诊断/扩展使用）
    for (const { bundleName, fullPath } of bundleConfigs) {
        const rawCfgJson = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        ctx.state.bundleNormalizedManifest[bundleName] = normalizeManifest(rawCfgJson);
    }

    // 解析 bundle config（会修改 paths/uuids 结构，保持与旧实现一致）
    for (const { bundleName, fullPath } of bundleConfigs) {
        const cfgJson = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        parseBundleConfig(ctx, bundleName, cfgJson);
    }

    // bundle folder meta（主 bundle 除外）
    for (const { bundleName } of bundleConfigs) {
        if (bundleName === "main" || bundleName === "third" || bundleName === "resources" || bundleName === "internal") continue;
        writeBundleFolderMeta(ctx, bundleName);
    }

    // Scene/Prefab 还原
    for (const { bundleName, fullPath } of bundleConfigs) {
        const cfgJson = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        await RevertPrefab.parseBundleConfig(ctx, bundleName, cfgJson);
    }

    // 自动图集拆分、拷贝文件、生成各种资源
    await SplitAutoAtlas(ctx);
    await copyFiles(ctx);
    await newPlistFiles(ctx);
    await newFontsFiles(ctx);
    await newAnimsFiles(ctx);
    await newTTFFiles(ctx);
    await newJsonFiles(ctx);
    await newDragonJsonFiles(ctx);
    await newTextFiles(ctx);
    await newMaterialFiles(ctx);
    await RevertMeta.newMetaFiles(ctx);
}

module.exports = {
    runRevert,
};
