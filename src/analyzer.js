const { v4: uuidv4 } = require("uuid");
const UuidUtils = require("./utils/uuid-utils")
const { deserialize } = require("./libs/parseclass");
const { GAnalys, GConfig, GFrameNames, GMapPlist, GUnkowns, GAnimMp } = require("./revert-state");

// 分析位图字体和 plist / material / effect / anim 等（来自 packs）
function analysBitmapAndPlist(bundleName, packs, paths, uuids) {
    for (const [packUuid, packIndices] of Object.entries(packs)) {
        try {
            const cfg = GConfig[packUuid] || GAnalys[packUuid];
            if (!cfg) continue;

            const isBitmapFont = cfg.content.includes("fontDefDictionary");
            const effectUuids = [];
            const jsonArray = JSON.parse(cfg.content);
            const arr5 = jsonArray[5];

            // 预扫描
            for (let i = 0; i < arr5.length; i++) {
                arr5[i];
                jsonArray[1][i];
            }

            const itemArr = jsonArray[5];

            // BitmapFont 提取
            if (isBitmapFont) {
                for (let i = 0; i < itemArr.length; i++) {
                    const item = itemArr[i];
                    if (item.length >= 6) {
                        try {
                            if (JSON.stringify(item, null).includes("fontDefDictionary")) {
                                const fontIdx = item[5][0];
                                const pngUuid = UuidUtils.decompressUuid(jsonArray[1][fontIdx]);
                                const fontDef = item[0][0];
                                const fntUuid = uuids[packIndices[i]];

                                GAnalys[pngUuid] = GAnalys[pngUuid] || {
                                    bundle: bundleName,
                                };
                                GAnalys[pngUuid].bitmap = {
                                    name: fontDef[1],
                                    info: fontDef[3],
                                    fntuuid: fntUuid,
                                };

                                console.log(`${pngUuid} has BitmapFont info`);
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
            }

            // 遍历 pack 内每项
            for (let i = 0; i < itemArr.length; i++) {
                const entry = itemArr[i];
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
                        const frameInfo = entry[0][0];
                        const pngUuid = entry[5][0];

                        // SpriteFrame 信息
                        if (this.isAFrame(frameInfo) && this.isPicture(GAnalys[pngUuid].ext)) {
                            console.log(`${pngUuid} has spriteframe info`);
                            frameInfo.name &&
                                frameInfo.name !== "" &&
                                ((GAnalys[pngUuid].frames = GAnalys[pngUuid].frames || {}),
                                (frameInfo.uuid = uuids[packIndices[i]]),
                                GAnalys[pngUuid].frames[frameInfo.name] && (frameInfo.name = `${frameInfo.name}_${frameInfo.uuid}`),
                                (GAnalys[pngUuid].frames[frameInfo.name] = frameInfo),
                                isBitmapFont &&
                                    GAnalys[frameInfo.uuid] &&
                                    GAnalys[frameInfo.uuid].bitmap &&
                                    (GAnalys[pngUuid].bitmap = GAnalys[frameInfo.uuid].bitmap));
                        } else {
                            // 非 spriteframe 的情况，根据 effectNode 类型分支
                            if (Array.isArray(effectNode) && effectNode[0]) {
                                switch (effectNode[0]) {
                                    case "cc.Material": {
                                        if (bundleName !== "internal") {
                                            const texUuid = entry[5][0];
                                            GAnalys[texUuid] = GAnalys[texUuid] || {
                                                bundle: bundleName,
                                            };
                                            GAnalys[texUuid].material = GAnalys[texUuid].material || {};
                                            GAnalys[texUuid].material.mtls = GAnalys[texUuid].material.mtls || [];
                                            GAnalys[texUuid].material.mtls.push({
                                                mtl: entry[0][0],
                                                mtluuid: uuids[packIndices[i]],
                                            });
                                        }
                                        break;
                                    }
                                    case "cc.EffectAsset": {
                                        if (bundleName !== "internal") {
                                            const effectStr = JSON.stringify(entry[0], null);
                                            if (effectStr.includes("glsl3") && effectStr.includes("glsl1")) {
                                                const propsArr = [];
                                                for (let k = 1; k < jsonArray[4][[entry[0][0][0]]].length; k++) {
                                                    effectNode[1][jsonArray[4][[entry[0][0][0]]][k]] &&
                                                        propsArr.push(effectNode[1][jsonArray[4][[entry[0][0][0]]][k]]);
                                                }
                                                const effUuid = uuids[packIndices[i]];
                                                GAnalys[effUuid] = GAnalys[effUuid] || {
                                                    bundle: bundleName,
                                                };
                                                GAnalys[effUuid].material = GAnalys[effUuid].material || {};
                                                GAnalys[effUuid].material.effect = entry[0][0];
                                                GAnalys[effUuid].material.name = entry[0][0][1];
                                                GAnalys[effUuid].material.props = propsArr;
                                                effectUuids.push(effUuid);
                                            }
                                        }
                                        break;
                                    }
                                    case "cc.AnimationClip": {
                                        const animInfo = entry[0][0];
                                        if (typeof animInfo[1] === "string" && animInfo.length >= 4) {
                                            const props = [];
                                            for (let k = 1; k < jsonArray[4][[entry[0][0][0]]].length; k++) {
                                                effectNode[1][jsonArray[4][[entry[0][0][0]]][k]] &&
                                                    props.push(effectNode[1][jsonArray[4][[entry[0][0][0]]][k]]);
                                            }

                                            if (GAnimMp[animInfo[1]]) {
                                                GAnimMp[animInfo[1]].spanim = animInfo;
                                                GAnimMp[animInfo[1]].spanim_frames = entry[5];
                                                GAnimMp[animInfo[1]].props = props;
                                            } else {
                                                const animUuid = uuids[packIndices[i]];
                                                GAnalys[animUuid] = GAnalys[animUuid] || {
                                                    bundle: bundleName,
                                                };
                                                GAnalys[animUuid].spanim = animInfo;
                                                GAnalys[animUuid].spanim_frames = entry[5];
                                                GAnalys[animUuid].props = props;
                                            }
                                        }
                                        break;
                                    }
                                    case "cc.BitmapFont": {
                                        const texUuid2 = entry[5][0];
                                        const fontInfo = entry[0][0];
                                        const fontUuid = uuids[packIndices[i]];
                                        GAnalys[texUuid2] = GAnalys[texUuid2] || {
                                            bundle: bundleName,
                                        };
                                        GAnalys[texUuid2].bitmap = {
                                            name: fontInfo[1],
                                            info: fontInfo[3],
                                            fntuuid: fontUuid,
                                        };
                                        console.log(`${texUuid2} has BitmapFont info`);
                                        break;
                                    }
                                    case "cc.JsonAsset": {
                                        const jsonUuid = uuids[packIndices[i]];
                                        if (!GAnalys[jsonUuid]) {
                                            GAnalys[jsonUuid] = GConfig[jsonUuid] || {
                                                bundle: bundleName,
                                            };
                                            delete GConfig[jsonUuid];
                                            GAnalys[jsonUuid].ttype = "cc.JsonAsset";
                                            entry[5] = entry[0];
                                            GAnalys[jsonUuid].content = JSON.stringify(entry, null, 2);
                                            console.log(`${jsonUuid} has json info`);
                                        }
                                        break;
                                    }
                                    case "cc.TextAsset": {
                                        const textUuid = uuids[packIndices[i]];
                                        if (!GAnalys[textUuid]) {
                                            GAnalys[textUuid] = GConfig[textUuid] || {
                                                bundle: bundleName,
                                            };
                                            delete GConfig[textUuid];
                                            GAnalys[textUuid].ttype = "cc.TextAsset";
                                            entry[5] = entry[0];
                                            GAnalys[textUuid].fileout = this.correctPath(`${this.dirOut}${bundleName}/unkown_text/${entry[5][0][1]}.txt`);
                                            GAnalys[textUuid].content = JSON.stringify(entry, null, 2);
                                            console.log(`${textUuid} has text info`);
                                        }
                                        break;
                                    }
                                    case "dragonBones.DragonBonesAtlasAsset": {
                                        const dbAtlasUuid = uuids[packIndices[i]];
                                        GAnalys[dbAtlasUuid] = GAnalys[dbAtlasUuid] || {
                                            bundle: bundleName,
                                        };
                                        GAnalys[dbAtlasUuid].ttype = "dragonBones.DragonBonesAtlasAsset";
                                        entry[5] = entry[0];
                                        GAnalys[dbAtlasUuid].content = JSON.stringify(entry, null, 2);
                                        console.log(`${dbAtlasUuid} has dragonBones.DragonBonesAtlasAsset info`);
                                        break;
                                    }
                                    case "dragonBones.DragonBonesAsset": {
                                        const dbAssetUuid = uuids[packIndices[i]];
                                        GAnalys[dbAssetUuid] = GAnalys[dbAssetUuid] || {
                                            bundle: bundleName,
                                        };
                                        GAnalys[dbAssetUuid].ttype = "dragonBones.DragonBonesAsset";
                                        entry[5] = entry[0];
                                        GAnalys[dbAssetUuid].content = JSON.stringify(entry, null, 2);
                                        console.log(`${dbAssetUuid} has dragonBones.DragonBonesAsset info`);
                                        break;
                                    }
                                    case "cc.SpriteAtlas": {
                                        const atlasUuid = uuids[packIndices[i]];
                                        for (let k = 0; k < entry[5].length; k++) {
                                            GMapPlist[entry[5][k]] = atlasUuid;
                                        }
                                        break;
                                    }
                                    default:
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
}

// 从 material/effect 的 json 内容中提取类型
function analysPathsMaterialAndEffect(bundleName, packs, paths, uuids) {
    // 先标记 Material / EffectAsset 类型
    for (const key in GAnalys) {
        const item = GAnalys[key];
        try {
            if (item.bundle === bundleName && bundleName !== "internal" && item.content) {
                const json = JSON.parse(item.content);
                const obj = deserialize(json);
                if (obj.__cid__ === "cc.Material" || obj.__cid__ === "cc.EffectAsset") {
                    item.ttype = obj.__cid__;
                }
            }
        } catch (e) {
            continue;
        }
    }

    // TTF 解析
    for (const cid in GConfig) {
        const cfg = GConfig[cid];
        let obj;
        if (GAnalys[cid]) {
            try {
                if (cfg.bundle === bundleName && bundleName !== "internal" && cfg.content) {
                    const json = JSON.parse(cfg.content);
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

    // Material / EffectAsset 关联纹理
    for (const key in GAnalys) {
        const item = GAnalys[key];
        try {
            if (item.bundle === bundleName && bundleName !== "internal") {
                if (item.ttype === "cc.Material") {
                    const json = JSON.parse(item.content);
                    const texUuid = UuidUtils.decompressUuid(json[1][0]);
                    GAnalys[texUuid] = GAnalys[texUuid] || {
                        bundle: bundleName,
                    };
                    GAnalys[texUuid].material = GAnalys[texUuid].material || {};
                    GAnalys[texUuid].material.mtls = GAnalys[texUuid].material.mtls || [];
                    GAnalys[texUuid].material.mtls.push({
                        mtl: json[5][0],
                        mtluuid: key,
                    });
                } else if (item.ttype === "cc.EffectAsset") {
                    const propsArr2 = [];
                    const json2 = JSON.parse(item.content);
                    for (let i = 0; i < json2[1].length; i++) {
                        json2[1][i] = UuidUtils.decompressUuid(json2[1][i]);
                    }
                    for (let i = 0; i < json2[2].length; i++) {
                        json2[2][i];
                        json2[1][i];
                    }
                    const effectNode = json2[3][json2[4][json2[5][0][0]][0]];
                    for (let i = 1; i < json2[4][json2[5][0][0]].length; i++) {
                        effectNode[1][json2[4][json2[5][0][0]][i]] && propsArr2.push(effectNode[1][json2[4][json2[5][0][0]][i]]);
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
}

// 解析 packs 中的 plist 信息，补全 spriteFrame 的 uuid
function analysPacksPlist(bundleName, packs, paths, uuids) {
    for (const [packUuid, packIndices] of Object.entries(packs)) {
        try {
            const packItem = GAnalys[packUuid];
            if (!packItem) continue;

            const json = JSON.parse(packItem.content);
            const map = {};
            for (let i = 0; i < json[2].length; i++) {
                map[json[2][i]] = json[1][i];
            }

            const arr5 = json[5];
            for (let i = 0; i < arr5.length; i++) {
                const entry = arr5[i];
                try {
                    if (Array.isArray(entry[0]) && Array.isArray(entry[0][0])) {
                        const v = entry[0][0];
                        if (typeof v[1] === "string" && v[1].includes(".plist")) {
                            const texUuid = UuidUtils.decompressUuid(map._textureSetter);
                            if (GAnalys[texUuid] && GAnalys[texUuid].frames) {
                                for (const name in map) {
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
}

// 解析 spriteFrame / SpriteAtlas / AnimationClip / sp.SkeletonData 等
function analysAnimFrameAtlas(bundleName, packs, paths, uuids) {
    for (const key in GAnalys) {
        const item = GAnalys[key];

        if (item.bundle !== bundleName) continue;

        // SpriteFrame json 直接对应单张纹理
        if (item.ttype === "cc.SpriteFrame") {
            try {
                const json = JSON.parse(item.content);
                const texUuid = UuidUtils.decompressUuid(json[1][0]);
                if (GAnalys[texUuid]) {
                    const frame = json[5][0];
                    let frameName = frame.name;
                    GAnalys[texUuid].frames = GAnalys[texUuid].frames || {};
                    if (this.isPicture(GAnalys[texUuid].ext)) {
                        console.log(`${texUuid} has spriteframe info`);
                        console.log(`${texUuid} ${GAnalys[texUuid].ttype}`);
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
                const json2 = JSON.parse(item.content);
                const map = {};
                for (let i = 0; i < json2[2].length; i++) {
                    map[json2[2][i]] = json2[1][i];
                }
                const first = json2[5][0];

                if (typeof first[1] === "string" && first[1].includes(".plist")) {
                    // plist + TexturePacker
                    const texUuid = UuidUtils.decompressUuid(json2[1][0]);
                    if (GAnalys[texUuid]) {
                        const plistJson = JSON.parse(GAnalys[texUuid].content);
                        const pngUuid = UuidUtils.decompressUuid(plistJson[1][0]);
                        if (GAnalys[pngUuid]) {
                            let framesArr = plistJson[5];
                            if (Array.isArray(plistJson[5][0])) {
                                framesArr = plistJson[5][0];
                            }

                            for (let i = 0; i < framesArr.length; i++) {
                                try {
                                    const frame = framesArr[i];
                                    const texId = pngUuid;

                                    if (this.isPicture(GAnalys[texId].ext)) {
                                        console.log(`${texId} has spriteframe info`);
                                        console.log(`${texId} ${GAnalys[texId].ttype}`);

                                        frame.name &&
                                            frame.name !== "" &&
                                            ((GAnalys[texId].frames = GAnalys[texId].frames || {}),
                                            (frame.uuid = UuidUtils.decompressUuid(map[frame.name])),
                                            GAnalys[texId].frames[frame.name] && (frame.name = `${frame.name}_${frame.uuid}`),
                                            (GAnalys[texId].frames[frame.name] = frame));

                                        for (const fname in GAnalys[texId].frames) {
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
                        let pngName = item.fileout.replace(".plist", "");
                        for (const texId in GAnalys) {
                            if (GAnalys[texId].fileout && GAnalys[texId].fileout.includes(pngName)) {
                                if (GAnalys[texId].frames) {
                                    for (const fname in GAnalys[texId].frames) {
                                        if (GAnalys[texId].frames[fname] && map[fname]) {
                                            let name = fname;
                                            const uuid = UuidUtils.decompressUuid(map[fname]);
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
                        const frameName = json2[2][i];
                        const uuid = UuidUtils.decompressUuid(json2[1][i]);
                        if (GUnkowns[uuid] && (pngItem = GAnalys[GUnkowns[uuid].uuid])) {
                            if (!pngItem.fileout) {
                                pngItem.fileout = item.fileout.replace(".plist", pngItem.ext);
                            }
                            if (pngItem.frames) {
                                const frameData = pngItem.frames[frameName];
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
                const json3 = JSON.parse(item.content);
                item.spanim = json3[5][0];
                if (json3[10]) {
                    for (let i = 0; i < json3[10].length; i++) {
                        json3[10][i] = UuidUtils.decompressUuid(json3[1][json3[10][i]]);
                    }
                    item.spanim_frames = json3[10];
                }
                const propsArr = [];
                for (let i = 0; i < json3[1].length; i++) {
                    json3[1][i] = UuidUtils.decompressUuid(json3[1][i]);
                }
                for (let i = 0; i < json3[2].length; i++) {
                    json3[2][i];
                    json3[1][i];
                }
                const node = json3[3][json3[4][json3[5][0][0]][0]];
                for (let i = 1; i < json3[4][json3[5][0][0]].length; i++) {
                    node[1][json3[4][json3[5][0][0]][i]] && propsArr.push(node[1][json3[4][json3[5][0][0]][i]]);
                }
                item.props = propsArr;
            } catch (e) {
                continue;
            }
        }

        // sp.SkeletonData / DragonBones 等二进制数据处理
        if (item.sbines) {
            const sbData = item.sbines.datas;
            if (Array.isArray(sbData) && sbData.length > 5) {
                for (let i = 0; i < sbData[5].length; i++) {
                    try {
                        let sbItem = sbData[5][i];
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

                        while (Array.isArray(sbItem[0])) {
                            sbItem = sbItem[0];
                        }

                        if (
                            (sbItem[1].includes("Dragon_circle_light") && console.log(),
                            typeof sbItem[0] === "number" && typeof sbItem[1] === "string" && typeof sbItem[2] === "string")
                        ) {
                            let nameIndex = 3;
                            let jsonIndex = 4;
                            let ok = false;

                            if (Array.isArray(sbItem[nameIndex]) && typeof sbItem[jsonIndex] === "object" && Array.isArray(sbItem[5])) {
                                ok = true;
                            } else if (typeof sbItem[3] === "number" && Array.isArray(sbItem[4]) && typeof sbItem[5] === "object") {
                                nameIndex = 4;
                                jsonIndex = 5;
                                ok = true;
                            }

                            if (ok) {
                                // json / png 组合形式
                                let owner = item;
                                if (packs[key]) {
                                    const newUuid = uuids[packs[key][i]];
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
                                    const pngItem = GAnalys[pngUuids[j]];
                                    if (pngItem && !pngItem.fileout) {
                                        pngItem.fileout = this.correctPath(`${this.dirOut}${pngItem.bundle}/unkown_sbine/${sbItem[nameIndex][j]}`);
                                        console.log("pngfile.fileout = ", pngItem.fileout);
                                        if (!pngItem.frames) {
                                            pngItem.frames = [];
                                            pngItem.frames[sbItem[nameIndex][j]] = {
                                                name: sbItem[nameIndex][j],
                                                unkown_uuid: uuidv4(),
                                                rotated: false,
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
                                        const newUuid2 = uuids[packs[key][i]];
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
                                    }

                                    for (let j = 0; j < pngUuids.length; j++) {
                                        const pngItem2 = GAnalys[pngUuids[j]];
                                        if (pngItem2 && !pngItem2.fileout) {
                                            if (sbItem[5][j].includes(".")) {
                                                pngItem2.fileout = this.correctPath(`${this.dirOut}${pngItem2.bundle}/unkown_sbine/${sbItem[5][j]}`);
                                            } else {
                                                pngItem2.fileout = this.correctPath(`${this.dirOut}${pngItem2.bundle}/unkown_sbine/${owner.sbines.skname}${pngItem2.ext}`);
                                            }

                                            console.log("pngfile.fileout = ", pngItem2.fileout);

                                            if (!pngItem2.frames) {
                                                pngItem2.frames = [];
                                                pngItem2.frames[sbItem[5][j]] = {
                                                    name: sbItem[5][j],
                                                    unkown_uuid: uuidv4(),
                                                    rotated: false,
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
}

// 解析 _textureSetter 结构，建立纹理与 frame 的绑定
function analystextureSetter(bundleName, packs, paths, uuids) {
    // 先处理 GConfig 中的 json
    for (const cid in GConfig) {
        const cfg = GConfig[cid];
        if (cfg.bundle === bundleName && cfg.ext === ".json") {
            try {
                if (cfg.content.includes("_textureSetter")) {
                    const json = JSON.parse(cfg.content);
                    for (let i = 0; i < json[5].length; i++) {
                        const frame = json[5][i];
                        if (!this.isAFrame(frame)) continue;

                        if (GAnalys[json[1][0]]) {
                            const texUuid = json[1][0];
                            if (this.isPicture(GAnalys[texUuid].ext)) {
                                GAnalys[texUuid].frames = GAnalys[texUuid].frames || {};
                                GAnalys[texUuid].frames[frame.name] && (frame.name = `${frame.name}_${cid}`);
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
                            const texUuid2 = UuidUtils.decompressUuid(json[1][0]);
                            if (this.isPicture(GAnalys[texUuid2].ext)) {
                                GAnalys[texUuid2].frames = GAnalys[texUuid2].frames || {};
                                GAnalys[texUuid2].frames[frame.name] && (frame.name = `${frame.name}_${cid}`);
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
    for (const key in GAnalys) {
        const item = GAnalys[key];
        if (item.bundle === bundleName && item.ext === ".json") {
            try {
                if (item.content.includes("_textureSetter")) {
                    const json = JSON.parse(item.content);
                    for (let i = 0; i < json[5].length; i++) {
                        const frame = json[5][i];
                        if (!this.isAFrame(frame)) continue;

                        const texUuid = json[1][0];
                        if (GAnalys[texUuid]) {
                            if (this.isPicture(GAnalys[texUuid].ext)) {
                                GAnalys[texUuid].frames = GAnalys[texUuid].frames || {};
                                GAnalys[texUuid].frames[frame.name] && (frame.name = `${frame.name}_${key}`);
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
                            const texUuid2 = UuidUtils.decompressUuid(json[1][0]);
                            if (GAnalys[texUuid2] && this.isPicture(GAnalys[texUuid2].ext)) {
                                GAnalys[texUuid2].frames = GAnalys[texUuid2].frames || {};
                                GAnalys[texUuid2].frames[frame.name] && (frame.name = `${frame.name}_${key}`);
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
    for (const key2 in GAnalys) {
        const item2 = GAnalys[key2];
        if (item2.bundle === bundleName && item2.ext === ".json") {
            try {
                if (item2.content.includes("fontDefDictionary")) {
                    const json2 = JSON.parse(item2.content);
                    for (let i = 0; i < json2[5].length; i++) {
                        const fontInfo = json2[5][i];
                        const fontTexUuid = UuidUtils.decompressUuid(json2[1][0]);
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
}

module.exports = {
    analysBitmapAndPlist,
    analysPathsMaterialAndEffect,
    analysPacksPlist,
    analysAnimFrameAtlas,
    analystextureSetter,
};
