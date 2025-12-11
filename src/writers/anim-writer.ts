import * as fs from "fs";
import { dir } from "../utils/fs-dir";
import { aniAnimsObjs } from "../utils/animation-utils";
import { GAnalys } from "../globals/globals";

export interface AnimCtx {
    dirOut: string;
    correctPath(p: string): string;
}

export async function writeAnimFiles(ctx: AnimCtx): Promise<void> {
    for (const [_uuid, t] of Object.entries<any>(GAnalys)) {
        try {
            if (t.spanim) {
                const clip: any = {
                    __type__: "cc.AnimationClip",
                    _objFlags: 0,
                    _native: "",
                    curveData: {},
                    events: [],
                };

                for (let i = 0; i < t.props.length; i++) {
                    const n = t.props[i];
                    if (n === "curveData") {
                        let val = t.spanim[i + 1];
                        if (Array.isArray(val)) {
                            val = await aniAnimsObjs(val, t.spanim_frames);
                        }
                        if (val) {
                            clip[n] = val;
                        }
                    } else {
                        clip[n] = t.spanim[i + 1];
                    }
                }

                const jsonStr = JSON.stringify(clip, null, 2);
                if (!t.fileout) {
                    t.fileout = ctx.correctPath(ctx.dirOut + t.bundle + "/unkown_anim/" + t.spanim[1] + ".anim");
                }
                const outPath = t.fileout.replace(/\\/g, "/");
                const parts = outPath.split("/");
                parts.pop();
                await dir.dirExists(parts.join("/"));
                fs.writeFileSync(outPath, jsonStr);
            }
        } catch {
            continue;
        }
    }
}
