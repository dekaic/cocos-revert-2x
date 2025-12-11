const fs = require("fs");
const DirUtils = require("./utils/dir-utils");
const { GAnalys, GFrameNames, GMapPlist } = require("./revert-state");

// 拷贝原始文件、生成 skel/json/atlas 等
async function copyFiles() {
    const unkownMap = {};
    const sbineMap = {};

    // 第一轮：有 fileout 的直接 copy；图片但没 fileout 的先统计 path
    for (const key in GAnalys) {
        const item = GAnalys[key];
        let out = item.fileout;

        if (out && item.filein) {
            out = out.replace(/\\/g, "/");
            if (!out.includes(".prefab")) {
                // 避免 sbine 重名
                const mappedOut = sbineMap[out] ? out.replace("unkown_sbine", `unkown_sbine/${key}`) : out;
                sbineMap[mappedOut] = key;
                out = mappedOut;

                const arr = out.split("/");
                arr.pop();
                await DirUtils.dirExists(arr.join("/"));
                fs.copyFileSync(item.filein, out);
            }
        } else if (item.filein && this.isPicture(item.ext)) {
            let unkownPath = this.correctPath(`${this.dirOut}${item.bundle}/unkown/${key}`);

            if (item.frames) {
                let count = 0;
                let lastName = "";
                for (const fname in item.frames) {
                    count++;
                    lastName = fname;
                }
                if (count === 1) {
                    unkownPath = this.correctPath(`${this.dirOut}${item.bundle}/unkown/${lastName}`);
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
    for (const key in GAnalys) {
        const item2 = GAnalys[key];
        let out2 = item2.fileout;

        if (!out2 && item2.filein && this.isPicture(item2.ext) && item2.frames) {
            let unkownPath = this.correctPath(`${this.dirOut}${item2.bundle}/unkown/${key}`);

            if (item2.frames) {
                let count = 0;
                let lastName = "";
                for (const fname2 in item2.frames) {
                    count++;
                    lastName = fname2;
                }
                if (count === 1) {
                    unkownPath = this.correctPath(`${this.dirOut}${item2.bundle}/unkown/${lastName}`);
                }
            }

            if (!unkownMap[unkownPath]) {
                console.log();
            }
            item2.fileout = this.correctPath(unkownMap[unkownPath].path + unkownMap[unkownPath].ext);
            if (unkownMap[unkownPath].count > 1) {
                item2.fileout = this.correctPath(`${unkownMap[unkownPath].path}/${key}${unkownMap[unkownPath].ext}`);
            }

            const arr2 = item2.fileout.replace(/\\/g, "/").split("/");
            arr2.pop();
            await DirUtils.dirExists(arr2.join("/"));
            fs.copyFileSync(item2.filein, item2.fileout);
        }
    }

    // 第三轮：处理 sbines（spine/dragonBones）
    for (const key in GAnalys) {
        const item3 = GAnalys[key];
        let out3 = item3.fileout;

        if (!item3.sbines) continue;

        try {
            if (!out3) {
                if (GFrameNames[key]) {
                    if (item3.ext === ".bin") {
                        item3.fileout = this.correctPath(`${GFrameNames[key]}.skel`);
                    } else {
                        item3.fileout = this.correctPath(`${GFrameNames[key]}.json`);
                    }
                    out3 = item3.fileout;
                } else {
                    if (!item3.sbines.skname) {
                        console.log("sbine new out = ", out3);
                        continue;
                    }
                    out3 =
                        item3.ext === ".bin"
                            ? this.correctPath(`${this.dirOut}${item3.bundle}/unkown_sbine/${item3.sbines.skname}.skel`)
                            : this.correctPath(`${this.dirOut}${item3.bundle}/unkown_sbine/${item3.sbines.skname}.json`);
                }
            }

            const mappedOut3 = sbineMap[out3] ? out3.replace("unkown_sbine", `unkown_sbine/${key}`) : out3;
            sbineMap[mappedOut3] = key;
            out3 = mappedOut3;

            if (item3.ext === ".bin") {
                const arr3 = out3.replace(/\\/g, "/").split("/");
                arr3.pop();
                await DirUtils.dirExists(arr3.join("/"));

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
                const arr4 = out3.split("/");
                arr4.pop();
                await DirUtils.dirExists(arr4.join("/"));

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
}

// 生成 JsonAsset 对应的普通 json 文件及 meta
async function newJsonFiles() {
    for (const [uuid, item] of Object.entries(GAnalys)) {
        if (item.ttype === "cc.JsonAsset") {
            const json = JSON.parse(item.content);
            if (!item.fileout) {
                item.fileout = this.correctPath(`${this.dirOut}${item.bundle}/unkown_json/${json[5][0][1]}.json`);
            }

            const outPath = item.fileout.replace(/\\/g, "/");
            const arr = outPath.split("/");
            arr.pop();
            await DirUtils.dirExists(arr.join("/"));

            let jsonContent = "";
            jsonContent = Array.isArray(json) ? JSON.stringify(json[5][0][2], null, 2) : JSON.stringify(json.json, null, 2);

            fs.writeFileSync(outPath, jsonContent, { undefined: void 0 }, (e) => {
                e && console.log("copyFiles err:", e);
            });

            const metaJson = {
                ver: "1.0.2",
                uuid,
                importer: "json",
                subMetas: {},
            };
            const metaStr = JSON.stringify(metaJson, null, 2);
            fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
                e && console.log("copyFiles err:", e);
            });
        }
    }
}

// 生成 dragonBones 相关 json + meta
async function newDragonJsonFiles() {
    for (const [uuid, item] of Object.entries(GAnalys)) {
        if (item.ttype !== "dragonBones.DragonBonesAsset" && item.ttype !== "dragonBones.DragonBonesAtlasAsset") {
            continue;
        }

        const json = JSON.parse(item.content);
        if (!item.fileout) {
            item.fileout = this.correctPath(`${this.dirOut}${item.bundle}/unkown_json/${json[5][0][1]}.json`);
        }

        const outPath = item.fileout.replace(/\\/g, "/");
        const arr = outPath.split("/");
        arr.pop();
        await DirUtils.dirExists(arr.join("/"));

        let jsonContent = "";
        jsonContent = Array.isArray(json) ? json[5][0][2] : JSON.stringify(json.json, null, 2);

        fs.writeFileSync(outPath, jsonContent, { undefined: void 0 }, (e) => {
            e && console.log("copyFiles err:", e);
        });

        const metaJson = {
            ver: "1.0.2",
            uuid,
            subMetas: {},
        };
        const metaStr = JSON.stringify(metaJson, null, 2);
        fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
            e && console.log("copyFiles err:", e);
        });
    }
}

// 生成 TextAsset 文本及 meta
async function newTextFiles() {
    for (const [uuid, item] of Object.entries(GAnalys)) {
        if (item.ttype === "cc.TextAsset") {
            const outPath = item.fileout.replace(/\\/g, "/");
            const arr = outPath.split("/");
            arr.pop();
            await DirUtils.dirExists(arr.join("/"));

            const content = JSON.parse(item.content)[5][0][2] || "";
            fs.writeFileSync(outPath, content, { undefined: void 0 }, (e) => {
                e && console.log("copyFiles err:", e);
            });

            const metaJson = {
                ver: "1.0.1",
                importer: "text",
                uuid,
                subMetas: {},
            };
            const metaStr = JSON.stringify(metaJson, null, 2);
            fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
                e && console.log("copyFiles err:", e);
            });
        }
    }
}

// 生成 .effect 文件及 meta
async function newEffectFiles(uuid, item) {
    const effectData = item.material.effect;
    const props = item.material.props;
    let effectName = "";
    let techniques = null;

    // 从 props 中解析 _name / shaders / techniques 等
    for (let i = 0; i < props.length; i++) {
        if (props[i] === "_name") {
            const idx = i + 1;
            effectName = effectData[idx];
            const lastSlash = effectName.lastIndexOf("/");
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
        const inputJson = item.material.effect[2][i];
        const names = inputJson.name.split("|");
        const vertName = names[1].split(":")[0];
        const fragName = names[2].split(":")[0];

        if (inputJson.glsl3) {
            out =
                `${out}CCProgram ${vertName} %{\n` +
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

    let outPath = item.pathdir
        ? `${this.dirOut}${item.bundle}/${item.pathdir}.effect`
        : GFrameNames[uuid]
        ? this.correctPath(`${GFrameNames[uuid]}.effect`)
        : `${this.dirOut}${item.bundle}/unkown_effect/${effectName}.effect`;

    outPath = outPath.replace(/\\/g, "/");
    const arr = outPath.split("/");
    arr.pop();
    await DirUtils.dirExists(arr.join("/"));

    fs.writeFileSync(outPath, out, { undefined: void 0 }, (e) => {
        e && console.log("copyFiles err:", e);
    });

    const metaJson = {
        ver: "1.0.27",
        uuid,
        importer: "effect",
        compiledShaders: [{ glsl1: item.material.effect[2][0].glsl1, glsl3: item.material.effect[2][0].glsl3 }],
        subMetas: {},
    };
    const metaStr = JSON.stringify(metaJson, null, 2);
    fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
        e && console.log("copyFiles err:", e);
    });
}

// 生成 .mtl 材质文件及 meta
async function newMaterialFiles() {
    for (const [uuid, item] of Object.entries(GAnalys)) {
        if (item.material) {
            if (item.material.effect) {
                await this.newEffectFiles(uuid, item);
            }

            if (!item.material.mtls) continue;

            for (let i = 0; i < item.material.mtls.length; i++) {
                const mtlRef = item.material.mtls[i];
                const materialObj = {
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

                let outPath = pathdir
                    ? this.correctPath(`${this.dirOut}${item.bundle}/${pathdir}.mtl`)
                    : GFrameNames[mtlRef.mtluuid]
                    ? this.correctPath(`${GFrameNames[mtlRef.mtluuid]}.mtl`)
                    : `${this.dirOut}${item.bundle}/unkown_effect/${mtlRef.mtl[1]}.mtl`;

                outPath = outPath.replace(/\\/g, "/");
                const arr = outPath.split("/");
                arr.pop();
                await DirUtils.dirExists(arr.join("/"));

                const content = JSON.stringify(materialObj, null, 2);
                fs.writeFileSync(outPath, content, { undefined: void 0 }, (e) => {
                    e && console.log("copyFiles err:", e);
                });

                const metaJson = {
                    ver: "1.0.5",
                    uuid: mtlRef.mtluuid,
                    importer: "material",
                    dataAsSubAsset: null,
                    subMetas: {},
                };
                const metaStr = JSON.stringify(metaJson, null, 2);
                fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
                    e && console.log("copyFiles err:", e);
                });
            }
        }
    }
}

// 生成 TTF 模板文件及 meta
async function newTTFFiles() {
    for (const [uuid, item] of Object.entries(GAnalys)) {
        if (item.ttype === "cc.TTFFont") {
            if (!item.fileout) {
                const name = item.ttfname || uuid;
                item.fileout = this.correctPath(`${this.dirOut}${item.bundle}/unkown_ttf/${name}.ttf`);
            }
            const outPath = item.fileout.replace(/\\/g, "/");
            const arr = outPath.split("/");
            arr.pop();
            await DirUtils.dirExists(arr.join("/"));

            if (!item.content) {
                item.content = fs.readFileSync("ttf_template.TTF");
            }
            fs.writeFileSync(outPath, item.content, { undefined: void 0 }, (e) => {
                e && console.log("copyFiles err:", e);
            });

            const metaJson = {
                ver: "1.1.2",
                uuid,
                importer: "ttf-font",
                subMetas: {},
            };
            const metaStr = JSON.stringify(metaJson, null, 2);
            fs.writeFileSync(outPath + ".meta", metaStr, { undefined: void 0 }, (e) => {
                e && console.log("copyFiles err:", e);
            });
        }
    }
}

// 生成 AnimationClip .anim 文件
async function newAnimsFiles() {
    for (const [, item] of Object.entries(GAnalys)) {
        try {
            if (!item.spanim) continue;

            const animObj = {
                __type__: "cc.AnimationClip",
                _objFlags: 0,
                _native: "",
                curveData: {},
                events: [],
            };

            for (let i = 0; i < item.props.length; i++) {
                const propName = item.props[i];
                if (propName === "curveData") {
                    let value = item.spanim[i + 1];
                    if (Array.isArray(value)) {
                        value = await this.aniAnimsObjs(value, item.spanim_frames);
                    }
                    if (value) {
                        animObj[propName] = value;
                    }
                } else {
                    animObj[propName] = item.spanim[i + 1];
                }
            }

            const content = JSON.stringify(animObj, null, 2);
            if (!item.fileout) {
                item.fileout = this.correctPath(`${this.dirOut}${item.bundle}/unkown_anim/${item.spanim[1]}.anim`);
            }
            const outPath = item.fileout.replace(/\\/g, "/");
            const arr = outPath.split("/");
            arr.pop();
            await DirUtils.dirExists(arr.join("/"));
            fs.writeFileSync(outPath, content, { undefined: void 0 }, () => {});
        } catch (e) {
            continue;
        }
    }
}

// 解析动画曲线对象（递归结构）
async function aniAnimsObjs(arr, frameUuids) {
    const obj = {};
    let lastKey = "";
    for (let i = 0; i < arr.length; i++) {
        const node = arr[i];
        const ttype = typeof node;
        if (ttype === "object") {
            for (const k in node) obj[k] = node[k];
        } else if (ttype === "string") {
            lastKey = node;
        } else if (node === 8) {
            const val = arr[++i];
            if (val[0] === 4) {
                // Color
                const bin = val[1].toString(2).padStart(32, "0");
                const a = parseInt(bin.slice(0, 8), 2);
                const b = parseInt(bin.slice(8, 16), 2);
                const g = parseInt(bin.slice(16, 24), 2);
                const r = parseInt(bin.slice(24, 32), 2);
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
}

// 解析动画曲线数组
async function aniAnimsArray(info, frameUuids) {
    const result = [];
    let lastKey = "";
    for (let i = 0; i < info[0].length; i++) {
        const node = info[0][i];
        let obj = {};
        const ttype = typeof node;

        if (Array.isArray(node)) {
            for (let j = 0; j < node.length; j++) {
                const item = node[j];
                const ptype = typeof item;
                if (ptype === "object") {
                    for (const k in item) obj[k] = item[k];
                } else if (ptype === "string") {
                    lastKey = item;
                } else if (item === 8) {
                    const val = node[++j];
                    if (val[0] === 4) {
                        const bin = val[1].toString(2).padStart(32, "0");
                        const a = parseInt(bin.slice(0, 8), 2);
                        const b = parseInt(bin.slice(8, 16), 2);
                        const g = parseInt(bin.slice(16, 24), 2);
                        const r = parseInt(bin.slice(24, 32), 2);
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
}

// 生成 BitmapFont 的 fnt 文件
async function newFontsFiles() {
    for (const [, item] of Object.entries(GAnalys)) {
        if (!item.bitmap || !item.frames) continue;

        try {
            for (const [, frame] of Object.entries(item.frames)) {
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
                for (const charId in item.bitmap.info.fontDefDictionary) {
                    count++;
                    const def = item.bitmap.info.fontDefDictionary[charId];
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
                const fntContent = header + charsStr;

                let outPath = item.bitmap.fileout;
                outPath =
                    outPath ||
                    (GFrameNames[item.bitmap.fntuuid]
                        ? this.correctPath(`${GFrameNames[item.bitmap.fntuuid]}.fnt`)
                        : this.correctPath(`${this.dirOut}${item.bundle}/unkown/${item.bitmap.name}.fnt`));

                outPath = outPath.replace(/\\/g, "/");
                const arr = outPath.split("/");
                arr.pop();
                await DirUtils.dirExists(arr.join("/"));
                item.bitmap.fileout = this.correctPath(outPath);

                fs.writeFileSync(outPath, fntContent, { undefined: void 0 }, (e) => {
                    e && console.log("copyFiles err:", e);
                });
            }
        } catch (e) {
            continue;
        }
    }
}

// 生成 TexturePacker 风格的 plist 文件
async function newPlistFiles() {
    for (const [uuid, item] of Object.entries(GAnalys)) {
        if (!item.frames) continue;

        const frames = {};
        const meta = {};
        let plistUuid = null;

        for (const name in item.frames) {
            const frame = item.frames[name];
            const fileName = `${frame.name}.png`;
            const node = {};
            const rect = frame.rect;
            const offset = frame.offset;
            const orig = frame.originalSize;

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
            const arr = texName.split("/");
            texName = arr[arr.length - 1];
        }

        meta.frames = frames;
        const metaInfo = { format: 2 };
        metaInfo.realTextureFileName = texName;
        metaInfo.size = `{${item.width},${item.height}}`;
        metaInfo.smartupdate = "$TexturePacker:SmartUpdate:f050e0f5a6de980e0f76806304dfcf8b:1/1$";
        metaInfo.textureFileName = texName;
        meta.metadata = metaInfo;

        const plistStr = this.plistJSONToXML(meta);
        const plistOut = item.fileout.split(".").slice(0, -1).join(".") + ".plist";

        item.plists = item.plists || { uuid: plistUuid };
        item.plists.fileout = this.correctPath(plistOut);

        fs.writeFileSync(plistOut, plistStr, { undefined: void 0 }, (e) => {
            e && console.log("copyFiles err:", e);
        });
    }
}

module.exports = {
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
};
