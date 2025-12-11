import * as fs from "fs";
import { dir } from "../utils/fs-dir";
import { GAnalys, GFrameNames } from "../globals/globals";

export interface FontCtx {
    dirOut: string;
    correctPath(p: string): string;
}

export async function writeBitmapFonts(ctx: FontCtx): Promise<void> {
    for (const [_uuid, a] of Object.entries<any>(GAnalys)) {
        if (a.bitmap && a.frames) {
            try {
                for (const [_t, l] of Object.entries<any>(a.frames)) {
                    let header =
                        'info face="仿宋" size={0} bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=1 aa=1 padding=0,0,0,0 spacing=1,1 outline=0 \n';
                    header = header.format(a.bitmap.info.fontSize);
                    header += "common lineHeight={0} base=28 scaleW={1} scaleH={2} pages=1 packed=0 alphaChnl=0 redChnl=0 greenChnl=0 blueChnl=0 \n".format(
                        a.bitmap.info.commonHeight,
                        l.originalSize[0],
                        l.originalSize[1]
                    );
                    header += 'page id=0 file="{0}" \n'.format(a.bitmap.info.atlasName);

                    let count = 0;
                    let body = "";
                    for (const r in a.bitmap.info.fontDefDictionary) {
                        count++;
                        const o = a.bitmap.info.fontDefDictionary[r];
                        body += "char id={0} x={1} y={2} width={3} height={4} xoffset={5} yoffset={6} xadvance={7} page=0 chnl=15\n".format(
                            r,
                            o.rect.x,
                            o.rect.y,
                            o.rect.width,
                            o.rect.height,
                            o.xOffset,
                            o.yOffset,
                            o.xAdvance
                        );
                    }

                    header += "chars count={0} \n".format(count);
                    const content = header + body;

                    let outPath = a.bitmap.fileout;
                    if (!outPath) {
                        if (GFrameNames[a.bitmap.fntuuid]) {
                            outPath = ctx.correctPath(GFrameNames[a.bitmap.fntuuid] + ".fnt");
                        } else {
                            outPath = ctx.correctPath(ctx.dirOut + a.bundle + "/unkown/" + a.bitmap.name + ".fnt");
                        }
                    }
                    outPath = outPath.replace(/\\/g, "/");
                    const parts = outPath.split("/");
                    parts.pop();
                    await dir.dirExists(parts.join("/"));

                    a.bitmap.fileout = ctx.correctPath(outPath);
                    fs.writeFileSync(outPath, content);
                }
            } catch {
                continue;
            }
        }
    }
}
