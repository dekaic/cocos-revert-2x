import fs from "fs";
import path from "path";

export function isPicture(ext: string): boolean {
    return ext === ".png" || ext === ".jpg" || ext === ".jpeg";
}

export function correctPath(p: string): string {
    let e = p.replace(/db:\/[^\/]+\//, "");
    const idx = e.lastIndexOf("/");
    let s = e.substring(0, idx);
    e = e.substring(idx + 1);
    s = s.replace(/\\/g, "/").replace(/[^a-zA-Z0-9._:/-]/g, "");
    return s + "/" + e;
}

export function isAFrame(e: any): boolean {
    return typeof e === "object" && e.name && e.rect && e.offset ? true : false;
}

export function walkSync(
    dirPathIn: string,
    filter: (e: fs.Dirent) => boolean,
    cb: (name: string, fullPath: string, bundle?: string) => void,
    bundle?: string
): void {
    fs.readdirSync(dirPathIn, { withFileTypes: true }).forEach((entry) => {
        const full = path.join(dirPathIn, entry.name);
        if (entry.isFile()) {
            if (filter(entry)) {
                cb(entry.name, full, bundle);
            }
        } else if (entry.isDirectory()) {
            const nextBundle = bundle || entry.name;
            walkSync(full, filter, cb, nextBundle);
        }
    });
}
