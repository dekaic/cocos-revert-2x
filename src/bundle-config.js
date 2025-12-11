const fs = require("fs");
const UuidUtils = require("./utils/uuid-utils");
const dir = require("./utils/dir-utils");
const { EXT_MAP, GMapSubs, GCfgJson, GAnalys, GConfig, GFrameNames, GAnimMp } = require("./revert-state");

// 解析 bundle 的 config.json
function parseBundleConfig(bundleName, cfgJson) {
    // 统计 bundle 依赖次数
    GMapSubs[bundleName] = GMapSubs[bundleName] || 0;
    GMapSubs[bundleName] += 1;

    if (!fs.existsSync(this.dirOut)) {
        fs.mkdirSync(this.dirOut);
    }

    const bundleOutDir = `${this.dirOut}${bundleName}/`;
    if (!fs.existsSync(bundleOutDir)) {
        fs.mkdirSync(bundleOutDir);
    }

    if (cfgJson.deps) {
        for (let i = 0; i < cfgJson.deps.length; i++) {
            const depName = cfgJson.deps[i];
            GMapSubs[depName] = GMapSubs[depName] || 0;
            GMapSubs[depName] += 1;
        }
    }

    const { paths, types } = cfgJson;
    const uuids = cfgJson.uuids;

    // 解压短 uuid
    for (let i = 0; i < uuids.length; i++) {
        const u = uuids[i];
        if (u.length >= 10) {
            uuids[i] = UuidUtils.decompressUuid(u);
        }
        console.log(`${bundleName}: ${i} = ${u} : ${uuids[i]}`);
    }

    GCfgJson[bundleName] = cfgJson;

    const usedMap = {};

    // 遍历所有路径，绑定 ttype / fileout
    for (const idx in paths) {
        let mapping; // 保留原变量，避免逻辑变更
        const [pathDir, typeIndex] = paths[idx];
        const uuid = uuids[idx];

        paths[idx][(usedMap[uuid] = 1)] = types[typeIndex];
        console.log(`${uuid} ttype = `, types[typeIndex]);

        if (GAnalys[uuid]) {
            GAnalys[uuid].ttype = types[typeIndex];

            if (EXT_MAP[types[typeIndex]]) {
                if (GAnalys[uuid].ext === ".atlas") {
                    GAnalys[uuid].fileout = this.correctPath(`${bundleOutDir}${pathDir}.atlas`);
                } else if (GAnalys[uuid].ext === ".bin" && types[typeIndex] !== "cc.BufferAsset") {
                    GAnalys[uuid].fileout = this.correctPath(`${bundleOutDir}${pathDir}.skel`);
                } else if (types[typeIndex] === "cc.Asset") {
                    GAnalys[uuid].fileout = this.correctPath(`${bundleOutDir}${pathDir}${GAnalys[uuid].ext}`);
                } else if (GAnalys[uuid].ext === ".jpg") {
                    GAnalys[uuid].fileout = this.correctPath(`${bundleOutDir}${pathDir}.jpg`);
                } else {
                    GAnalys[uuid].fileout = this.correctPath(`${bundleOutDir}${pathDir}${EXT_MAP[types[typeIndex]]}`);
                }
            } else {
                // 非 EXT_MAP 中的类型，部分需要特殊处理
                GAnalys[uuid].pathdir = pathDir;
                if (types[typeIndex] === "cc.SpriteFrame") {
                    GFrameNames[uuid] = `${bundleOutDir}${pathDir}`;
                }
            }
        } else if (types[typeIndex] === "cc.AnimationClip") {
            // 只有动画 clip 的 uuid，没有实际文件
            GAnalys[uuid] = GAnalys[uuid] || GConfig[uuid] || {};
            GAnalys[uuid].ttype = types[typeIndex];
            GAnalys[uuid].ext = ".anim";
            GAnalys[uuid].fileout = this.correctPath(`${bundleOutDir}${pathDir}${EXT_MAP[types[typeIndex]]}`);

            const pathParts = pathDir.split("/");
            if (pathParts.length > 0) {
                GAnimMp[pathParts[pathParts.length - 1]] = GAnalys[uuid];
                console.log(`${uuid} is a cc.Anim`);
            }
        } else if (types[typeIndex] === "cc.SpriteFrame") {
            GFrameNames[uuid] = `${bundleOutDir}${pathDir}`;
        } else if (types[typeIndex] === "cc.JsonAsset") {
            if (GConfig[uuid]) {
                GConfig[uuid].ttype = types[typeIndex];
                GConfig[uuid].fileout = this.correctPath(`${bundleOutDir}${pathDir}${EXT_MAP[types[typeIndex]]}`);
            } else if (GAnalys[uuid]) {
                GAnalys[uuid].ttype = types[typeIndex];
                GAnalys[uuid].fileout = this.correctPath(`${bundleOutDir}${pathDir}${EXT_MAP[types[typeIndex]]}`);
            } else {
                GConfig[uuid] = GConfig[uuid] || { bundle: bundleName };
                GConfig[uuid].ttype = types[typeIndex];
                GConfig[uuid].fileout = this.correctPath(`${bundleOutDir}${pathDir}${EXT_MAP[types[typeIndex]]}`);
            }
        } else if (types[typeIndex] === "dragonBones.DragonBonesAsset" || types[typeIndex] === "dragonBones.DragonBonesAtlasAsset") {
            GAnalys[uuid] = GAnalys[uuid] || { bundle: bundleName };
            GAnalys[uuid].ttype = types[typeIndex];
            GAnalys[uuid].fileout = this.correctPath(`${bundleOutDir}${pathDir}${EXT_MAP[types[typeIndex]]}`);
        } else {
            GFrameNames[uuid] = `${bundleOutDir}${pathDir}`;
        }
    }

    // 处理未挂在 paths / packs 上的资源
    for (const id in GAnalys) {
        const item = GAnalys[id];
        if (item.bundle === bundleName && !(usedMap[id] || (cfgJson.packs && cfgJson.packs[id]))) {
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
                        const cfg = JSON.parse(GConfig[id].content);
                        pname = cfg[5][0][1];
                    } catch (a) {
                        continue;
                    }
                }

                item.fileout = this.correctPath(`${bundleOutDir}/unkown_particle/${pname}.plist`);
            }

            // 没有类型信息的 mp3，默认当 AudioClip
            if (item.ext === ".mp3") {
                item.ttype = "cc.AudioClip";
                item.fileout = this.correctPath(`${bundleOutDir}/unkown_video/${id}.mp3`);
            }
        }
    }

    this.analysFiles(bundleName, cfgJson);
}

// 分析一个 bundle 内的所有文件
function analysFiles(bundleName, cfgJson) {
    const packs = cfgJson.packs || {};
    const paths = cfgJson.paths || {};
    const uuids = cfgJson.uuids || [];

    this.analysBitmapAndPlist(bundleName, packs, paths, uuids);
    this.analystextureSetter(bundleName, packs, paths, uuids);
    this.analysAnimFrameAtlas(bundleName, packs, paths, uuids);
    this.analysPacksPlist(bundleName, packs, paths, uuids);
    this.analysPathsMaterialAndEffect(bundleName, packs, paths, uuids);
}

module.exports = {
    parseBundleConfig,
    analysFiles,
};
