import * as fs from "fs";
import { dir } from "../utils/fs-dir";
import { GAnalys } from "../globals/globals";

export interface TTFCtx {
    dirOut: string;
    correctPath(p: string): string;
}

export async function writeTTFFiles(ctx: TTFCtx): Promise<void> {
    for (const [uuid, t] of Object.entries<any>(GAnalys)) {
        if (t.ttype === "cc.TTFFont") {
            let name: string;
            if (!t.fileout) {
                name = t.ttfname || uuid;
                t.fileout = ctx.correctPath(ctx.dirOut + t.bundle + "/unkown_ttf/" + name + ".ttf");
            }
            const outPath = t.fileout.replace(/\\/g, "/");
            const parts = outPath.split("/");
            parts.pop();
            await dir.dirExists(parts.join("/"));

            if (!t.content) {
                t.content = fs.readFileSync("ttf_template.TTF");
            }

            fs.writeFileSync(outPath, t.content);

            const metaJson = {
                ver: "1.1.2",
                uuid,
                importer: "ttf-font",
                subMetas: {} as any,
            };
            const metaStr = JSON.stringify(metaJson, null, 2);
            fs.writeFileSync(outPath + ".meta", metaStr);
        }
    }
}
