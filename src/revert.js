// 依赖模块
let fs = require("fs"),
    path = require("path"),
    { v4: uuidv4, NIL } = require("uuid"),
    UuidUtils = require("./uuidUtils"),
    dir = require("./dir"),
    meta = require("./revert_meta"),
    sharp = require("sharp"),
    HelloWorld = require("./testpb"),
    { unpackJSONs, deserialize } = require("./libs/parseclass"),
    dirPath = path.resolve("."),
    // 资源类型 => 扩展名映射，同时顺便初始化一批全局分析用对象
    EXT_MAP =
        ((GAnalys = {}), // 所有资源分析结果（主表）
        (GConfig = {}), // config / json 等中间表
        (GAnimMp = {}), // 动画名 -> 动画对象映射
        (GMapSubs = {}), // bundle 依赖/优先级统计
        (GMapPlist = {}), // frame uuid -> plist uuid
        (GMapFrame = {}), // 预留
        (GUnkowns = {}), // 纹理未绑定时的临时记录
        (GCfgJson = {}), // bundle config 原始 json
        (GFrameNames = {}), // uuid -> spriteFrame 路径
        {
            "cc.TextAsset": ".txt",
            "cc.JsonAsset": ".json",
            "cc.Texture2D": ".png",
            "cc.Prefab": ".prefab",
            "cc.AudioClip": ".mp3",
            "sp.SkeletonData": ".json",
            "cc.Asset": ".unknown",
            "cc.ParticleAsset": ".plist",
            "cc.AnimationClip": ".anim",
            "cc.TTFFont": ".ttf",
            "cc.BufferAsset": ".bin",
            "dragonBones.DragonBonesAsset": ".json",
            "dragonBones.DragonBonesAtlasAsset": ".json",
        });

// 简单字符串 format 扩展
String.prototype.format = function () {
    let args = arguments,
        src = this.slice();
    return (
        !!src &&
        src.replace(/\{(\d+)\}/g, function (match, index) {
            return args[index];
        })
    );
};

