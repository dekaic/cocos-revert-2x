// 依赖模块
const fs = require("fs");
const path = require("path");
const imageSize = require("image-size");
const { v4: uuidv4 } = require("uuid");
const DirUtils = require("./utils/dir-utils");
const RevertMeta = require("./revert-meta");
const RevertPrefab = require("./revert-prefab");

const { GAnalys, GConfig, GMapSubs } = require("./revert-state");
const helpers = require("./utils/helpers")
const { SplitAutoAtlas } = require("./auto-atlas");
const { parseBundleConfig, analysFiles } = require("./bundle-config");
const { analysBitmapAndPlist, analysPathsMaterialAndEffect, analysPacksPlist, analysAnimFrameAtlas, analystextureSetter } = require("./analyzer");
const {
    copyFiles,
    newJsonFiles,
    newDragonJsonFiles,
    newTextFiles,
    newEffectFiles,
    newMaterialFiles,
    newTTFFiles,
    newAnimsFiles,
    aniAnimsObjs,
    aniAnimsArray,
    newFontsFiles,
    newPlistFiles,
} = require("./generators");

const dirPath = path.resolve(".");

// 简单字符串 format 扩展
String.prototype.format = function () {
    const args = arguments;
    const src = this.slice();

    return (
        !!src &&
        src.replace(/\{(\d+)\}/g, (match, index) => {
            return args[index];
        })
    );
};

// 主入口对象
const revert = {
    // 输入、输出目录
    dirIn: `${dirPath}/input/assets`,
    dirOut: `${dirPath}/output/`,

    // 工具与子流程
    ...helpers,
    SplitAutoAtlas,
    parseBundleConfig,
    analysFiles,
    analysBitmapAndPlist,
    analysPathsMaterialAndEffect,
    analysPacksPlist,
    analysAnimFrameAtlas,
    analystextureSetter,
    copyFiles,
    newJsonFiles,
    newDragonJsonFiles,
    newTextFiles,
    newEffectFiles,
    newMaterialFiles,
    newTTFFiles,
    newAnimsFiles,
    aniAnimsObjs,
    aniAnimsArray,
    newFontsFiles,
    newPlistFiles,

    // 入口：整体流程
    async start(done) {
        console.log("Revert start with dirIn:", this.dirIn, " dirOut:", this.dirOut);

        // 清理输出目录
        DirUtils.clearDir(this.dirOut);

        const stat = await DirUtils.getStat(this.dirIn);
        if (!stat || !stat.isDirectory()) {
            console.log("Input path is not a directory:", this.dirIn);
            process.exit(0);
        }

        const bundleConfigs = [];

        // 先扫一遍，收集所有 config.json
        DirUtils.walkSync(
            this.dirIn,
            (entry) => entry.name === "config.json",
            (name, fullPath) => {
                bundleConfigs.push(fullPath);
            }
        );

        // 第二遍：扫描所有资源文件，填充 GAnalys / GConfig 等
        DirUtils.walkSync(
            this.dirIn,
            () => true,
            (name, fullPath, bundleName) => {
                console.log("Scanning file:", fullPath);

                const extname = path.extname(name).toLowerCase();
                if (name === "config.json" || name === "index.js") return;

                const filename = path.basename(name, extname);
                const uuid = filename.split(".")[0];
                const content = fs.readFileSync(fullPath);
                const isImage = extname === ".png" || extname === ".jpg";
                const isJson = extname === ".json";

                const item = {
                    filein: fullPath,
                    ext: extname,
                    plists: null,
                    bitmap: null,
                    bundle: bundleName,
                    sbines: null,
                    content,
                };

                // 同名 json / bin / png 等归并到 GAnalys / GConfig
                if (GAnalys[uuid]) {
                    if (GAnalys[uuid].ext === ".json") {
                        GConfig[uuid] = GAnalys[uuid];
                        GAnalys[uuid] = item;
                    } else {
                        GConfig[uuid] = item;
                    }

                    // sbines 临时挂在 config 上，这里再转移回来
                    if (GConfig[uuid].sbines) {
                        GAnalys[uuid].sbines = GConfig[uuid].sbines;
                        GConfig[uuid].sbines = null;
                    }
                } else {
                    GAnalys[uuid] = item;
                }

                // 记录图片尺寸
                if (isImage) {
                    try {
                        const sizeInfo = imageSize(content);
                        item.width = sizeInfo.width;
                        item.height = sizeInfo.height;
                    } catch (e) {
                        // ignore
                    }
                } else if (isJson) {
                    // 检测 sp.SkeletonData
                    try {
                        if (content.includes("sp.SkeletonData")) {
                            console.log(`${name} is a sp.SkeletonData`);
                            item.sbines = { datas: JSON.parse(content) };
                        }
                    } catch (e) {
                        console.log("GAnalys err:", e);
                    }
                }
            }
        );

        // 解析 bundle config（基础路径/类型/uuid 映射）
        for (const file of bundleConfigs) {
            const jsonStr = fs.readFileSync(file, "utf-8");
            const parts = file.replace(/\\/g, "/").split("/");
            this.parseBundleConfig(parts[parts.length - 2], JSON.parse(jsonStr));
        }

        // 为每个 bundle 生成 folder meta（主 bundle 外的子 bundle）
        for (const file of bundleConfigs) {
            const parts = file.replace(/\\/g, "/").split("/");
            const bundleName = parts[parts.length - 2];

            if (bundleName !== "main" && bundleName !== "third" && bundleName !== "resources" && bundleName !== "internal") {
                const folderMeta = {
                    ver: "1.1.3",
                    uuid: uuidv4(),
                    importer: "folder",
                    isBundle: true,
                    bundleName: "",
                    priority: GMapSubs[bundleName],
                    compressionType: {},
                    optimizeHotUpdate: {},
                    inlineSpriteFrames: {},
                    isRemoteBundle: {},
                    subMetas: {},
                };

                const metaStr = JSON.stringify(folderMeta, null, 2);
                fs.writeFileSync(`${this.dirOut}${bundleName}.meta`, metaStr, { undefined: void 0 }, () => {});
            }
        }

        // 交给 protobuf 解析部分（testpb）
        for (const file of bundleConfigs) {
            const jsonStr = fs.readFileSync(file, "utf-8");
            const parts = file.replace(/\\/g, "/").split("/");
            await RevertPrefab.parseBundleConfig(this, parts[parts.length - 2], JSON.parse(jsonStr));
        }

        // 自动图集拆分、拷贝文件、生成各种资源
        await this.SplitAutoAtlas();
        await this.copyFiles();
        await this.newPlistFiles();
        await this.newFontsFiles();
        await this.newAnimsFiles();
        await this.newTTFFiles();
        await this.newJsonFiles();
        await this.newDragonJsonFiles();
        await this.newTextFiles();
        await this.newMaterialFiles();
        await RevertMeta.newMetaFiles(this, GAnalys);

        if (done) done();
    },
};

module.exports = revert;
