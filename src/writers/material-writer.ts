import * as fs from "fs";
import { dir } from "../utils/fs-dir";
import { writeEffectFiles } from "./effect-writer";
import { aniAnimsObjs } from "../utils/animation-utils";
import { GAnalys, GFrameNames } from "../globals/globals";

export interface MaterialCtx {
    dirOut: string;
    correctPath(p: string): string;
}

export async function writeMaterialFiles(ctx: MaterialCtx): Promise<void> {
    for (const [r, o] of Object.entries<any>(GAnalys)) {
        if (!o.material) {
            continue;
        }

        if (o.material.effect) {
            await writeEffectFiles({ dirOut: ctx.dirOut, correctPath: ctx.correctPath }, r, o);
        }

        if (!o.material.mtls) {
            continue;
        }

        for (let l = 0; l < o.material.mtls.length; l++) {
            const e = o.material.mtls[l];
            const mat: any = {
                __type__: "cc.Material",
                _name: e.mtl[1],
                _objFlags: 0,
                _native: "",
                _effectAsset: { __uuid__: r },
                _techniqueData: e.mtl[2],
            };
            if (Array.isArray(e.mtl[2])) {
                mat._techniqueData = await aniAnimsObjs(e.mtl[2], null);
            }

            let sPath = o.pathdir;
            if (GAnalys[e.mtluuid]) {
                sPath = GAnalys[e.mtluuid].pathdir || sPath;
            }

            let outPath: string;
            if (sPath) {
                outPath = ctx.correctPath(ctx.dirOut + o.bundle + "/" + sPath + ".mtl");
            } else if (GFrameNames[e.mtluuid]) {
                outPath = ctx.correctPath(GFrameNames[e.mtluuid] + ".mtl");
            } else {
                outPath = ctx.dirOut + o.bundle + "/unkown_effect/" + e.mtl[1] + ".mtl";
            }

            outPath = outPath.replace(/\\/g, "/");
            const parts = outPath.split("/");
            parts.pop();
            await dir.dirExists(parts.join("/"));

            let output = JSON.stringify(mat, null, 2);
            fs.writeFileSync(outPath, output);

            const metaJson = {
                ver: "1.0.5",
                uuid: e.mtluuid,
                importer: "material",
                dataAsSubAsset: null,
                subMetas: {} as any,
            };
            output = JSON.stringify(metaJson, null, 2);
            fs.writeFileSync(outPath + ".meta", output);
        }
    }
}
