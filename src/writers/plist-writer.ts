import * as fs from "fs";
import { plistJSONToXML } from "../utils/plist-utils";
import { GAnalys, GMapPlist } from "../globals/globals";

export interface PlistCtx {
    correctPath(p: string): string;
}

export async function writePlists(ctx: PlistCtx): Promise<void> {
    for (const [s, i] of Object.entries<any>(GAnalys)) {
        if (i.frames) {
            const plistJson: any = {};
            const frames: any = {};
            let atlasUuid: string | null = null;

            for (const name in i.frames) {
                const l = i.frames[name];
                const r = l.name + ".png";
                const o: any = {};
                const c = l.rect;
                const f = l.offset;
                const u = l.originalSize;

                o.rotated = l.rotated > 0;
                o.offset = `{${f[0]},${f[1]}}`;
                o.frame = `{{${c[0]},${c[1]}},{${c[2]},${c[3]}}}`;
                o.sourceColorRect = `{{0,0},{${u[0]},${u[1]}}}`;
                o.sourceSize = `{${u[0]},${u[1]}}`;

                if (!((i.width <= c[2] && c[3] >= i.height) || (u[0] >= i.width && u[1] >= i.height))) {
                    if (u[1] <= 0 && u[0] <= 0) break;
                    frames[r] = o;
                    if (!atlasUuid && GMapPlist[l.uuid]) {
                        atlasUuid = GMapPlist[l.uuid];
                    }
                }
            }

            if (Object.keys(frames).length > 0) {
                console.log(`uuid:${s} has a plist file`);
                let fileName = i.fileout;
                if (fileName !== "") {
                    const parts = fileName.split("/");
                    fileName = parts[parts.length - 1];
                }

                plistJson.frames = frames;
                const meta: any = { format: 2 };
                meta.realTextureFileName = fileName;
                meta.size = `{${i.width},${i.height}}`;
                meta.smartupdate = "$TexturePacker:SmartUpdate:f050e0f5a6de980e0f76806304dfcf8b:1/1$";
                meta.textureFileName = fileName;
                plistJson.metadata = meta;

                const xmlStr = plistJSONToXML(plistJson);
                const plistPath = i.fileout.split(".").slice(0, -1).join(".") + ".plist";
                i.plists = i.plists || { uuid: atlasUuid };
                i.plists.fileout = ctx.correctPath(plistPath);
                fs.writeFileSync(plistPath, xmlStr);
            }
        }
    }
}
