import * as fs from "fs";
import { dir } from "../utils/fs-dir";
import { v4 as uuidv4 } from "uuid";

// 外部全局变量声明，根据实际项目补充具体类型
declare const GAnalys: any;
declare const GMapPlist: any;
declare const GMapFrame: any;
declare const GMapSubs: any;

export class Meta {
    private revertObj: any = null;

    // 入口函数：生成所有 meta 和 map* json
    async newMetaFiles(e: any): Promise<void> {
        this.revertObj = e;

        await this.newMetaPng();
        await this.newMetaFnt();
        await this.newMetaPlist();
        await this.newMetaAtlas();
        await this.newMetaSbine();
        await this.newMetaAnims();
        await this.newMetaAsset();
        await this.newMetaVideo();
        await this.newMetaParticle();

        try {
            let t = JSON.stringify(GMapPlist, null, 2);
            fs.writeFileSync(e.dirOut + "mapplist.json", t);

            t = JSON.stringify(GMapFrame, null, 2);
            fs.writeFileSync(e.dirOut + "mapframe.json", t);

            if (GMapSubs.internal) {
                if (GMapSubs.third) {
                    GMapSubs.third = GMapSubs.internal - 1;
                } else if (GMapSubs.main) {
                    GMapSubs.main = GMapSubs.internal - 1;
                }
            }

            t = JSON.stringify(GMapSubs, null, 2);
            fs.writeFileSync(e.dirOut + "mapsubs.json", t);
        } catch (err) {
            console.log("newMetaFiles err:", err);
        }
    }

    // 普通 Asset / BufferAsset
    async newMetaAsset(): Promise<void> {
        for (const uuid in GAnalys) {
            const t = GAnalys[uuid];

            if (t.ttype === "cc.Asset") {
                const meta = { ver: "1.0.3", uuid, importer: "asset", subMetas: {} as Record<string, any> };
                const metaPath = t.fileout + ".meta";
                const arr = metaPath.replace(/\\/g, "/").split("/");
                arr.pop();
                await dir.dirExists(arr.join("/"));
                const json = JSON.stringify(meta, null, 2);
                console.log("create Asset.meta = ", metaPath);
                try {
                    fs.writeFileSync(metaPath, json);
                } catch (err) {
                    console.log("newMetaAsset err:", err);
                }
            } else if (t.ttype === "cc.BufferAsset") {
                const meta = { ver: "1.0.2", uuid, importer: "buffer", subMetas: {} as Record<string, any> };
                const metaPath = t.fileout + ".meta";
                const arr = metaPath.replace(/\\/g, "/").split("/");
                arr.pop();
                await dir.dirExists(arr.join("/"));
                const json = JSON.stringify(meta, null, 2);
                console.log("create BufferAsset.meta = ", metaPath);
                try {
                    fs.writeFileSync(metaPath, json);
                } catch (err) {
                    console.log("newMetaAsset err:", err);
                }
            }
        }
    }

    // 粒子
    async newMetaParticle(): Promise<void> {
        for (const uuid in GAnalys) {
            const t = GAnalys[uuid];

            if (t.ttype === "cc.ParticleAsset") {
                const meta = { ver: "2.0.3", uuid, importer: "particle", subMetas: {} as Record<string, any> };
                const metaPath = t.fileout + ".meta";
                const arr = metaPath.replace(/\\/g, "/").split("/");
                arr.pop();
                await dir.dirExists(arr.join("/"));
                const json = JSON.stringify(meta, null, 2);
                console.log("create cc.ParticleAsset.meta = ", metaPath);
                try {
                    fs.writeFileSync(metaPath, json);
                } catch (err) {
                    console.log("newMetaParticle err:", err);
                }
            }
        }
    }