// 主入口对象
var revert = {
    // 输入、输出目录
    dirIn: dirPath + "/input/assets",
    dirOut: dirPath + "/output/",

    // 入口：整体流程
    async start(done) {
        console.log("revert dirIn:", revert.dirIn);

        // 简单时间锁（到期退出）
        var deadLine = new Date("2026-05-08T00:00:00Z").getTime();
        Date.now() >= deadLine && process.exit(1);

        let bundleConfigs = [];

        // 检查输入目录
        (await dir.getStat(this.dirIn)) || (console.log("none dirIn path:", revert.dirIn), process.exit(0));

        // 先扫一遍，收集所有 config.json
        this.walkSync(
            this.dirIn,
            (entry) => "config.json" === entry.name,
            (name, fullPath) => {
                bundleConfigs.push(fullPath);
            }
        );

        // 第二遍：扫描所有资源文件，填充 GAnalys / GConfig 等
        this.walkSync(
            this.dirIn,
            () => !0,
            (name, fullPath, bundleName) => {
                var parts = name.split(".");
                if (parts.length === 2 && name !== "config.json" && name !== "index.js") {
                    // 构造分析项
                    item = {
                        filein: fullPath,
                        ext: "." + parts[1],
                        plists: null,
                        bitmap: null,
                        bundle: bundleName,
                        sbines: null,
                        content: null,
                    };

                    let ext = "." + parts[1];
                    let content = fs.readFileSync(fullPath);
                    item.content = content;

                    // 同名 json / bin / png 等归并到 GAnalys / GConfig
                    if (GAnalys[parts[0]]) {
                        if (GAnalys[parts[0]].ext === ".json") {
                            GConfig[parts[0]] = GAnalys[parts[0]];
                            GAnalys[parts[0]] = item;
                        } else {
                            GConfig[parts[0]] = item;
                        }

                        // sbines 临时挂在 config 上，这里再转移回来
                        if (GConfig[parts[0]].sbines) {
                            GAnalys[parts[0]].sbines = GConfig[parts[0]].sbines;
                            GConfig[parts[0]].sbines = null;
                        }
                    } else {
                        GAnalys[parts[0]] = item;
                    }

                    // 记录图片尺寸
                    if (ext === ".png" || ext === ".jpg") {
                        try {
                            var sizeInfo = require("image-size")(content);
                            item.width = sizeInfo.width;
                            item.height = sizeInfo.height;
                        } catch (e) {
                            // ignore
                        }
                    } else if (ext === ".json") {
                        // 检测 sp.SkeletonData
                        try {
                            if (name !== "config.json" && content.includes("sp.SkeletonData")) {
                                console.log(name + " is a sp.SkeletonData");
                                item.sbines = { datas: JSON.parse(content) };
                            }
                        } catch (e) {
                            console.log("GAnalys err:", e);
                        }
                    }
                }
            }
        );

        // 解析 bundle config（基础路径/类型/uuid 映射）
        for (let i = 0; i < bundleConfigs.length; i++) {
            let file = bundleConfigs[i];
            let jsonStr = fs.readFileSync(file, "utf-8");
            let parts = file.replace(/\\/g, "/").split("/");
            this.parseBundleConfig(parts[parts.length - 2], JSON.parse(jsonStr));
        }

        // 为每个 bundle 生成 folder meta（主 bundle 外的子 bundle）
        for (let i = 0; i < bundleConfigs.length; i++) {
            let file = bundleConfigs[i];
            var parts = file.replace(/\\/g, "/").split("/");
            var bundleName = parts[parts.length - 2];

            if (bundleName !== "main" && bundleName !== "third" && bundleName !== "resources" && bundleName !== "internal") {
                let folderMeta = {
                    ver: "1.1.3",
                    uuid: uuidv4(),
                    importer: "folder",
                    isBundle: !0,
                    bundleName: "",
                    priority: GMapSubs[bundleName],
                    compressionType: {},
                    optimizeHotUpdate: {},
                    inlineSpriteFrames: {},
                    isRemoteBundle: {},
                    subMetas: {},
                };

                let metaStr = JSON.stringify(folderMeta, null, 2);
                fs.writeFileSync(this.dirOut + bundleName + ".meta", metaStr, { undefined: void 0 }, () => {});
            }
        }

        // 交给 protobuf 解析部分（testpb）
        for (let i = 0; i < bundleConfigs.length; i++) {
            let file = bundleConfigs[i];
            let jsonStr = fs.readFileSync(file, "utf-8");
            let parts = file.replace(/\\/g, "/").split("/");
            await HelloWorld.parseBundleConfig(this, parts[parts.length - 2], JSON.parse(jsonStr));
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
        await meta.newMetaFiles(this, GAnalys);

        done && done();
    },

    // 判定是否图片
    isPicture(ext) {
        return ext === ".png" || ext === ".jpg" || ext === ".jpeg";
    },

    // 拆分自动图集，生成单独贴图
    async SplitAutoAtlas() {
        for (var key in GAnalys) {
            var atlas = GAnalys[key];
            if (atlas.bundle && atlas.frames && key.length < 22) {
                var bundleCfg,
                    uuid,
                    frameName,
                    frameData,
                    { paths, uuids } = GCfgJson[atlas.bundle],
                    bundleOutDir = this.dirOut + atlas.bundle + "/";

                let basePath = key + "/";

                // 确定帧所在的基本路径
                for ([frameName, frameData] of Object.entries(atlas.frames)) {
                    var frameUuid = frameData.uuid || frameData.unkown_uuid;
                    var idx = uuids.indexOf(frameUuid);
                    if (idx >= 0 && paths[idx]) {
                        var slashIdx = paths[idx][0].lastIndexOf("/");
                        if (slashIdx !== -1) {
                            basePath = paths[idx][0].substring(0, slashIdx + 1);
                            break;
                        }
                    }
                }

                // 遍历帧，裁切出独立图片
                for ([frameName, frameData] of Object.entries(atlas.frames)) {
                    var frameUuid = frameData.uuid || frameData.unkown_uuid;
                    var index = uuids.indexOf(frameUuid);
                    let targetPath = basePath + frameName;

                    if (index >= 0 && paths[index] && paths[index][0]) {
                        targetPath = paths[index][0];
                    }

                    targetPath = this.correctPath(bundleOutDir + targetPath + ".png");

                    // 如果该 uuid 本身已有 GFrameNames 映射，则优先使用
                    if (GFrameNames[frameUuid]) {
                        targetPath = this.correctPath(GFrameNames[frameUuid] + ".png");
                    }

                    var bitmap = null;
                    if (GAnalys[frameUuid] && GAnalys[frameUuid].bitmap) {
                        GAnalys[frameUuid].bitmap = atlas.bitmap;
                        bitmap = GAnalys[frameUuid].bitmap;
                    }

                    console.log(`start ${key} processing ` + frameUuid);

                    var newUuid = uuidv4();
                    GAnalys[newUuid] = GAnalys[newUuid] || { bundle: atlas.bundle, frames: {} };
                    GAnalys[newUuid].ext = ".png";
                    GAnalys[newUuid].filein = null;
                    GAnalys[newUuid].fileout = targetPath;
                    GAnalys[newUuid].frames = GAnalys[newUuid].frames || {};
                    GAnalys[newUuid].frames[frameName] = frameData;
                    GAnalys[newUuid].bitmap = bitmap;

                    var outPath = GAnalys[newUuid].fileout;
                    var outDirArr = outPath.split("/");
                    outDirArr.pop();
                    await dir.dirExists(outDirArr.join("/"));

                    var rect = frameData.rect;
                    var x = rect[0];
                    var y = rect[1];
                    let w = rect[2];
                    let h = rect[3];

                    GAnalys[newUuid].width = w;
                    GAnalys[newUuid].height = h;

                    if (frameData.rotated) {
                        [w, h] = [h, w];
                    }

                    // 从大图裁切
                    let cropSharp = sharp(atlas.filein).extract({
                        left: x,
                        top: y,
                        width: w,
                        height: h,
                    });

                    if (frameData.rotated) {
                        cropSharp = cropSharp.rotate(-90);
                    }

                    // 还原到 originalSize 的画布上
                    var original = frameData.originalSize;
                    var origW = parseInt(original[0], 10);
                    var origH = parseInt(original[1], 10);
                    var rawRect = rect;
                    var offset = frameData.offset;

                    frameData.rect[0] = offset[0] + (origW - rawRect[2]) / 2;
                    frameData.rect[1] = (origH - rawRect[3]) / 2 - offset[1];
                    frameData.rotated = !1;

                    await sharp({
                        create: {
                            width: origW,
                            height: origH,
                            channels: 4,
                            background: { r: 0, g: 0, b: 0, alpha: 0 },
                        },
                    })
                        .composite([
                            {
                                input: await cropSharp.toBuffer(),
                                left: Math.floor(frameData.rect[0]),
                                top: Math.floor(frameData.rect[1]),
                            },
                        ])
                        .toFile(outPath);

                    console.log("Successfully processed " + outPath);

                    delete atlas.frames[frameName];
                    Object.keys(atlas.frames).length <= 0 && (atlas.frames = null);
                }
            }
        }
    },

    // 深度优先遍历目录
    walkSync(rootDir, fileFilter, onFile, bundleName) {
        let self = this;
        fs.readdirSync(rootDir, { withFileTypes: !0 }).forEach((entry) => {
            var subBundle,
                fullPath = path.join(rootDir, entry.name);
            if (entry.isFile()) {
                fileFilter(entry) && onFile(entry.name, fullPath, bundleName);
            } else if (entry.isDirectory()) {
                subBundle = bundleName || entry.name;
                self.walkSync(fullPath, fileFilter, onFile, subBundle);
            }
        });
    },

    // 修正路径（过滤非法字符）
    correctPath(p) {
        let str = p.replace(/db:\/[^\/]+\//, "");
        let last = str.lastIndexOf("/");
        let dir = str.substring(0, last);
        let file = str.substring(last + 1);
        dir = dir.replace(/\\/g, "/").replace(/[^a-zA-Z0-9._:/-]/g, "");
        return dir + "/" + file;
    },

    // 解析 bundle 的 config.json
    parseBundleConfig(bundleName, cfgJson) {
        // 统计 bundle 依赖次数
        GMapSubs[bundleName] = GMapSubs[bundleName] || 0;
        GMapSubs[bundleName] += 1;

        fs.existsSync(this.dirOut) || fs.mkdirSync(this.dirOut);

        var bundleOutDir = this.dirOut + bundleName + "/";
        fs.existsSync(bundleOutDir) || fs.mkdirSync(bundleOutDir);

        if (cfgJson.deps) {
            for (let i = 0; i < cfgJson.deps.length; i++) {
                var depName = cfgJson.deps[i];
                GMapSubs[depName] = GMapSubs[depName] || 0;
                GMapSubs[depName] += 1;
            }
        }

        var { paths, types, uuids } = cfgJson;

        // 解压短 uuid
        for (let i = 0; i < uuids.length; i++) {
            var u = uuids[i];
            if (u.length >= 10) {
                uuids[i] = UuidUtils.decompressUuid(u);
            }
            console.log(bundleName + ": " + i + " = " + u + " : " + uuids[i]);
        }

        GCfgJson[bundleName] = cfgJson;

        var usedMap = {};

        // 遍历所有路径，绑定 ttype / fileout
        for (var idx in paths) {
            var mapping,
                [pathDir, typeIndex] = paths[idx],
                uuid = uuids[idx];

            paths[idx][(usedMap[uuid] = 1)] = types[typeIndex];
            console.log(uuid + " ttype = ", types[typeIndex]);

            if (GAnalys[uuid]) {
                GAnalys[uuid].ttype = types[typeIndex];

                if (EXT_MAP[types[typeIndex]]) {
                    if (GAnalys[uuid].ext === ".atlas") {
                        GAnalys[uuid].fileout = this.correctPath(bundleOutDir + pathDir + ".atlas");
                    } else if (GAnalys[uuid].ext === ".bin" && types[typeIndex] !== "cc.BufferAsset") {
                        GAnalys[uuid].fileout = this.correctPath(bundleOutDir + pathDir + ".skel");
                    } else if (types[typeIndex] === "cc.Asset") {
                        GAnalys[uuid].fileout = this.correctPath(bundleOutDir + pathDir + GAnalys[uuid].ext);
                    } else if (GAnalys[uuid].ext === ".jpg") {
                        GAnalys[uuid].fileout = this.correctPath(bundleOutDir + pathDir + ".jpg");
                    } else {
                        GAnalys[uuid].fileout = this.correctPath(bundleOutDir + pathDir + EXT_MAP[types[typeIndex]]);
                    }
                } else {
                    // 非 EXT_MAP 中的类型，部分需要特殊处理
                    GAnalys[uuid].pathdir = pathDir;
                    if (types[typeIndex] === "cc.SpriteFrame") {
                        GFrameNames[uuid] = bundleOutDir + pathDir;
                    }
                }
            } else if (types[typeIndex] === "cc.AnimationClip") {
                // 只有动画 clip 的 uuid，没有实际文件
                GAnalys[uuid] = GAnalys[uuid] || GConfig[uuid] || {};
                GAnalys[uuid].ttype = types[typeIndex];
                GAnalys[uuid].ext = ".anim";
                GAnalys[uuid].fileout = this.correctPath(bundleOutDir + pathDir + EXT_MAP[types[typeIndex]]);

                let pathParts = pathDir.split("/");
                if (pathParts.length > 0) {
                    GAnimMp[pathParts[pathParts.length - 1]] = GAnalys[uuid];
                    console.log(uuid + " is a cc.Anim");
                }
            } else if (types[typeIndex] === "cc.SpriteFrame") {
                GFrameNames[uuid] = bundleOutDir + pathDir;
            } else if (types[typeIndex] === "cc.JsonAsset") {
                if (GConfig[uuid]) {
                    GConfig[uuid].ttype = types[typeIndex];
                    GConfig[uuid].fileout = this.correctPath(bundleOutDir + pathDir + EXT_MAP[types[typeIndex]]);
                } else if (GAnalys[uuid]) {
                    GAnalys[uuid].ttype = types[typeIndex];
                    GAnalys[uuid].fileout = this.correctPath(bundleOutDir + pathDir + EXT_MAP[types[typeIndex]]);
                } else {
                    GConfig[uuid] = GConfig[uuid] || { bundle: bundleName };
                    GConfig[uuid].ttype = types[typeIndex];
                    GConfig[uuid].fileout = this.correctPath(bundleOutDir + pathDir + EXT_MAP[types[typeIndex]]);
                }
            } else if (types[typeIndex] === "dragonBones.DragonBonesAsset" || types[typeIndex] === "dragonBones.DragonBonesAtlasAsset") {
                GAnalys[uuid] = GAnalys[uuid] || { bundle: bundleName };
                GAnalys[uuid].ttype = types[typeIndex];
                GAnalys[uuid].fileout = this.correctPath(bundleOutDir + pathDir + EXT_MAP[types[typeIndex]]);
            } else {
                GFrameNames[uuid] = bundleOutDir + pathDir;
            }
        }

        // 处理未挂在 paths / packs 上的资源
        for (var id in GAnalys) {
            var item = GAnalys[id];
            if (item.bundle == bundleName && !(usedMap[id] || (cfgJson.packs && cfgJson.packs[id]))) {
                // 有些 json 中包含 cc.AnimationClip 内容
                if (item.content && item.content.includes("cc.AnimationClip")) {
                    console.log(id, " has igore cc.AnimationClip");
                    item.ttype = "cc.AnimationClip";
                }

                // 粒子 plist，给默认输出位置
                if (item.ext === ".plist" && !item.fileout) {
                    item.ttype = "cc.ParticleAsset";
                    let pname = id;

                    if (GConfig[id]) {
                        try {
                            var cfg = JSON.parse(GConfig[id].content);
                            pname = cfg[5][0][1];
                        } catch (a) {
                            continue;
                        }
                    }

                    item.fileout = this.correctPath(bundleOutDir + "/unkown_particle/" + pname + ".plist");
                }

                // 没有类型信息的 mp3，默认当 AudioClip
                if (item.ext === ".mp3") {
                    item.ttype = "cc.AudioClip";
                    item.fileout = this.correctPath(bundleOutDir + "/unkown_video/" + id + ".mp3");
                }
            }
        }

        this.analysFiles(bundleName, cfgJson);
    },

    // 分析一个 bundle 内的所有文件
    analysFiles(bundleName, cfgJson) {
        var packs = cfgJson.packs || {},
            paths = cfgJson.paths || {},
            uuids = cfgJson.uuids || [];

        this.analysBitmapAndPlist(bundleName, packs, paths, uuids);
        this.analystextureSetter(bundleName, packs, paths, uuids);
        this.analysAnimFrameAtlas(bundleName, packs, paths, uuids);
        this.analysPacksPlist(bundleName, packs, paths, uuids);
        this.analysPathsMaterialAndEffect(bundleName, packs, paths, uuids);
    },

    // 分析位图字体和 plist / material / effect / anim 等（来自 packs）
    analysBitmapAndPlist(bundleName, packs, paths, uuids) {
        for (var [packUuid, packIndices] of Object.entries(packs)) {
            try {
                var cfg = GConfig[packUuid] || GAnalys[packUuid];
                if (!cfg) continue;

                var isBitmapFont = cfg.content.includes("fontDefDictionary");
                var effectUuids = [];
                var jsonArray = JSON.parse(cfg.content);
                var arr5 = jsonArray[5];

                // 预扫描
                for (let i = 0; i < arr5.length; i++) {
                    arr5[i];
                    jsonArray[1][i];
                }

                var itemArr = jsonArray[5];

                // BitmapFont 提取
                if (isBitmapFont) {
                    for (let i = 0; i < itemArr.length; i++) {
                        var item = itemArr[i];
                        if (item.length >= 6) {
                            try {
                                if (JSON.stringify(item, null).includes("fontDefDictionary")) {
                                    var fontIdx = item[5][0];
                                    var pngUuid = UuidUtils.decompressUuid(jsonArray[1][fontIdx]);
                                    var fontDef = item[0][0];
                                    var fntUuid = uuids[packIndices[i]];

                                    GAnalys[pngUuid] = GAnalys[pngUuid] || {
                                        bundle: bundleName,
                                    };
                                    GAnalys[pngUuid].bitmap = {
                                        name: fontDef[1],
                                        info: fontDef[3],
                                        fntuuid: fntUuid,
                                    };

                                    console.log(pngUuid + " has BitmapFont info");
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                }

                // 遍历 pack 内每项
                for (let i = 0; i < itemArr.length; i++) {
                    let entry = itemArr[i];
                    let effectNode = null;

                    try {
                        // 展开 uuid 索引
                        for (let k = 0; k < entry[5].length; k++) {
                            entry[5][k] = UuidUtils.decompressUuid(jsonArray[1][entry[5][k]]);
                        }

                        effectNode = jsonArray[3][jsonArray[4][[entry[0][0][0]]][0]];
                    } catch (e) {
                        // ignore
                    }

                    if (entry.length >= 6) {
                        try {
                            var frameInfo = entry[0][0];
                            var pngUuid = entry[5][0];

                            // SpriteFrame 信息
                            if (this.isAFrame(frameInfo) && this.isPicture(GAnalys[pngUuid].ext)) {
                                console.log(pngUuid + " has spriteframe info");
                                frameInfo.name &&
                                    frameInfo.name !== "" &&
                                    ((GAnalys[pngUuid].frames = GAnalys[pngUuid].frames || {}),
                                    (frameInfo.uuid = uuids[packIndices[i]]),
                                    GAnalys[pngUuid].frames[frameInfo.name] && (frameInfo.name = frameInfo.name + "_" + frameInfo.uuid),
                                    (GAnalys[pngUuid].frames[frameInfo.name] = frameInfo),
                                    isBitmapFont &&
                                        GAnalys[frameInfo.uuid] &&
                                        GAnalys[frameInfo.uuid].bitmap &&
                                        (GAnalys[pngUuid].bitmap = GAnalys[frameInfo.uuid].bitmap));
                            } else {
                                // 非 spriteframe 的情况，根据 effectNode 类型分支
                                if (Array.isArray(effectNode) && effectNode[0]) {
                                    switch (effectNode[0]) {
                                        case "cc.Material":
                                            if (bundleName !== "internal") {
                                                var texUuid = entry[5][0];
                                                GAnalys[texUuid] = GAnalys[texUuid] || {
                                                    bundle: bundleName,
                                                };
                                                GAnalys[texUuid].material = GAnalys[texUuid].material || {};
                                                GAnalys[texUuid].material.mtls = GAnalys[texUuid].material.mtls || [];
                                                GAnalys[texUuid].material.mtls[GAnalys[texUuid].material.mtls.length] = {
                                                    mtl: entry[0][0],
                                                    mtluuid: uuids[packIndices[i]],
                                                };
                                            }
                                            break;
                                        case "cc.EffectAsset":
                                            if (bundleName !== "internal") {
                                                var effectStr = JSON.stringify(entry[0], null);
                                                if (effectStr.includes("glsl3") && effectStr.includes("glsl1")) {
                                                    var propsArr = [];
                                                    for (let k = 1; k < jsonArray[4][[entry[0][0][0]]].length; k++) {
                                                        effectNode[1][jsonArray[4][[entry[0][0][0]]][k]] &&
                                                            (propsArr[propsArr.length] = effectNode[1][jsonArray[4][[entry[0][0][0]]][k]]);
                                                    }
                                                    var effUuid = uuids[packIndices[i]];
                                                    GAnalys[effUuid] = GAnalys[effUuid] || {
                                                        bundle: bundleName,
                                                    };
                                                    GAnalys[effUuid].material = GAnalys[effUuid].material || {};
                                                    GAnalys[effUuid].material.effect = entry[0][0];
                                                    GAnalys[effUuid].material.name = entry[0][0][1];
                                                    GAnalys[effUuid].material.props = propsArr;
                                                    effectUuids[effectUuids.length] = effUuid;
                                                }
                                            }
                                            break;
                                        case "cc.AnimationClip":
                                            var animInfo = entry[0][0];
                                            if (typeof animInfo[1] === "string" && animInfo.length >= 4) {
                                                var props = [];
                                                for (let k = 1; k < jsonArray[4][[entry[0][0][0]]].length; k++) {
                                                    effectNode[1][jsonArray[4][[entry[0][0][0]]][k]] &&
                                                        (props[props.length] = effectNode[1][jsonArray[4][[entry[0][0][0]]][k]]);
                                                }

                                                if (GAnimMp[animInfo[1]]) {
                                                    GAnimMp[animInfo[1]].spanim = animInfo;
                                                    GAnimMp[animInfo[1]].spanim_frames = entry[5];
                                                    GAnimMp[animInfo[1]].props = props;
                                                } else {
                                                    var animUuid = uuids[packIndices[i]];
                                                    GAnalys[animUuid] = GAnalys[animUuid] || {
                                                        bundle: bundleName,
                                                    };
                                                    GAnalys[animUuid].spanim = animInfo;
                                                    GAnalys[animUuid].spanim_frames = entry[5];
                                                    GAnalys[animUuid].props = props;
                                                }
                                            }
                                            break;
                                        case "cc.BitmapFont":
                                            var texUuid2 = entry[5][0];
                                            var fontInfo = entry[0][0];
                                            var fontUuid = uuids[packIndices[i]];
                                            GAnalys[texUuid2] = GAnalys[texUuid2] || {
                                                bundle: bundleName,
                                            };
                                            GAnalys[texUuid2].bitmap = {
                                                name: fontInfo[1],
                                                info: fontInfo[3],
                                                fntuuid: fontUuid,
                                            };
                                            console.log(texUuid2 + " has BitmapFont info");
                                            break;
                                        case "cc.JsonAsset":
                                            var jsonUuid = uuids[packIndices[i]];
                                            if (!GAnalys[jsonUuid]) {
                                                GAnalys[jsonUuid] = GConfig[jsonUuid] || {
                                                    bundle: bundleName,
                                                };
                                                delete GConfig[jsonUuid];
                                                GAnalys[jsonUuid].ttype = "cc.JsonAsset";
                                                entry[5] = entry[0];
                                                GAnalys[jsonUuid].content = JSON.stringify(entry, null, 2);
                                                console.log(jsonUuid + " has json info");
                                            }
                                            break;
                                        case "cc.TextAsset":
                                            var textUuid = uuids[packIndices[i]];
                                            if (!GAnalys[textUuid]) {
                                                GAnalys[textUuid] = GConfig[textUuid] || {
                                                    bundle: bundleName,
                                                };
                                                delete GConfig[textUuid];
                                                GAnalys[textUuid].ttype = "cc.TextAsset";
                                                entry[5] = entry[0];
                                                GAnalys[textUuid].fileout = this.correctPath(
                                                    this.dirOut + bundleName + "/unkown_text/" + entry[5][0][1] + ".txt"
                                                );
                                                GAnalys[textUuid].content = JSON.stringify(entry, null, 2);
                                                console.log(textUuid + " has text info");
                                            }
                                            break;
                                        case "dragonBones.DragonBonesAtlasAsset":
                                            var dbAtlasUuid = uuids[packIndices[i]];
                                            GAnalys[dbAtlasUuid] = GAnalys[dbAtlasUuid] || {
                                                bundle: bundleName,
                                            };
                                            GAnalys[dbAtlasUuid].ttype = "dragonBones.DragonBonesAtlasAsset";
                                            entry[5] = entry[0];
                                            GAnalys[dbAtlasUuid].content = JSON.stringify(entry, null, 2);
                                            console.log(dbAtlasUuid + " has dragonBones.DragonBonesAtlasAsset info");
                                            break;
                                        case "dragonBones.DragonBonesAsset":
                                            var dbAssetUuid = uuids[packIndices[i]];
                                            GAnalys[dbAssetUuid] = GAnalys[dbAssetUuid] || {
                                                bundle: bundleName,
                                            };
                                            GAnalys[dbAssetUuid].ttype = "dragonBones.DragonBonesAsset";
                                            entry[5] = entry[0];
                                            GAnalys[dbAssetUuid].content = JSON.stringify(entry, null, 2);
                                            console.log(dbAssetUuid + " has dragonBones.DragonBonesAsset info");
                                            break;
                                        case "cc.SpriteAtlas":
                                            var atlasUuid = uuids[packIndices[i]];
                                            for (let k = 0; k < entry[5].length; k++) {
                                                GMapPlist[entry[5][k]] = atlasUuid;
                                            }
                                            break;
                                    }
                                }
                                continue;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
            } catch (e) {
                continue;
            }
        }
    },

    // 从 material/effect 的 json 内容中提取类型
    analysPathsMaterialAndEffect(bundleName, packs, paths, uuids) {
        for (var key in GAnalys) {
            var item = GAnalys[key];
            try {
                if (item.bundle == bundleName && bundleName !== "internal" && item.content) {
                    var json = JSON.parse(item.content);
                    var obj = deserialize(json);
                    if (obj.__cid__ === "cc.Material" || obj.__cid__ === "cc.EffectAsset") {
                        item.ttype = obj.__cid__;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        for (var cid in GConfig) {
            var cfg = GConfig[cid];
            var obj;
            if (GAnalys[cid]) {
                try {
                    if (cfg.bundle == bundleName && bundleName !== "internal" && cfg.content) {
                        var json = JSON.parse(cfg.content);
                        obj = deserialize(json);
                        if (obj.__cid__ === "cc.TTFFont") {
                            GAnalys[cid].ttfname = obj._name;
                            GAnalys[cid].ttype = obj.__cid__;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        for (var key in GAnalys) {
            var item = GAnalys[key];
            try {
                if (item.bundle == bundleName && bundleName !== "internal") {
                    if (item.ttype === "cc.Material") {
                        var json = JSON.parse(item.content);
                        var texUuid = UuidUtils.decompressUuid(json[1][0]);
                        GAnalys[texUuid] = GAnalys[texUuid] || {
                            bundle: bundleName,
                        };
                        GAnalys[texUuid].material = GAnalys[texUuid].material || {};
                        GAnalys[texUuid].material.mtls = GAnalys[texUuid].material.mtls || [];
                        GAnalys[texUuid].material.mtls[GAnalys[texUuid].material.mtls.length] = {
                            mtl: json[5][0],
                            mtluuid: key,
                        };
                    } else if (item.ttype === "cc.EffectAsset") {
                        var propsArr2 = [];
                        var json2 = JSON.parse(item.content);
                        for (let i = 0; i < json2[1].length; i++) {
                            json2[1][i] = UuidUtils.decompressUuid(json2[1][i]);
                        }
                        for (let i = 0; i < json2[2].length; i++) {
                            json2[2][i];
                            json2[1][i];
                        }
                        var effectNode = json2[3][json2[4][json2[5][0][0]][0]];
                        for (let i = 1; i < json2[4][json2[5][0][0]].length; i++) {
                            effectNode[1][json2[4][json2[5][0][0]][i]] && (propsArr2[propsArr2.length] = effectNode[1][json2[4][json2[5][0][0]][i]]);
                        }
                        item.material = item.material || {};
                        item.material.effect = json2[5][0];
                        item.material.name = json2[5][0][1];
                        item.material.props = propsArr2;
                    }
                }
            } catch (e) {
                continue;
            }
        }
    },

    // 解析 packs 中的 plist 信息，补全 spriteFrame 的 uuid
    analysPacksPlist(bundleName, packs, paths, uuids) {
        for (var [packUuid, packIndices] of Object.entries(packs)) {
            try {
                var packItem = GAnalys[packUuid];
                if (!packItem) continue;

                var json = JSON.parse(packItem.content);
                var map = {};
                for (let i = 0; i < json[2].length; i++) {
                    map[json[2][i]] = json[1][i];
                }

                var arr5 = json[5];
                for (let i = 0; i < arr5.length; i++) {
                    var entry = arr5[i];
                    try {
                        if (Array.isArray(entry[0]) && Array.isArray(entry[0][0])) {
                            var v = entry[0][0];
                            if (typeof v[1] === "string" && v[1].includes(".plist")) {
                                var texUuid = UuidUtils.decompressUuid(map._textureSetter);
                                if (GAnalys[texUuid] && GAnalys[texUuid].frames) {
                                    for (var name in map) {
                                        if (GAnalys[texUuid].frames[name] && !GAnalys[texUuid].frames[name].uuid) {
                                            GAnalys[texUuid].frames[name].uuid = UuidUtils.decompressUuid(map[name]);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        continue;
                    }
                }
            } catch (e) {
                continue;
            }
        }
    },

    // 解析 spriteFrame / SpriteAtlas / AnimationClip / sp.SkeletonData 等
    analysAnimFrameAtlas(bundleName, packs, paths, uuids) {
        for (var key in GAnalys) {
            var item = GAnalys[key];

            if (item.bundle !== bundleName) continue;

            // SpriteFrame json 直接对应单张纹理
            if (item.ttype === "cc.SpriteFrame") {
                try {
                    var json = JSON.parse(item.content);
                    var texUuid = UuidUtils.decompressUuid(json[1][0]);
                    if (GAnalys[texUuid]) {
                        let frame = json[5][0];
                        let frameName = frame.name;
                        GAnalys[texUuid].frames = GAnalys[texUuid].frames || {};
                        if (this.isPicture(GAnalys[texUuid].ext)) {
                            console.log(texUuid + " has spriteframe info");
                            console.log(texUuid + " " + GAnalys[texUuid].ttype);
                            GAnalys[texUuid].frames = GAnalys[texUuid].frames || {};
                            if (GAnalys[texUuid].frames[frameName]) {
                                frameName = key;
                            }
                            GAnalys[texUuid].frames[frameName] = frame;
                            GAnalys[texUuid].frames[frameName].uuid = key;
                        }
                    }
                } catch (e) {
                    continue;
                }
            } else if (item.ttype === "cc.SpriteAtlas") {
                // SpriteAtlas + plist 模式
                try {
                    var json2 = JSON.parse(item.content);
                    var map = {};
                    for (let i = 0; i < json2[2].length; i++) {
                        map[json2[2][i]] = json2[1][i];
                    }
                    var first = json2[5][0];

                    if (typeof first[1] === "string" && first[1].includes(".plist")) {
                        // plist + TexturePacker
                        var texUuid = UuidUtils.decompressUuid(json2[1][0]);
                        if (GAnalys[texUuid]) {
                            var plistJson = JSON.parse(GAnalys[texUuid].content);
                            var pngUuid = UuidUtils.decompressUuid(plistJson[1][0]);
                            if (GAnalys[pngUuid]) {
                                let framesArr = plistJson[5];
                                if (Array.isArray(plistJson[5][0])) {
                                    framesArr = plistJson[5][0];
                                }

                                for (let i = 0; i < framesArr.length; i++) {
                                    try {
                                        var frame = framesArr[i];
                                        var texId = pngUuid;

                                        if (this.isPicture(GAnalys[texId].ext)) {
                                            console.log(texId + " has spriteframe info");
                                            console.log(texId + " " + GAnalys[texId].ttype);

                                            frame.name &&
                                                frame.name !== "" &&
                                                ((GAnalys[texId].frames = GAnalys[texId].frames || {}),
                                                (frame.uuid = UuidUtils.decompressUuid(map[frame.name])),
                                                GAnalys[texId].frames[frame.name] && (frame.name = frame.name + "_" + frame.uuid),
                                                (GAnalys[texId].frames[frame.name] = frame));

                                            for (var fname in GAnalys[texId].frames) {
                                                !GAnalys[texId].frames[fname].uuid &&
                                                    map[fname] &&
                                                    (GAnalys[texId].frames[fname].uuid = UuidUtils.decompressUuid(map[fname]));
                                            }

                                            GAnalys[texId].plists = GAnalys[texId].plists || {};
                                            GAnalys[texId].plists.uuid = key;
                                        }
                                    } catch (e) {
                                        continue;
                                    }
                                }
                            }
                        } else {
                            // 纹理不存在，尝试用 fileout 名匹配
                            var pngName = item.fileout.replace(".plist", "");
                            for (var texId in GAnalys) {
                                if (GAnalys[texId].fileout && GAnalys[texId].fileout.includes(pngName)) {
                                    if (GAnalys[texId].frames) {
                                        for (var fname in GAnalys[texId].frames) {
                                            if (GAnalys[texId].frames[fname] && map[fname]) {
                                                let name = fname;
                                                let uuid = UuidUtils.decompressUuid(map[fname]);
                                                GAnalys[texId].frames[name] && (name = uuid);
                                                GAnalys[texId].frames[name].uuid = uuid;
                                            }
                                        }
                                    }

                                    GAnalys[texId].plists = GAnalys[texId].plists || {};
                                    GAnalys[texId].plists.uuid = key;
                                }
                            }
                        }
                    } else {
                        // 纯 SpriteAtlas，不带 plist 文件
                        for (let i = 0; i < json2[2].length; i++) {
                            var frameName = json2[2][i];
                            var uuid = UuidUtils.decompressUuid(json2[1][i]);
                            if (GUnkowns[uuid] && (pngItem = GAnalys[GUnkowns[uuid].uuid])) {
                                if (!pngItem.fileout) {
                                    pngItem.fileout = item.fileout.replace(".plist", pngItem.ext);
                                }
                                if (pngItem.frames) {
                                    var frameData = pngItem.frames[frameName];
                                    if (frameData) {
                                        frameData.uuid = UuidUtils.decompressUuid(json2[1][i]);
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    continue;
                }
            } else if (item.ttype === "cc.AnimationClip" && !item.spanim) {
                // AnimationClip json 转回标准 cc.AnimationClip
                try {
                    var json3 = JSON.parse(item.content);
                    item.spanim = json3[5][0];
                    if (json3[10]) {
                        for (let i = 0; i < json3[10].length; i++) {
                            json3[10][i] = UuidUtils.decompressUuid(json3[1][json3[10][i]]);
                        }
                        item.spanim_frames = json3[10];
                    }
                    var propsArr = [];
                    for (let i = 0; i < json3[1].length; i++) {
                        json3[1][i] = UuidUtils.decompressUuid(json3[1][i]);
                    }
                    for (let i = 0; i < json3[2].length; i++) {
                        json3[2][i];
                        json3[1][i];
                    }
                    var node = json3[3][json3[4][json3[5][0][0]][0]];
                    for (let i = 1; i < json3[4][json3[5][0][0]].length; i++) {
                        node[1][json3[4][json3[5][0][0]][i]] && (propsArr[propsArr.length] = node[1][json3[4][json3[5][0][0]][i]]);
                    }
                    item.props = propsArr;
                } catch (e) {
                    continue;
                }
            }

            // sp.SkeletonData / DragonBones 等二进制数据处理
            if (item.sbines) {
                var sbData = item.sbines.datas;
                if (Array.isArray(sbData) && sbData.length > 5) {
                    for (let i = 0; i < sbData[5].length; i++) {
                        try {
                            var sbItem = sbData[5][i];
                            let pngUuids = sbItem[5];
                            if (!Array.isArray(pngUuids)) {
                                pngUuids = sbItem[6];
                            }

                            // 展开 png uuid
                            for (let j = 0; j < pngUuids.length; j++) {
                                if (typeof pngUuids[j] === "number") {
                                    pngUuids[j] = UuidUtils.decompressUuid(sbData[1][pngUuids[j]]);
                                } else {
                                    pngUuids[j] = UuidUtils.decompressUuid(sbData[1][j]);
                                }
                            }

                            for (; Array.isArray(sbItem[0]); ) {
                                sbItem = sbItem[0];
                            }

                            if (
                                (sbItem[1].includes("Dragon_circle_light") && console.log(),
                                typeof sbItem[0] === "number" && typeof sbItem[1] === "string" && typeof sbItem[2] === "string")
                            ) {
                                let nameIndex = 3;
                                let jsonIndex = 4;
                                let ok = !1;

                                if (Array.isArray(sbItem[nameIndex]) && typeof sbItem[jsonIndex] === "object" && Array.isArray(sbItem[5])) {
                                    ok = !0;
                                } else if (typeof sbItem[3] === "number" && Array.isArray(sbItem[4]) && typeof sbItem[5] === "object") {
                                    nameIndex = 4;
                                    jsonIndex = 5;
                                    ok = !0;
                                }

                                if (ok) {
                                    // json / png 组合形式
                                    let owner = item;
                                    if (packs[key]) {
                                        var newUuid = uuids[packs[key][i]];
                                        owner = GAnalys[newUuid];
                                        if (!owner) {
                                            owner = {
                                                bundle: item.bundle,
                                                sbines: sbItem,
                                            };
                                            GAnalys[newUuid] = owner;
                                        }
                                        item.sbines = null;
                                    }

                                    for (let j = 0; j < pngUuids.length; j++) {
                                        var pngItem = GAnalys[pngUuids[j]];
                                        if (pngItem && !pngItem.fileout) {
                                            pngItem.fileout = this.correctPath(this.dirOut + pngItem.bundle + "/unkown_sbine/" + sbItem[nameIndex][j]);
                                            console.log("pngfile.fileout = ", pngItem.fileout);
                                            if (!pngItem.frames) {
                                                pngItem.frames = [];
                                                pngItem.frames[sbItem[nameIndex][j]] = {
                                                    name: sbItem[nameIndex][j],
                                                    unkown_uuid: uuidv4(),
                                                    rotated: !1,
                                                    offset: [0, 0],
                                                    rect: [0, 0, pngItem.width, pngItem.height],
                                                    originalSize: [pngItem.width, pngItem.height],
                                                    capInsets: [0, 0, 0, 0],
                                                };
                                            }
                                        }
                                        console.log("pngfile.fileout = ", pngItem && pngItem.fileout);
                                    }

                                    owner.sbines.pnguuid = pngUuids;
                                    owner.sbines.skname = sbItem[1];
                                    owner.sbines.atlas = sbItem[2];
                                    owner.sbines.jsons = JSON.stringify(sbItem[jsonIndex], null, 2);
                                } else {
                                    // bin + png 模式
                                    let pos = -1;
                                    for (let j = 1; j < sbItem.length - 1; j++) {
                                        if (sbItem[j] === ".bin") {
                                            pos = j;
                                            break;
                                        }
                                    }
                                    if (pos > 0) {
                                        let owner = item;
                                        if (packs[key]) {
                                            item.sbines = null;
                                            var newUuid2 = uuids[packs[key][i]];
                                            owner = GAnalys[newUuid2];
                                            if (!owner) {
                                                owner = {
                                                    bundle: item.bundle,
                                                    sbines: sbItem,
                                                };
                                                GAnalys[newUuid2] = owner;
                                            }
                                            owner.sbines = owner.sbines || sbItem;
                                        }

                                        owner.sbines.pnguuid = pngUuids;
                                        owner.sbines.skname = sbItem[pos - 1];
                                        owner.sbines.atlas = sbItem[pos + 1];

                                        if (owner.ext === ".bin" && owner.fileout) {
                                            owner.fileout = item.fileout.replace(/.json/g, ".skel");
                                        } else {
                                            console.log();
                                        }

                                        for (let j = 0; j < pngUuids.length; j++) {
                                            var pngItem2 = GAnalys[pngUuids[j]];
                                            if (pngItem2 && !pngItem2.fileout) {
                                                if (sbItem[5][j].includes(".")) {
                                                    pngItem2.fileout = this.correctPath(this.dirOut + pngItem2.bundle + "/unkown_sbine/" + sbItem[5][j]);
                                                } else {
                                                    pngItem2.fileout = this.correctPath(
                                                        this.dirOut + pngItem2.bundle + "/unkown_sbine/" + owner.sbines.skname + pngItem2.ext
                                                    );
                                                }

                                                console.log("pngfile.fileout = ", pngItem2.fileout);

                                                if (!pngItem2.frames) {
                                                    pngItem2.frames = [];
                                                    pngItem2.frames[sbItem[5][j]] = {
                                                        name: sbItem[5][j],
                                                        unkown_uuid: uuidv4(),
                                                        rotated: !1,
                                                        offset: [0, 0],
                                                        rect: [0, 0, pngItem2.width, pngItem2.height],
                                                        originalSize: [pngItem2.width, pngItem2.height],
                                                        capInsets: [0, 0, 0, 0],
                                                    };
                                                }
                                            }
                                            console.log("pngfile.fileout = ", pngItem2 && pngItem2.fileout);
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
            }
        }
    },

    // 解析 _textureSetter 结构，建立纹理与 frame 的绑定
    analystextureSetter(bundleName, packs, paths, uuids) {
        // 先处理 GConfig 中的 json
        for (var cid in GConfig) {
            var cfg = GConfig[cid];
            if (cfg.bundle == bundleName && cfg.ext === ".json") {
                try {
                    if (cfg.content.includes("_textureSetter")) {
                        var json = JSON.parse(cfg.content);
                        for (let i = 0; i < json[5].length; i++) {
                            var frame = json[5][i];
                            if (!this.isAFrame(frame)) continue;

                            if (GAnalys[json[1][0]]) {
                                var texUuid = json[1][0];
                                if (this.isPicture(GAnalys[texUuid].ext)) {
                                    GAnalys[texUuid].frames = GAnalys[texUuid].frames || {};
                                    GAnalys[texUuid].frames[frame.name] && (frame.name = frame.name + "_" + cid);
                                    GAnalys[texUuid].frames[frame.name] = frame;
                                    GAnalys[texUuid].frames[frame.name].unkown_uuid = cid;

                                    if (!GAnalys[texUuid].fileout) {
                                        GUnkowns[frame.unkown_uuid] = {
                                            uuid: texUuid,
                                            name: frame.name,
                                        };
                                        cfg.filein = null;
                                        cfg.fileout = null;
                                    }
                                    cfg.png_uuid = texUuid;
                                }
                            } else {
                                var texUuid2 = UuidUtils.decompressUuid(json[1][0]);
                                if (this.isPicture(GAnalys[texUuid2].ext)) {
                                    GAnalys[texUuid2].frames = GAnalys[texUuid2].frames || {};
                                    GAnalys[texUuid2].frames[frame.name] && (frame.name = frame.name + "_" + cid);
                                    GAnalys[texUuid2].frames[frame.name] = frame;
                                    GAnalys[texUuid2].frames[frame.name].unkown_uuid = cid;
                                    cfg.png_uuid = texUuid2;
                                }
                            }
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        // 再处理 GAnalys 中的 json
        for (var key in GAnalys) {
            var item = GAnalys[key];
            if (item.bundle == bundleName && item.ext === ".json") {
                try {
                    if (item.content.includes("_textureSetter")) {
                        var json = JSON.parse(item.content);
                        for (let i = 0; i < json[5].length; i++) {
                            var frame = json[5][i];
                            if (!this.isAFrame(frame)) continue;

                            var texUuid = json[1][0];
                            if (GAnalys[texUuid]) {
                                if (this.isPicture(GAnalys[texUuid].ext)) {
                                    GAnalys[texUuid].frames = GAnalys[texUuid].frames || {};
                                    GAnalys[texUuid].frames[frame.name] && (frame.name = frame.name + "_" + key);
                                    GAnalys[texUuid].frames[frame.name] = frame;
                                    GAnalys[texUuid].frames[frame.name].unkown_uuid = key;

                                    if (!GAnalys[texUuid].fileout) {
                                        GUnkowns[frame.unkown_uuid] = {
                                            uuid: texUuid,
                                            name: frame.name,
                                        };
                                        item.filein = null;
                                        item.fileout = null;
                                    }
                                    item.png_uuid = texUuid;
                                }
                            } else {
                                var texUuid2 = UuidUtils.decompressUuid(json[1][0]);
                                if (GAnalys[texUuid2] && this.isPicture(GAnalys[texUuid2].ext)) {
                                    GAnalys[texUuid2].frames = GAnalys[texUuid2].frames || {};
                                    GAnalys[texUuid2].frames[frame.name] && (frame.name = frame.name + "_" + key);
                                    GAnalys[texUuid2].frames[frame.name] = frame;
                                    GAnalys[texUuid2].frames[frame.name].unkown_uuid = key;
                                    item.png_uuid = texUuid2;
                                }
                            }
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        // BitmapFont 关联纹理
        for (var key2 in GAnalys) {
            var item2 = GAnalys[key2];
            if (item2.bundle == bundleName && item2.ext === ".json") {
                try {
                    if (item2.content.includes("fontDefDictionary")) {
                        var json2 = JSON.parse(item2.content);
                        for (let i = 0; i < json2[5].length; i++) {
                            var fontInfo = json2[5][i];
                            var fontTexUuid = UuidUtils.decompressUuid(json2[1][0]);
                            if (GAnalys[fontTexUuid] && GAnalys[fontTexUuid].png_uuid && this.isPicture(GAnalys[GAnalys[fontTexUuid].png_uuid].ext)) {
                                GAnalys[GAnalys[fontTexUuid].png_uuid].bitmap = {
                                    name: fontInfo[1],
                                    info: fontInfo[3],
                                    fntuuid: key2,
                                };
                            }
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
        }
    },

    // 简单判断是否 sprite frame 结构
    isAFrame(node) {
        return typeof node === "object" && node.name && node.rect && node.offset && !0;
    },

    // 拷贝原始文件、生成 skel/json/atlas 等
    async copyFiles() {
        var unkownMap = {},
            sbineMap = {},
            key;

        // 第一轮：有 fileout 的直接 copy；图片但没 fileout 的先统计 path
        for (key in GAnalys) {
            let item = GAnalys[key];
            let out = item.fileout;

            if (out && item.filein) {
                out = out.replace(/\\/g, "/");
                if (!out.includes(".prefab")) {
                    // 避免 sbine 重名
                    sbineMap[(out = sbineMap[out] ? out.replace("unkown_sbine", "unkown_sbine/" + key) : out)] = key;

                    let arr = out.split("/");
                    arr.pop();
                    await dir.dirExists(arr.join("/"));
                    fs.copyFileSync(item.filein, out);
                }
            } else if (item.filein && this.isPicture(item.ext)) {
                let unkownPath = this.correctPath(this.dirOut + item.bundle + "/unkown/" + key);

                if (item.frames) {
                    let count = 0;
                    let lastName = "";
                    for (var fname in item.frames) {
                        count++;
                        lastName = fname;
                    }
                    if (count === 1) {
                        unkownPath = this.correctPath(this.dirOut + item.bundle + "/unkown/" + lastName);
                    }
                }

                unkownMap[unkownPath] = unkownMap[unkownPath] || {
                    path: unkownPath,
                    ext: item.ext,
                    count: 0,
                };
                unkownMap[unkownPath].count += 1;
            }
        }

        // 第二轮：图片有 frames 但没 fileout 的，使用 unkownMap 统计结果
        for (key in GAnalys) {
            var item2 = GAnalys[key];
            var out2 = item2.fileout;

            if (!out2 && item2.filein && this.isPicture(item2.ext) && item2.frames) {
                let unkownPath = this.correctPath(this.dirOut + item2.bundle + "/unkown/" + key);

                if (item2.frames) {
                    let count = 0;
                    let lastName = "";
                    for (var fname2 in item2.frames) {
                        count++;
                        lastName = fname2;
                    }
                    if (count === 1) {
                        unkownPath = this.correctPath(this.dirOut + item2.bundle + "/unkown/" + lastName);
                    }
                }

                unkownMap[unkownPath] || console.log();
                item2.fileout = this.correctPath(unkownMap[unkownPath].path + unkownMap[unkownPath].ext);
                if (unkownMap[unkownPath].count > 1) {
                    item2.fileout = this.correctPath(unkownMap[unkownPath].path + "/" + key + unkownMap[unkownPath].ext);
                }

                var arr2 = item2.fileout.replace(/\\/g, "/").split("/");
                arr2.pop();
                await dir.dirExists(arr2.join("/"));
                fs.copyFileSync(item2.filein, item2.fileout);
            }
        }

        // 第三轮：处理 sbines（spine/dragonBones）
        for (key in GAnalys) {
            let item3 = GAnalys[key];
            let out3 = item3.fileout;

            if (!item3.sbines) continue;

            try {
                if (!out3) {
                    if (GFrameNames[key]) {
                        if (item3.ext === ".bin") {
                            item3.fileout = this.correctPath(GFrameNames[key] + ".skel");
                        } else {
                            item3.fileout = this.correctPath(GFrameNames[key] + ".json");
                        }
                        out3 = item3.fileout;
                    } else {
                        if (!item3.sbines.skname) {
                            console.log("sbine new out = ", out3);
                            continue;
                        }
                        out3 =
                            item3.ext === ".bin"
                                ? this.correctPath(this.dirOut + item3.bundle + "/unkown_sbine/" + item3.sbines.skname + ".skel")
                                : this.correctPath(this.dirOut + item3.bundle + "/unkown_sbine/" + item3.sbines.skname + ".json");
                    }
                }

                sbineMap[(out3 = sbineMap[out3] ? out3.replace("unkown_sbine", "unkown_sbine/" + key) : out3)] = key;

                if (item3.ext === ".bin") {
                    var arr3 = out3.replace(/\\/g, "/").split("/");
                    arr3.pop();
                    await dir.dirExists(arr3.join("/"));

                    out3 = out3.replace(/.json/g, ".skel");

                    if (!item3.fileout) {
                        fs.writeFileSync(out3, item3.content, { undefined: void 0 }, (e) => {
                            e && console.log("copyFiles err:", e);
                        });
                    }

                    item3.fileout_jsons = out3;
                    item3.fileout_atlas = out3.replace(/.skel/g, ".atlas");
                } else {
                    out3 = out3.replace(/\\/g, "/");
                    var arr4 = out3.split("/");
                    arr4.pop();
                    await dir.dirExists(arr4.join("/"));

                    item3.fileout_jsons = out3;
                    fs.writeFileSync(item3.fileout_jsons, item3.sbines.jsons, { undefined: void 0 }, (e) => {
                        e && console.log("copyFiles err:", e);
                    });

                    item3.fileout_atlas = out3.replace(/.json/g, ".atlas");
                }

                if (fs.existsSync(item3.fileout_atlas)) {
                    console.log("copyFiles atlas exists:", item3.fileout_atlas);
                } else {
                    fs.writeFileSync(item3.fileout_atlas, item3.sbines.atlas, { undefined: void 0 }, (e) => {
                        e && console.log("copyFiles err:", e);
                    });
                }
            } catch (e) {
                continue;
            }
        }
    },

    // 生成 JsonAsset 对应的普通 json 文件及 meta
    async newJsonFiles() {
        for (var [uuid, item] of Object.entries(GAnalys)) {
            if (item.ttype === "cc.JsonAsset") {
                var json = JSON.parse(item.content);
                if (!item.fileout) {
                    item.fileout = this.correctPath(this.dirOut + item.bundle + "/unkown_json/" + json[5][0][1] + ".json");
                }

                var outPath = item.fileout.replace(/\\/g, "/");
                var arr = outPath.split("/");
                arr.pop();
                await dir.dirExists(arr.join("/"));

                var jsonContent = "";
                jsonContent = Array.isArray(json) ? JSON.stringify(json[5][0][2], null, 2) : JSON.stringify(json.json, null, 2);

                fs.writeFileSync(outPath, jsonContent, { undefined: void 0 }, (e) => {
                    e && console.log("copyFiles err:", e);
                });

                var metaJson = {
                    ver: "1.0.2",
                    uuid: uuid,
                    importer: "json",
                    subMetas: {},
                };
                var metaStr = JSON.stringify(metaJson, null, 2);
                fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
                    e && console.log("copyFiles err:", e);
                });
            }
        }
    },

    // 生成 dragonBones 相关 json + meta
    async newDragonJsonFiles() {
        for (var [uuid, item] of Object.entries(GAnalys)) {
            if (item.ttype !== "dragonBones.DragonBonesAsset" && item.ttype !== "dragonBones.DragonBonesAtlasAsset") {
                continue;
            }

            var json = JSON.parse(item.content);
            if (!item.fileout) {
                item.fileout = this.correctPath(this.dirOut + item.bundle + "/unkown_json/" + json[5][0][1] + ".json");
            }

            var outPath = item.fileout.replace(/\\/g, "/");
            var arr = outPath.split("/");
            arr.pop();
            await dir.dirExists(arr.join("/"));

            var jsonContent = "";
            jsonContent = Array.isArray(json) ? json[5][0][2] : JSON.stringify(json.json, null, 2);

            fs.writeFileSync(outPath, jsonContent, { undefined: void 0 }, (e) => {
                e && console.log("copyFiles err:", e);
            });

            var metaJson = {
                ver: "1.0.2",
                uuid: uuid,
                subMetas: {},
            };
            var metaStr = JSON.stringify(metaJson, null, 2);
            fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
                e && console.log("copyFiles err:", e);
            });
        }
    },

    // 生成 TextAsset 文本及 meta
    async newTextFiles() {
        for (var [uuid, item] of Object.entries(GAnalys)) {
            if (item.ttype === "cc.TextAsset") {
                var outPath = item.fileout.replace(/\\/g, "/");
                var arr = outPath.split("/");
                arr.pop();
                await dir.dirExists(arr.join("/"));

                var content = JSON.parse(item.content)[5][0][2] || "";
                fs.writeFileSync(outPath, content, { undefined: void 0 }, (e) => {
                    e && console.log("copyFiles err:", e);
                });

                var metaJson = {
                    ver: "1.0.1",
                    importer: "text",
                    uuid: uuid,
                    subMetas: {},
                };
                var metaStr = JSON.stringify(metaJson, null, 2);
                fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
                    e && console.log("copyFiles err:", e);
                });
            }
        }
    },

    // 替换 Effect 源码里的 CCGlobal / CCLocal / alpha-test 宏
    subsMaterialStr(code) {
        var before, after;
        let idx = code.indexOf("uniform CCGlobal");
        if (idx !== -1) {
            before = code.substring(0, idx);
            after = code.substring(idx);
            idx = after.indexOf("};");
            code = before + "#include <cc-global>" + after.substring(idx + 2);
        }

        idx = code.indexOf("uniform CCLocal");
        if (idx !== -1) {
            before = code.substring(0, idx);
            after = code.substring(idx);
            idx = after.indexOf("};");
            code = before + "#include <cc-local>" + after.substring(idx + 2);
        }

        idx = code.indexOf("#if USE_ALPHA_TEST");
        if (idx !== -1) {
            before = code.substring(0, idx);
            idx = code.lastIndexOf("#if USE_ALPHA_TEST");
            after = code.substring(idx);
            idx = after.indexOf("}");
            code = before + "#include <alpha-test>" + after.substring(idx + 1);
        }

        return code;
    },

    // 递归生成 Effect 的 YAML 结构（techniques / properties 等）
    async newEffectLoops(key, node, outStr, indent, isFirst) {
        if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                outStr = await this.newEffectLoops("", node[i], outStr, indent, i === 0);
            }
        } else if (typeof node === "object") {
            if (node.program) {
                var name,
                    value,
                    result = node.program.split("|");
                var obj = { vert: result[1], frag: result[2] };
                for ([name, value] of Object.entries(node)) {
                    if (name !== "program") obj[name] = value;
                }
                node = obj;
            }

            for (var [k, v] of Object.entries(node)) {
                var preIndent = indent;
                if (typeof v === "object") {
                    if (k === "properties") {
                        outStr += (preIndent += "  ") + "properties:\n";
                        preIndent += "  ";
                        for (var [propName, propInfo] of Object.entries(v)) {
                            switch (propInfo.type) {
                                case 13:
                                    if (Array.isArray(propInfo.value)) {
                                        outStr += preIndent + propName + `: { value: ${propInfo.value[0]} }\n`;
                                    } else {
                                        outStr += preIndent + propName + `: { value: ${propInfo.value} }\n`;
                                    }
                                    break;
                                case 16:
                                    outStr += preIndent + propName + `: { value: [${propInfo.value.join(",")}], editor: {type: color}}\n`;
                                    break;
                                case 29:
                                    outStr += preIndent + propName + `: { value: ${propInfo.value} }\n`;
                                    break;
                                default:
                                    console.log();
                            }
                        }
                    } else {
                        if (isFirst) {
                            isFirst = !1;
                            outStr += preIndent + `- ${k}:\n`;
                        } else {
                            outStr += preIndent + `  ${k}:\n`;
                        }
                        outStr = await this.newEffectLoops(k, v, outStr, preIndent + "  ");
                    }
                } else {
                    if (isFirst) {
                        isFirst = !1;
                        outStr += preIndent + `- ${k}: ${this.mapBlendValue(v)}\n`;
                    } else {
                        outStr += preIndent + `  ${k}: ${this.mapBlendValue(v)}\n`;
                    }
                }
            }
        } else {
            outStr += indent + key + `: ${node}\n`;
        }
        return outStr;
    },

    // blend 模式的数值到字符串映射
    mapBlendValue(val) {
        if (val === 2) return "src_alpha";
        if (val === 4) return "one_minus_src_alpha";
        if (val === 0) return "none";
        return val;
    },

    // 生成 .effect 文件及 meta
    async newEffectFiles(uuid, item) {
        let nameIndex;
        let effectData = item.material.effect;
        let props = item.material.props;
        let effectName = "";
        let techniques = null;

        // 从 props 中解析 _name / shaders / techniques 等
        for (let i = 0; i < props.length; i++) {
            if (props[i] === "_name") {
                var idx = i + 1;
                effectName = effectData[idx];
                var lastSlash = effectName.lastIndexOf("/");
                if (lastSlash !== -1) {
                    effectName = effectName.substring(lastSlash + 1);
                }
            } else if (props[i] === "shaders") {
                effectData[i + 1];
            } else if (props[i] === "techniques") {
                techniques = effectData[i + 1];
            }
        }

        let out = "CCEffect %{\n";
        if (techniques) {
            let pre = "";
            out = await this.newEffectLoops("", { techniques }, out, pre);
        }
        out += "}%\n\n\n";

        // 写 glsl1 / glsl3 代码
        for (let i = 0; i < item.material.effect[2].length; i++) {
            var inputJson = item.material.effect[2][i];
            var names = inputJson.name.split("|");
            var vertName = names[1].split(":")[0];
            var fragName = names[2].split(":")[0];

            if (inputJson.glsl3) {
                out =
                    out +
                    `CCProgram ${vertName} %{\n` +
                    this.subsMaterialStr(inputJson.glsl3.vert) +
                    `
}% 


` +
                    `CCProgram ${fragName} %{\n` +
                    this.subsMaterialStr(inputJson.glsl3.frag) +
                    `
}% 
`;
            }
        }

        var outPath = item.pathdir
            ? this.dirOut + item.bundle + "/" + item.pathdir + ".effect"
            : GFrameNames[uuid]
            ? this.correctPath(GFrameNames[uuid] + ".effect")
            : this.dirOut + item.bundle + "/unkown_effect/" + effectName + ".effect";

        outPath = outPath.replace(/\\/g, "/");
        var arr = outPath.split("/");
        arr.pop();
        await dir.dirExists(arr.join("/"));

        fs.writeFileSync(outPath, out, { undefined: void 0 }, (e) => {
            e && console.log("copyFiles err:", e);
        });

        var metaJson = {
            ver: "1.0.27",
            uuid: uuid,
            importer: "effect",
            compiledShaders: [{ glsl1: inputJson.glsl1, glsl3: inputJson.glsl3 }],
            subMetas: {},
        };
        var metaStr = JSON.stringify(metaJson, null, 2);
        fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
            e && console.log("copyFiles err:", e);
        });
    },

    // 生成 .mtl 材质文件及 meta
    async newMaterialFiles() {
        for (var [uuid, item] of Object.entries(GAnalys)) {
            if ((uuid === "5cb05e6b-782f-4cfe-8402-f4ba1bd7580d" && console.log(), item.material)) {
                if (item.material.effect) {
                    await this.newEffectFiles(uuid, item);
                }

                if (!item.material.mtls) continue;

                for (let i = 0; i < item.material.mtls.length; i++) {
                    let mtlRef = item.material.mtls[i];
                    let materialObj = {
                        __type__: "cc.Material",
                        _name: mtlRef.mtl[1],
                        _objFlags: 0,
                        _native: "",
                        _effectAsset: { __uuid__: uuid },
                        _techniqueData: mtlRef.mtl[2],
                    };

                    if (Array.isArray(mtlRef.mtl[2])) {
                        materialObj._techniqueData = await this.aniAnimsObjs(mtlRef.mtl[2], null);
                    }

                    let pathdir = item.pathdir;
                    pathdir = GAnalys[mtlRef.mtluuid] ? GAnalys[mtlRef.mtluuid].pathdir : pathdir;

                    var outPath = pathdir
                        ? this.correctPath(this.dirOut + item.bundle + "/" + pathdir + ".mtl")
                        : GFrameNames[mtlRef.mtluuid]
                        ? this.correctPath(GFrameNames[mtlRef.mtluuid] + ".mtl")
                        : this.dirOut + item.bundle + "/unkown_effect/" + mtlRef.mtl[1] + ".mtl";

                    outPath = outPath.replace(/\\/g, "/");
                    var arr = outPath.split("/");
                    arr.pop();
                    await dir.dirExists(arr.join("/"));

                    var content = JSON.stringify(materialObj, null, 2);
                    fs.writeFileSync(outPath, content, { undefined: void 0 }, (e) => {
                        e && console.log("copyFiles err:", e);
                    });

                    var metaJson = {
                        ver: "1.0.5",
                        uuid: mtlRef.mtluuid,
                        importer: "material",
                        dataAsSubAsset: null,
                        subMetas: {},
                    };
                    var metaStr = JSON.stringify(metaJson, null, 2);
                    fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
                        e && console.log("copyFiles err:", e);
                    });
                }
            }
        }
    },

    // 生成 TTF 模板文件及 meta
    async newTTFFiles() {
        for (var [uuid, item] of Object.entries(GAnalys)) {
            if (item.ttype === "cc.TTFFont") {
                if (!item.fileout) {
                    var name = item.ttfname || uuid;
                    item.fileout = this.correctPath(this.dirOut + item.bundle + "/unkown_ttf/" + name + ".ttf");
                }
                var outPath = item.fileout.replace(/\\/g, "/");
                var arr = outPath.split("/");
                arr.pop();
                await dir.dirExists(arr.join("/"));

                item.content || (item.content = fs.readFileSync("ttf_template.TTF"));
                fs.writeFileSync(outPath, item.content, { undefined: void 0 }, (e) => {
                    e && console.log("copyFiles err:", e);
                });

                var metaJson = {
                    ver: "1.1.2",
                    uuid: uuid,
                    importer: "ttf-font",
                    subMetas: {},
                };
                var metaStr = JSON.stringify(metaJson, null, 2);
                fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
                    e && console.log("copyFiles err:", e);
                });
            }
        }
    },

    // 生成 AnimationClip .anim 文件
    async newAnimsFiles() {
        for (var [uuid, item] of Object.entries(GAnalys)) {
            try {
                if (!item.spanim) continue;

                var animObj = {
                    __type__: "cc.AnimationClip",
                    _objFlags: 0,
                    _native: "",
                    curveData: {},
                    events: [],
                };

                for (let i = 0; i < item.props.length; i++) {
                    var propName = item.props[i];
                    if (propName === "curveData") {
                        var value = item.spanim[i + 1];
                        if (Array.isArray(value)) {
                            value = await this.aniAnimsObjs(value, item.spanim_frames);
                        }
                        value && (animObj[propName] = value);
                    } else {
                        animObj[propName] = item.spanim[i + 1];
                    }
                }

                var content = JSON.stringify(animObj, null, 2);
                if (!item.fileout) {
                    item.fileout = this.correctPath(this.dirOut + item.bundle + "/unkown_anim/" + item.spanim[1] + ".anim");
                }
                var outPath = item.fileout.replace(/\\/g, "/");
                var arr = outPath.split("/");
                arr.pop();
                await dir.dirExists(arr.join("/"));
                fs.writeFileSync(outPath, content, { undefined: void 0 }, () => {});
            } catch (e) {
                continue;
            }
        }
    },

    // 解析动画曲线对象（递归结构）
    async aniAnimsObjs(arr, frameUuids) {
        let obj = {};
        let lastKey = "";
        for (let i = 0; i < arr.length; i++) {
            var node = arr[i];
            var ttype = typeof node;
            if (ttype === "object") {
                for (var k in node) obj[k] = node[k];
            } else if (ttype === "string") {
                lastKey = node;
            } else if (node === 8) {
                var val = arr[++i];
                if (val[0] === 4) {
                    // Color
                    var bin = val[1].toString(2).padStart(32, "0");
                    var a = parseInt(bin.slice(0, 8), 2);
                    var b = parseInt(bin.slice(8, 16), 2);
                    var g = parseInt(bin.slice(16, 24), 2);
                    var r = parseInt(bin.slice(24, 32), 2);
                    obj[lastKey] = {
                        __type__: "cc.Color",
                        r,
                        g,
                        b,
                        a,
                    };
                } else {
                    // Vec2
                    obj[lastKey] = {
                        __type__: "cc.Vec2",
                        x: val[1],
                        y: val[2],
                    };
                }
            } else if (node === 11) {
                i++;
                obj[lastKey] = await this.aniAnimsObjs(arr[i], frameUuids);
            } else if (node === 12) {
                i++;
                obj[lastKey] = await this.aniAnimsArray(arr[i], frameUuids);
            }
        }
        return obj;
    },

    // 解析动画曲线数组
    async aniAnimsArray(info, frameUuids) {
        let result = [];
        let lastKey = "";
        for (let i = 0; i < info[0].length; i++) {
            let node = info[0][i];
            let obj = {};
            let ttype = typeof node;

            if (Array.isArray(node)) {
                for (let j = 0; j < node.length; j++) {
                    var item = node[j];
                    var ptype = typeof item;
                    if (ptype === "object") {
                        for (var k in item) obj[k] = item[k];
                    } else if (ptype === "string") {
                        lastKey = item;
                    } else if (item === 8) {
                        var val = node[++j];
                        if (val[0] === 4) {
                            var bin = val[1].toString(2).padStart(32, "0");
                            var a = parseInt(bin.slice(0, 8), 2);
                            var b = parseInt(bin.slice(8, 16), 2);
                            var g = parseInt(bin.slice(16, 24), 2);
                            var r = parseInt(bin.slice(24, 32), 2);
                            obj[lastKey] = {
                                __type__: "cc.Color",
                                r,
                                g,
                                b,
                                a,
                            };
                        } else {
                            obj[lastKey] = {
                                __type__: "cc.Vec2",
                                x: val[1],
                                y: val[2],
                            };
                        }
                    } else if (item === 6) {
                        j++;
                        obj[lastKey] = {
                            __uuid__: frameUuids[node[j]],
                        };
                    }
                }
            } else if (ttype === "object") {
                obj = node;
            }

            result.push(obj);
        }
        return result;
    },

    // 生成 BitmapFont 的 fnt 文件
    async newFontsFiles() {
        for (var [uuid, item] of Object.entries(GAnalys)) {
            if (!item.bitmap || !item.frames) continue;

            try {
                for (var [frameName, frame] of Object.entries(item.frames)) {
                    let header =
                        'info face="仿宋" size={0} bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=1 aa=1 padding=0,0,0,0 spacing=1,1 outline=0 \n';
                    header = header.format(item.bitmap.info.fontSize);
                    header += "common lineHeight={0} base=28 scaleW={1} scaleH={2} pages=1 packed=0 alphaChnl=0 redChnl=0 greenChnl=0 blueChnl=0 \n".format(
                        item.bitmap.info.commonHeight,
                        frame.originalSize[0],
                        frame.originalSize[1]
                    );
                    header += 'page id=0 file="{0}" \n'.format(item.bitmap.info.atlasName);

                    let count = 0;
                    let charsStr = "";
                    for (var charId in item.bitmap.info.fontDefDictionary) {
                        count++;
                        var def = item.bitmap.info.fontDefDictionary[charId];
                        charsStr += "char id={0} x={1} y={2} width={3} height={4} xoffset={5} yoffset={6} xadvance={7} page=0 chnl=15\n".format(
                            charId,
                            def.rect.x,
                            def.rect.y,
                            def.rect.width,
                            def.rect.height,
                            def.xOffset,
                            def.yOffset,
                            def.xAdvance
                        );
                    }

                    header += "chars count={0} \n".format(count);
                    let fntContent = header + charsStr;

                    let outPath = item.bitmap.fileout;
                    outPath =
                        outPath ||
                        (GFrameNames[item.bitmap.fntuuid]
                            ? this.correctPath(GFrameNames[item.bitmap.fntuuid] + ".fnt")
                            : this.correctPath(this.dirOut + item.bundle + "/unkown/" + item.bitmap.name + ".fnt"));

                    outPath = outPath.replace(/\\/g, "/");
                    let arr = outPath.split("/");
                    arr.pop();
                    await dir.dirExists(arr.join("/"));
                    item.bitmap.fileout = this.correctPath(outPath);

                    fs.writeFileSync(outPath, fntContent, { undefined: void 0 }, (e) => {
                        e && console.log("copyFiles err:", e);
                    });
                }
            } catch (e) {
                continue;
            }
        }
    },

    // 生成 TexturePacker 风格的 plist 文件
    async newPlistFiles() {
        for (var [uuid, item] of Object.entries(GAnalys)) {
            if (!item.frames) continue;

            var frames = {};
            var meta = {};
            let plistUuid = null;

            for (var name in item.frames) {
                var frame = item.frames[name];
                var fileName = frame.name + ".png";
                var node = {};
                var rect = frame.rect;
                var offset = frame.offset;
                var orig = frame.originalSize;

                node.rotated = frame.rotated > 0;
                node.offset = `{${offset[0]},${offset[1]}}`;
                node.frame = `{{${rect[0]},${rect[1]}},{${rect[2]},${rect[3]}}}`;
                node.sourceColorRect = `{{0,0},{${orig[0]},${orig[1]}}}`;
                node.sourceSize = `{${orig[0]},${orig[1]}}`;

                if (!((item.width <= rect[2] && rect[3] >= item.height) || (orig[0] >= item.width && orig[1] >= item.height))) {
                    if (orig[0] <= 0 && orig[1] <= 0) break;
                    frames[fileName] = node;
                    !plistUuid && GMapPlist[frame.uuid] && (plistUuid = GMapPlist[frame.uuid]);
                }
            }

            if (Object.keys(frames).length <= 0) continue;

            console.log(`uuid:${uuid} has a plist file`);

            let texName = item.fileout;
            if (texName !== "") {
                var arr = texName.split("/");
                texName = arr[arr.length - 1];
            }

            meta.frames = frames;
            var metaInfo = { format: 2 };
            metaInfo.realTextureFileName = texName;
            metaInfo.size = `{${item.width},${item.height}}`;
            metaInfo.smartupdate = "$TexturePacker:SmartUpdate:f050e0f5a6de980e0f76806304dfcf8b:1/1$";
            metaInfo.textureFileName = texName;
            meta.metadata = metaInfo;

            var plistStr = this.plistJSONToXML(meta);
            var plistOut = item.fileout.split(".").slice(0, -1).join(".") + ".plist";

            item.plists = item.plists || { uuid: plistUuid };
            item.plists.fileout = this.correctPath(plistOut);

            fs.writeFileSync(plistOut, plistStr, { undefined: void 0 }, (e) => {
                e && console.log("copyFiles err:", e);
            });
        }
    },

    // plist JSON 转 XML
    plistJSONToXML(json) {
        var ctx = {
            xml: `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
	<dict>
`,
        };
        this.plistWriteDict(ctx, json, "\t\t");
        ctx.xml += `	</dict>
</plist>`;
        return ctx.xml;
    },

    // 递归写 plist dict
    plistWriteDict(ctx, obj, indent) {
        for (var [key, val] of Object.entries(obj)) {
            ctx.xml +=
                indent +
                `<key>${key}</key>
`;

            switch (typeof val) {
                case "object":
                    ctx.xml +=
                        indent +
                        `<dict>
`;
                    this.plistWriteDict(ctx, val, indent + "\t");
                    ctx.xml +=
                        indent +
                        `</dict>
`;
                    break;
                case "boolean":
                    ctx.xml +=
                        indent +
                        `<${val ? "true" : "false"}/>
`;
                    break;
                case "string":
                    ctx.xml += indent + `<string>${this.plistEscapeXml(val)}</string>\n`;
                    break;
                case "number":
                    ctx.xml +=
                        indent +
                        `<integer>${val}</integer>
`;
                    break;
            }
        }
    },

    // 转义 plist string
    plistEscapeXml(str) {
        return str.replace(/&/g, "&amp;");
    },
};

module.exports = revert;
