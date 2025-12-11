import * as fs from "fs";
import { dir } from "../utils/fs-dir";
import { GAnalys, GFrameNames } from "../globals/globals";

export interface CopyContext {
    dirOut: string;
    correctPath(p: string): string;
    isPicture(ext: string): boolean;
}

export async function copyFiles(ctx: CopyContext): Promise<void> {
    const tmpMap: Record<string, { path: string; ext: string; count: number }> = {};
    const spineOutMap: Record<string, string> = {};

    for (const n in GAnalys) {
        const i = GAnalys[n];
        let t = i.fileout;
        if (t && i.filein) {
            t = t.replace(/\\/g, "/");
            if (!t.includes(".prefab")) {
                t = spineOutMap[t] ? t.replace("unkown_sbine", "unkown_sbine/" + n) : t;
                spineOutMap[t] = n;
                const parts = t.split("/");
                parts.pop();
                await dir.dirExists(parts.join("/"));
                fs.copyFileSync(i.filein, t);
            }
        } else if (i.filein && ctx.isPicture(i.ext)) {
            let s = ctx.correctPath(ctx.dirOut + i.bundle + "/unkown/" + n);
            if (i.frames) {
                let count = 0;
                let lastName = "";
                for (const c in i.frames) {
                    count++;
                    lastName = c;
                }
                if (count === 1) {
                    s = ctx.correctPath(ctx.dirOut + i.bundle + "/unkown/" + lastName);
                }
            }
            tmpMap[s] = tmpMap[s] || { path: s, ext: i.ext, count: 0 };
            tmpMap[s].count += 1;
        }
    }

    for (const a in GAnalys) {
        const i = GAnalys[a];
        let e = i.fileout;
        if (!e && i.filein && ctx.isPicture(i.ext) && i.frames) {
            let s = ctx.correctPath(ctx.dirOut + i.bundle + "/unkown/" + a);
            if (i.frames) {
                let count = 0;
                let lastName = "";
                for (const f in i.frames) {
                    count++;
                    lastName = f;
                }
                if (count === 1) {
                    s = ctx.correctPath(ctx.dirOut + i.bundle + "/unkown/" + lastName);
                }
            }

            if (!tmpMap[s]) {
                console.log();
            }

            i.fileout = ctx.correctPath(tmpMap[s].path + tmpMap[s].ext);
            if (tmpMap[s].count > 1) {
                i.fileout = ctx.correctPath(tmpMap[s].path + "/" + a + tmpMap[s].ext);
            }
            const parts = i.fileout.replace(/\\/g, "/").split("/");
            parts.pop();
            await dir.dirExists(parts.join("/"));
            fs.copyFileSync(i.filein, i.fileout);
        }
    }

    for (const l in GAnalys) {
        const s = GAnalys[l];
        let outPath = s.fileout;
        if (s.sbines) {
            try {
                if (!outPath) {
                    if (GFrameNames[l]) {
                        if (s.ext === ".bin") {
                            s.fileout = ctx.correctPath(GFrameNames[l] + ".skel");
                        } else {
                            s.fileout = ctx.correctPath(GFrameNames[l] + ".json");
                        }
                        outPath = s.fileout;
                    } else {
                        if (!s.sbines.skname) {
                            console.log("sbine new out = ", outPath);
                            continue;
                        }
                        outPath =
                            s.ext === ".bin"
                                ? ctx.correctPath(ctx.dirOut + s.bundle + "/unkown_sbine/" + s.sbines.skname + ".skel")
                                : ctx.correctPath(ctx.dirOut + s.bundle + "/unkown_sbine/" + s.sbines.skname + ".json");
                    }
                }

                outPath = spineOutMap[outPath] ? outPath.replace("unkown_sbine", "unkown_sbine/" + l) : outPath;
                spineOutMap[outPath] = l;

                if (s.ext === ".bin") {
                    let skelPath = outPath.replace(/\\/g, "/");
                    const parts = skelPath.split("/");
                    parts.pop();
                    await dir.dirExists(parts.join("/"));
                    skelPath = skelPath.replace(/.json/g, ".skel");
                    if (!s.fileout) {
                        fs.writeFileSync(skelPath, s.content);
                    }
                    s.fileout_jsons = skelPath;
                    s.fileout_atlas = skelPath.replace(/.skel/g, ".atlas");
                } else {
                    outPath = outPath.replace(/\\/g, "/");
                    s.fileout_jsons = outPath;
                    const parts = outPath.split("/");
                    parts.pop();
                    await dir.dirExists(parts.join("/"));
                    fs.writeFileSync(s.fileout_jsons, s.sbines.jsons);
                    s.fileout_atlas = outPath.replace(/.json/g, ".atlas");
                }

                if (fs.existsSync(s.fileout_atlas)) {
                    console.log("copyFiles atlas exists:", s.fileout_atlas);
                } else {
                    fs.writeFileSync(s.fileout_atlas, s.sbines.atlas);
                }
            } catch {
                continue;
            }
        }
    }
}