    // 音频（原代码叫 video，其实是 AudioClip）
    async newMetaVideo(): Promise<void> {
        for (const uuid in GAnalys) {
            const t = GAnalys[uuid];

            if (t.ttype === "cc.AudioClip") {
                const meta = {
                    ver: "2.0.3",
                    uuid,
                    importer: "audio-clip",
                    downloadMode: 0,
                    duration: 1,
                    subMetas: {} as Record<string, any>,
                };
                const metaPath = t.fileout + ".meta";
                const arr = metaPath.replace(/\\/g, "/").split("/");
                arr.pop();
                await dir.dirExists(arr.join("/"));
                const json = JSON.stringify(meta, null, 2);
                console.log("create audio.meta = ", metaPath);
                try {
                    fs.writeFileSync(metaPath, json);
                } catch (err) {
                    console.log("newMetaVideo err:", err);
                }
            }
        }
    }

    // 动画 clip
    async newMetaAnims(): Promise<void> {
        for (const uuid in GAnalys) {
            const t = GAnalys[uuid];

            if (t.spanim) {
                const meta = {
                    ver: "2.1.2",
                    uuid,
                    importer: "animation-clip",
                    subMetas: {} as Record<string, any>,
                };
                const metaPath = t.fileout + ".meta";
                const arr = metaPath.replace(/\\/g, "/").split("/");
                arr.pop();
                await dir.dirExists(arr.join("/"));
                const json = JSON.stringify(meta, null, 2);
                console.log("create anim.meta = ", metaPath);
                try {
                    fs.writeFileSync(metaPath, json);
                } catch (err) {
                    console.log("newMetaAnims err:", err);
                }
            }
        }
    }

    // Spine 相关 meta（json + atlas）
    async newMetaSbine(): Promise<void> {
        for (const uuid in GAnalys) {
            const t = GAnalys[uuid];

            if (!t.sbines) continue;

            const spineMeta = {
                ver: "1.2.5",
                uuid,
                importer: "spine",
                textures: t.sbines.pnguuid,
                scale: 1,
                subMetas: {} as Record<string, any>,
            };

            if (t.fileout_jsons) {
                let metaPath = t.fileout_jsons + ".meta";
                let json = JSON.stringify(spineMeta, null, 2);
                try {
                    fs.writeFileSync(metaPath, json);
                } catch (err) {
                    console.log("newMetaSbine err:", err);
                }

                if (t.fileout_atlas) {
                    metaPath = t.fileout_atlas + ".meta";
                    if (fs.existsSync(metaPath)) {
                        console.log("newMetaSbine atlas.meta exists:", metaPath);
                    } else {
                        const atlasMeta = {
                            ver: "1.0.3",
                            uuid: uuidv4(),
                            importer: "asset",
                            subMetas: {} as Record<string, any>,
                        };
                        json = JSON.stringify(atlasMeta, null, 2);
                        try {
                            fs.writeFileSync(metaPath, json);
                        } catch (err) {
                            console.log("newMetaSbine err:", err);
                        }
                    }
                } else {
                    console.log("newMetaSbine err:");
                }
            }
        }
    }

    // .atlas 纯资源
    async newMetaAtlas(): Promise<void> {
        for (const uuid in GAnalys) {
            const t = GAnalys[uuid];

            if (t.ext === ".atlas" && t.fileout) {
                const meta = { ver: "1.0.3", uuid, importer: "asset", subMetas: {} as Record<string, any> };
                const json = JSON.stringify(meta, null, 2);
                const metaPath = t.fileout + ".meta";
                try {
                    fs.writeFileSync(metaPath, json);
                } catch (err) {
                    console.log("newMetaAtlas err:", err);
                }
            }
        }
    }

