import * as fs from "fs";
import { dir } from "../utils/fs-dir";
import { GAnalys } from "../globals/globals";

export interface WriteCtx {
    dirOut: string;
    correctPath(p: string): string;
}

export async function writeJsonAssets(ctx: WriteCtx): Promise<void> {
    for (const [uuid, t] of Object.entries<any>(GAnalys)) {
        if (t.ttype === "cc.JsonAsset") {
            const s = JSON.parse(t.content);
            if (!t.fileout) {
                t.fileout = ctx.correctPath(ctx.dirOut + t.bundle + "/unkown_json/" + s[5][0][1] + ".json");
            }
            const outPath = t.fileout.replace(/\\/g, "/");
            const parts = outPath.split("/");
            parts.pop();
            await dir.dirExists(parts.join("/"));

            const payload = Array.isArray(s) ? JSON.stringify(s[5][0][2], null, 2) : JSON.stringify(s.json, null, 2);
            fs.writeFileSync(outPath, payload);

            const metaJson = { ver: "1.0.2", uuid, importer: "json", subMetas: {} as any };
            const metaStr = JSON.stringify(metaJson, null, 2);
            fs.writeFileSync(outPath + ".meta", metaStr);
        }
    }
}

export async function writeDragonJson(ctx: WriteCtx): Promise<void> {
    for (const [uuid, t] of Object.entries<any>(GAnalys)) {
        if (t.ttype === "dragonBones.DragonBonesAsset" || t.ttype === "dragonBones.DragonBonesAtlasAsset") {
            const s = JSON.parse(t.content);
            if (!t.fileout) {
                t.fileout = ctx.correctPath(ctx.dirOut + t.bundle + "/unkown_json/" + s[5][0][1] + ".json");
            }
            const outPath = t.fileout.replace(/\\/g, "/");
            const parts = outPath.split("/");
            parts.pop();
            await dir.dirExists(parts.join("/"));

            const payload = Array.isArray(s) ? s[5][0][2] : JSON.stringify(s.json, null, 2);
            fs.writeFileSync(outPath, payload);

            const metaJson = { ver: "1.0.2", uuid, subMetas: {} as any };
            const metaStr = JSON.stringify(metaJson, null, 2);
            fs.writeFileSync(outPath + ".meta", metaStr);
        }
    }
}

export async function writeTextAssets(ctx: WriteCtx): Promise<void> {
    for (const [uuid, t] of Object.entries<any>(GAnalys)) {
        if (t.ttype === "cc.TextAsset") {
            const outPath = t.fileout.replace(/\\/g, "/");
            const parts = outPath.split("/");
            parts.pop();
            await dir.dirExists(parts.join("/"));

            const txt = JSON.parse(t.content)[5][0][2] || "";
            fs.writeFileSync(outPath, txt);

            const metaJson = {
                ver: "1.0.1",
                importer: "text",
                uuid,
                subMetas: {} as any,
            };
            const metaStr = JSON.stringify(metaJson, null, 2);
            fs.writeFileSync(outPath + ".meta", metaStr);
        }
    }
}
