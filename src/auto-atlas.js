const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const DirUtils = require("./utils/dir-utils");
const { GAnalys, GCfgJson, GFrameNames } = require("./revert-state");

// 拆分自动图集，生成单独贴图
async function SplitAutoAtlas() {
    for (const [key, atlas] of Object.entries(GAnalys)) {
        if (!(atlas.bundle && atlas.frames && key.length < 22)) continue;

        const { paths, uuids } = GCfgJson[atlas.bundle];
        const bundleOutDir = `${this.dirOut}${atlas.bundle}/`;
        let basePath = `${key}/`;

        // 确定帧所在的基本路径
        for (const [frameName, frameData] of Object.entries(atlas.frames)) {
            const frameUuid = frameData.uuid || frameData.unkown_uuid;
            const idx = uuids.indexOf(frameUuid);
            if (idx >= 0 && paths[idx]) {
                const slashIdx = paths[idx][0].lastIndexOf("/");
                if (slashIdx !== -1) {
                    basePath = paths[idx][0].substring(0, slashIdx + 1);
                    break;
                }
            }
        }

        // 遍历帧，裁切出独立图片
        for (const [frameName, frameData] of Object.entries(atlas.frames)) {
            const frameUuid = frameData.uuid || frameData.unkown_uuid;
            const index = uuids.indexOf(frameUuid);
            let targetPath = basePath + frameName;

            if (index >= 0 && paths[index] && paths[index][0]) {
                targetPath = paths[index][0];
            }

            targetPath = this.correctPath(`${bundleOutDir}${targetPath}.png`);

            // 如果该 uuid 本身已有 GFrameNames 映射，则优先使用
            if (GFrameNames[frameUuid]) {
                targetPath = this.correctPath(`${GFrameNames[frameUuid]}.png`);
            }

            let bitmap = null;
            if (GAnalys[frameUuid] && GAnalys[frameUuid].bitmap) {
                GAnalys[frameUuid].bitmap = atlas.bitmap;
                bitmap = GAnalys[frameUuid].bitmap;
            }

            console.log(`start ${key} processing ${frameUuid}`);

            const newUuid = uuidv4();
            GAnalys[newUuid] = GAnalys[newUuid] || { bundle: atlas.bundle, frames: {} };
            GAnalys[newUuid].ext = ".png";
            GAnalys[newUuid].filein = null;
            GAnalys[newUuid].fileout = targetPath;
            GAnalys[newUuid].frames = GAnalys[newUuid].frames || {};
            GAnalys[newUuid].frames[frameName] = frameData;
            GAnalys[newUuid].bitmap = bitmap;

            const outPath = GAnalys[newUuid].fileout;
            const outDirArr = outPath.split("/");
            outDirArr.pop();
            await DirUtils.dirExists(outDirArr.join("/"));

            const rect = frameData.rect;
            const x = rect[0];
            const y = rect[1];
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
            const original = frameData.originalSize;
            const origW = parseInt(original[0], 10);
            const origH = parseInt(original[1], 10);
            const rawRect = rect;
            const offset = frameData.offset;

            frameData.rect[0] = offset[0] + (origW - rawRect[2]) / 2;
            frameData.rect[1] = (origH - rawRect[3]) / 2 - offset[1];
            frameData.rotated = false;

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

            console.log(`Successfully processed ${outPath}`);

            delete atlas.frames[frameName];
            if (Object.keys(atlas.frames).length <= 0) {
                atlas.frames = null;
            }
        }
    }
}

module.exports = {
    SplitAutoAtlas,
};
