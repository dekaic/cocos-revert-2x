const fs = require("fs");
const path = require("path");
const DirUtils = require("./utils/dir-utils");
const { v4: uuidv4 } = require("uuid");

const RevertMeta = {
    // 入口：生成所有类型资源的 meta，并输出统计 json
    async newMetaFiles(ctx) {
        const { atlasBySpriteFrame: GMapPlist, textureBySpriteFrame: GMapFrame, bundlePriority: GMapSubs } = ctx.state;

        await this.newMetaPng(ctx);
        await this.newMetaFnt(ctx);
        await this.newMetaPlist(ctx);
        await this.newMetaAtlas(ctx);
        await this.newMetaSbine(ctx);
        await this.newMetaAnims(ctx);
        await this.newMetaAsset(ctx);
        await this.newMetaVideo(ctx);
        await this.newMetaParticle(ctx);

        // 输出 GMapPlist
        const mapPlistJson = JSON.stringify(GMapPlist, null, 2);
        fs.writeFileSync(`${ctx.dirOut}mapplist.json`, mapPlistJson, { undefined: void 0 }, (err) => {
            if (err) console.log("newMetaFiles err:", err);
        });

        // 输出 GMapFrame
        const mapFrameJson = JSON.stringify(GMapFrame, null, 2);
        fs.writeFileSync(`${ctx.dirOut}mapframe.json`, mapFrameJson, { undefined: void 0 }, (err) => {
            if (err) console.log("newMetaFiles err:", err);
        });

        // 重新分配 main / third 的优先级
        if (GMapSubs.internal) {
            if (GMapSubs.third) {
                GMapSubs.third = GMapSubs.internal - 1;
            } else if (GMapSubs.main) {
                GMapSubs.main = GMapSubs.internal - 1;
            }
        }

        const mapSubsJson = JSON.stringify(GMapSubs, null, 2);
        fs.writeFileSync(`${ctx.dirOut}mapsubs.json`, mapSubsJson, { undefined: void 0 }, (err) => {
            if (err) console.log("newMetaFiles err:", err);
        });
    },

    // cc.Asset / cc.BufferAsset
    async newMetaAsset(ctx) {
        const { assets: GAnalys } = ctx.state;

        for (const [uuid, info] of Object.entries(GAnalys)) {
            if (info.ttype === "cc.Asset") {
                const meta = {
                    ver: "1.0.3",
                    uuid,
                    importer: "asset",
                    subMetas: {},
                };

                const metaPath = `${info.fileout}.meta`.replace(/\\/g, "/");
                const parts = metaPath.split("/");
                parts.pop();

                await DirUtils.dirExists(parts.join("/"));

                const metaStr = JSON.stringify(meta, null, 2);
                console.log("create Asset.meta =", metaPath);

                fs.writeFileSync(metaPath, metaStr, { undefined: void 0 }, (err) => {
                    if (err) console.log("newMetaSbine err:", err);
                });
            } else if (info.ttype === "cc.BufferAsset") {
                const meta = {
                    ver: "1.0.2",
                    uuid,
                    importer: "buffer",
                    subMetas: {},
                };

                const metaPath = `${info.fileout}.meta`.replace(/\\/g, "/");
                const parts = metaPath.split("/");
                parts.pop();

                await DirUtils.dirExists(parts.join("/"));

                const metaStr = JSON.stringify(meta, null, 2);
                console.log("create Asset.meta =", metaPath);

                fs.writeFileSync(metaPath, metaStr, { undefined: void 0 }, (err) => {
                    if (err) console.log("newMetaSbine err:", err);
                });
            }
        }
    },

    // cc.ParticleAsset
    async newMetaParticle(ctx) {
        const { assets: GAnalys } = ctx.state;

        for (const [uuid, info] of Object.entries(GAnalys)) {
            if (info.ttype !== "cc.ParticleAsset") continue;

            const meta = {
                ver: "2.0.3",
                uuid,
                importer: "particle",
                subMetas: {},
            };

            const metaPath = `${info.fileout}.meta`.replace(/\\/g, "/");
            const parts = metaPath.split("/");
            parts.pop();

            await DirUtils.dirExists(parts.join("/"));

            const metaStr = JSON.stringify(meta, null, 2);
            console.log("create cc.ParticleAsset.meta =", metaPath);

            fs.writeFileSync(metaPath, metaStr, { undefined: void 0 }, (err) => {
                if (err) console.log("newMetaSbine err:", err);
            });
        }
    },

    // cc.AudioClip
    async newMetaVideo(ctx) {
        const { assets: GAnalys } = ctx.state;

        for (const [uuid, info] of Object.entries(GAnalys)) {
            if (info.ttype !== "cc.AudioClip") continue;

            const meta = {
                ver: "2.0.3",
                uuid,
                importer: "audio-clip",
                downloadMode: 0,
                duration: 1,
                subMetas: {},
            };

            const metaPath = `${info.fileout}.meta`.replace(/\\/g, "/");
            const parts = metaPath.split("/");
            parts.pop();

            await DirUtils.dirExists(parts.join("/"));

            const metaStr = JSON.stringify(meta, null, 2);
            console.log("create video.meta =", metaPath);

            fs.writeFileSync(metaPath, metaStr, { undefined: void 0 }, (err) => {
                if (err) console.log("newMetaSbine err:", err);
            });
        }
    },

    // 动画 .anim
    async newMetaAnims(ctx) {
        const { assets: GAnalys } = ctx.state;

        for (const [uuid, info] of Object.entries(GAnalys)) {
            if (!info.spanim) continue;

            const meta = {
                ver: "2.1.2",
                uuid,
                importer: "animation-clip",
                subMetas: {},
            };

            const metaPath = `${info.fileout}.meta`.replace(/\\/g, "/");
            const parts = metaPath.split("/");
            parts.pop();

            await DirUtils.dirExists(parts.join("/"));

            const metaStr = JSON.stringify(meta, null, 2);
            console.log("create anim.meta =", metaPath);

            fs.writeFileSync(metaPath, metaStr, { undefined: void 0 }, (err) => {
                if (err) console.log("newMetaSbine err:", err);
            });
        }
    },

    // spine 资源（.skel/.json + .atlas）
    async newMetaSbine(ctx) {
        const { assets: GAnalys } = ctx.state;

        for (const [uuid, info] of Object.entries(GAnalys)) {
            if (!info.sbines) continue;

            const spineMeta = {
                ver: "1.2.5",
                uuid,
                importer: "spine",
                textures: info.sbines.pnguuid,
                scale: 1,
                subMetas: {},
            };

            if (!info.fileout_jsons) {
                console.log("newMetaSbine err:");
                continue;
            }

            // json / skel 对应的 meta
            const jsonMetaPath = `${info.fileout_jsons}.meta`;
            const jsonMetaStr = JSON.stringify(spineMeta, null, 2);

            fs.mkdirSync(path.dirname(jsonMetaPath), { recursive: true });
            fs.writeFileSync(jsonMetaPath, jsonMetaStr, { undefined: void 0 }, (err) => {
                if (err) console.log("newMetaSbine err:", err);
            });

            // atlas 对应的 meta
            if (!info.fileout_atlas) {
                console.log("newMetaSbine err:");
                continue;
            }

            const atlasMetaPath = `${info.fileout_atlas}.meta`;
            if (fs.existsSync(atlasMetaPath)) {
                console.log("newMetaSbine atlas.meta exists:", atlasMetaPath);
                continue;
            }

            const atlasMeta = {
                ver: "1.0.3",
                uuid: uuidv4(),
                importer: "asset",
                subMetas: {},
            };

            const atlasMetaStr = JSON.stringify(atlasMeta, null, 2);

            fs.mkdirSync(path.dirname(atlasMetaPath), { recursive: true });
            fs.writeFileSync(atlasMetaPath, atlasMetaStr, { undefined: void 0 }, (err) => {
                if (err) console.log("newMetaSbine err:", err);
            });
        }
    },

    // .atlas 直接当 Asset
    async newMetaAtlas(ctx) {
        const { assets: GAnalys } = ctx.state;

        for (const [uuid, info] of Object.entries(GAnalys)) {
            if (info.ext !== ".atlas" || !info.fileout) continue;

            const meta = {
                ver: "1.0.3",
                uuid,
                importer: "asset",
                subMetas: {},
            };

            const metaStr = JSON.stringify(meta, null, 2);
            const metaPath = `${info.fileout}.meta`;

            fs.writeFileSync(metaPath, metaStr, { undefined: void 0 }, () => {});
        }
    },

    // sprite-atlas（由 plist 生成）
    async newMetaPlist(ctx) {
        const { assets: GAnalys, atlasBySpriteFrame: GMapPlist, textureBySpriteFrame: GMapFrame } = ctx.state;

        for (const [textureUuid, info] of Object.entries(GAnalys)) {
            if (!info.plists || !info.plists.fileout) continue;

            const atlasUuid = info.plists.uuid || uuidv4();

            const meta = {
                ver: "1.2.6",
                uuid: atlasUuid,
                importer: "sprite-atlas",
                rawTextureUuid: textureUuid,
                size: { width: info.width, height: info.height },
                type: "Texture Packer",
                subMetas: {},
            };

            for (const frameKey in info.frames) {
                const frameInfo = info.frames[frameKey];
                const frameFileName = frameInfo.name + ".png";

                // uuid 优先使用已写入的 uuid，否则使用 unkown_uuid
                frameInfo.uuid = frameInfo.uuid || frameInfo.unkown_uuid;

                if (!frameInfo.uuid) {
                    console.log();
                    continue;
                }

                meta.subMetas[frameFileName] = {
                    ver: "1.0.6",
                    uuid: frameInfo.uuid,
                    importer: "sprite-frame",
                    rawTextureUuid: textureUuid,
                    trimType: "auto",
                    trimThreshold: 1,
                    rotated: !!frameInfo.rotated,
                    offsetX: frameInfo.offset[0],
                    offsetY: frameInfo.offset[1],
                    trimX: frameInfo.rect[0],
                    trimY: frameInfo.rect[1],
                    width: frameInfo.rect[2],
                    height: frameInfo.rect[3],
                    rawWidth: frameInfo.originalSize[0],
                    rawHeight: frameInfo.originalSize[1],
                    borderTop: frameInfo.capInsets[1],
                    borderBottom: frameInfo.capInsets[3],
                    borderLeft: frameInfo.capInsets[0],
                    borderRight: frameInfo.capInsets[2],
                    spriteType: "normal",
                    subMetas: {},
                };

                // 记录 SpriteFrame -> Atlas 与 Texture 映射
                GMapPlist[frameInfo.uuid] = atlasUuid;
                GMapFrame[frameInfo.uuid] = textureUuid;
            }

            const metaStr = JSON.stringify(meta, null, 2);
            const metaPath = `${info.plists.fileout}.meta`;

            fs.writeFileSync(metaPath, metaStr, { undefined: void 0 }, () => {});
        }
    },

    // bitmap-font
    async newMetaFnt(ctx) {
        const { assets: GAnalys } = ctx.state;

        for (const [, info] of Object.entries(GAnalys)) {
            if (!info.bitmap || !info.frames) continue;

            try {
                const meta = {
                    ver: "2.1.2",
                    uuid: info.bitmap.fntuuid,
                    importer: "bitmap-font",
                    textureUuid: info.bundle ? undefined : undefined, // 保持逻辑，仅使用原字段
                    fontSize: info.bitmap.info.fontSize,
                    subMetas: {},
                };

                // 注意：原逻辑只写入 bitmap.fntuuid 与 fontSize，textureUuid 为调用方使用 uuid 填充
                const metaStr = JSON.stringify(meta, null, 2);
                const metaPath = `${info.bitmap.fileout}.meta`;

                fs.writeFileSync(metaPath, metaStr, { undefined: void 0 }, () => {});
            } catch (err) {
                continue;
            }
        }
    },

    // 带 frames 的 png 贴图（非 sprite-atlas）
    async newMetaPng(ctx) {
        const { assets: GAnalys } = ctx.state;

        for (const [textureUuid, info] of Object.entries(GAnalys)) {
            if (!info.frames) continue;

            const meta = {
                ver: "2.3.7",
                uuid: textureUuid,
                importer: "texture",
                type: "sprite",
                wrapMode: "clamp",
                filterMode: "bilinear",
                premultiplyAlpha: info.premultiplyAlpha != null && info.premultiplyAlpha,
                genMipmaps: info.genMipmaps != null && info.genMipmaps,
                packable: info.packable == null || info.packable,
                width: info.width,
                height: info.height,
                platformSettings: {},
                subMetas: {},
            };

            // 如果已经挂载在 plist 上，则不再在 texture.meta 中生成 subMetas
            if (!info.plists) {
                for (const frameKey in info.frames) {
                    const frameInfo = info.frames[frameKey];

                    const frameMeta = {
                        ver: "1.0.6",
                        uuid: frameInfo.uuid || frameInfo.unkown_uuid,
                        importer: "sprite-frame",
                        rawTextureUuid: textureUuid,
                        trimType: "auto",
                        trimThreshold: 1,
                        rotated: !!frameInfo.rotated,
                        offsetX: frameInfo.offset[0],
                        offsetY: frameInfo.offset[1],
                        trimX: frameInfo.rect[0],
                        trimY: frameInfo.rect[1],
                        width: frameInfo.rect[2],
                        height: frameInfo.rect[3],
                        rawWidth: frameInfo.originalSize[0],
                        rawHeight: frameInfo.originalSize[1],
                        borderTop: frameInfo.capInsets[1],
                        borderBottom: frameInfo.capInsets[3],
                        borderLeft: frameInfo.capInsets[0],
                        borderRight: frameInfo.capInsets[2],
                        subMetas: {},
                    };

                    meta.subMetas[frameInfo.name] = frameMeta;
                }
            }

            const metaStr = JSON.stringify(meta, null, 2);
            const metaPath = `${info.fileout}.meta`;

            fs.writeFileSync(metaPath, metaStr, { undefined: void 0 }, () => {});
        }
    },
};

module.exports = RevertMeta;
