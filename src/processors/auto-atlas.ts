import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { dir } from "../utils/fs-dir";
import { GAnalys, GCfgJson, GFrameNames } from "../globals/globals";

export interface RevertContext {
    dirOut: string;
    correctPath(p: string): string;
}

// 拆分 auto atlas，生成独立的小图
export async function splitAutoAtlas(ctx: RevertContext): Promise<void> {
    for (const r in GAnalys) {
        const o = GAnalys[r];
        if (o.bundle && o.frames && r.length < 22) {
            const { paths: u, uuids: p } = GCfgJson[o.bundle];
            const baseDir = ctx.dirOut + o.bundle + "/";
            let relativeDir = r + "/";

            for (const [_name, frame] of Object.entries<any>(o.frames)) {
                const uuid = frame.uuid || frame.unkown_uuid;
                const idx = p.indexOf(uuid);
                if (idx >= 0 && u[idx]) {
                    const pos = u[idx][0].lastIndexOf("/");
                    if (pos !== -1) {
                        relativeDir = u[idx][0].substring(0, pos + 1);
                        break;
                    }
                }
            }

            for (const [frameName, frame] of Object.entries<any>(o.frames)) {
                const frameUuid = frame.uuid || frame.unkown_uuid;
                const idx = p.indexOf(frameUuid);

                let outRel = relativeDir + frameName;
                if (idx >= 0 && u[idx] && u[idx][0]) {
                    outRel = u[idx][0];
                }

                let outPath = ctx.correctPath(baseDir + outRel + ".png");
                let bitmap: any = null;

                if (GFrameNames[frameUuid]) {
                    outPath = ctx.correctPath(GFrameNames[frameUuid] + ".png");
                }

                if (GAnalys[frameUuid] && GAnalys[frameUuid].bitmap) {
                    GAnalys[frameUuid].bitmap = o.bitmap;
                    bitmap = GAnalys[frameUuid].bitmap;
                }

                console.log(`start ${r} processing ` + frameUuid);

                const newUuid = uuidv4();
                GAnalys[newUuid] = GAnalys[newUuid] || { bundle: o.bundle, frames: {} };
                GAnalys[newUuid].ext = ".png";
                GAnalys[newUuid].filein = null;
                GAnalys[newUuid].fileout = outPath;
                GAnalys[newUuid].frames = GAnalys[newUuid].frames || {};
                GAnalys[newUuid].frames[frameName] = frame;
                GAnalys[newUuid].bitmap = bitmap;

                const outParts = GAnalys[newUuid].fileout.split("/");
                outParts.pop();
                await dir.dirExists(outParts.join("/"));

                const rect = frame.rect;
                let left = rect[0];
                let top = rect[1];
                let width = rect[2];
                let height = rect[3];

                GAnalys[newUuid].width = width;
                GAnalys[newUuid].height = height;

                if (frame.rotated) {
                    [width, height] = [height, width];
                }

                let img = sharp(o.filein).extract({
                    left,
                    top,
                    width,
                    height,
                });

                if (frame.rotated) {
                    img = img.rotate(-90);
                }

                const original = frame.originalSize;
                const ow = parseInt(original[0], 10);
                const oh = parseInt(original[1], 10);

                const rectCopy = rect;
                const offset = frame.offset;

                frame.rect[0] = offset[0] + (ow - rectCopy[2]) / 2;
                frame.rect[1] = (oh - rectCopy[3]) / 2 - offset[1];
                frame.rotated = false;

                const finalBuffer = await img.toBuffer();

                await sharp({
                    create: {
                        width: ow,
                        height: oh,
                        channels: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 0 },
                    },
                })
                    .composite([
                        {
                            input: finalBuffer,
                            left: Math.floor(frame.rect[0]),
                            top: Math.floor(frame.rect[1]),
                        },
                    ])
                    .toFile(GAnalys[newUuid].fileout);

                console.log("Successfully processed " + GAnalys[newUuid].fileout);

                delete o.frames[frameName];
                if (Object.keys(o.frames).length <= 0) {
                    o.frames = null;
                }
            }
        }
    }
}