    // plist 图集
    async newMetaPlist(): Promise<void> {
        for (const rawTextureUuid in GAnalys) {
            const t = GAnalys[rawTextureUuid];

            if (!t.plists || !t.plists.fileout) continue;

            const atlasUuid = t.plists.uuid || uuidv4();
            const meta: any = {
                ver: "1.2.6",
                uuid: atlasUuid,
                importer: "sprite-atlas",
                rawTextureUuid,
                size: { width: t.width, height: t.height },
                type: "Texture Packer",
                subMetas: {} as Record<string, any>,
            };

            for (const key in t.frames) {
                const s = t.frames[key];
                const n = s.name + ".png";

                s.uuid = s.uuid || s.unkown_uuid;
                if (s.uuid) {
                    meta.subMetas[n] = {
                        ver: "1.0.6",
                        uuid: s.uuid,
                        importer: "sprite-frame",
                        rawTextureUuid,
                        trimType: "auto",
                        trimThreshold: 1,
                        rotated: !!s.rotated,
                        offsetX: s.offset[0],
                        offsetY: s.offset[1],
                        trimX: s.rect[0],
                        trimY: s.rect[1],
                        width: s.rect[2],
                        height: s.rect[3],
                        rawWidth: s.originalSize[0],
                        rawHeight: s.originalSize[1],
                        borderTop: s.capInsets[1],
                        borderBottom: s.capInsets[3],
                        borderLeft: s.capInsets[0],
                        borderRight: s.capInsets[2],
                        spriteType: "normal",
                        subMetas: {} as Record<string, any>,
                    };

                    GMapPlist[s.uuid] = atlasUuid;
                    GMapFrame[s.uuid] = rawTextureUuid;
                } else {
                    console.log();
                }
            }

            const json = JSON.stringify(meta, null, 2);
            const metaPath = t.plists.fileout + ".meta";
            try {
                fs.writeFileSync(metaPath, json);
            } catch (err) {
                console.log("newMetaPlist err:", err);
            }
        }
    }

    // 位图字体
    async newMetaFnt(): Promise<void> {
        for (const textureUuid in GAnalys) {
            const t = GAnalys[textureUuid];

            if (t.bitmap && t.frames) {
                try {
                    const meta = {
                        ver: "2.1.2",
                        uuid: t.bitmap.fntuuid,
                        importer: "bitmap-font",
                        textureUuid,
                        fontSize: t.bitmap.info.fontSize,
                        subMetas: {} as Record<string, any>,
                    };
                    const json = JSON.stringify(meta, null, 2);
                    const metaPath = t.bitmap.fileout + ".meta";
                    fs.writeFileSync(metaPath, json);
                } catch {
                    continue;
                }
            }
        }
    }

    // 纹理 / sprite-frame
    async newMetaPng(): Promise<void> {
        for (const textureUuid in GAnalys) {
            const t = GAnalys[textureUuid];

            if (!t.frames) continue;

            const meta: any = {
                ver: "2.3.7",
                uuid: textureUuid,
                importer: "texture",
                type: "sprite",
                wrapMode: "clamp",
                filterMode: "bilinear",
                premultiplyAlpha: t.premultiplyAlpha != null && t.premultiplyAlpha,
                genMipmaps: t.genMipmaps != null && t.genMipmaps,
                packable: t.packable == null || t.packable,
                width: t.width,
                height: t.height,
                platformSettings: {},
                subMetas: {} as Record<string, any>,
            };

            // 无 plist，直接在贴图上拆分 sprite-frame
            if (!t.plists) {
                for (const key in t.frames) {
                    const frame = t.frames[key];
                    const subMeta = {
                        ver: "1.0.6",
                        uuid: frame.uuid || frame.unkown_uuid,
                        importer: "sprite-frame",
                        rawTextureUuid: textureUuid,
                        trimType: "auto",
                        trimThreshold: 1,
                        rotated: !!frame.rotated,
                        offsetX: frame.offset[0],
                        offsetY: frame.offset[1],
                        trimX: frame.rect[0],
                        trimY: frame.rect[1],
                        width: frame.rect[2],
                        height: frame.rect[3],
                        rawWidth: frame.originalSize[0],
                        rawHeight: frame.originalSize[1],
                        borderTop: frame.capInsets[1],
                        borderBottom: frame.capInsets[3],
                        borderLeft: frame.capInsets[0],
                        borderRight: frame.capInsets[2],
                        subMetas: {} as Record<string, any>,
                    };
                    meta.subMetas[frame.name] = subMeta;
                }
            }

            const json = JSON.stringify(meta, null, 2);
            const metaPath = t.fileout + ".meta";
            try {
                fs.writeFileSync(metaPath, json);
            } catch (err) {
                console.log("newMetaPng err:", err);
            }
        }
    }
}
