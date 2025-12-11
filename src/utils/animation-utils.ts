export async function aniAnimsObjs(arr: any[], spanimFrames: any): Promise<any> {
    const obj: any = {};
    let currentKey = "";
    let ttype: string;

    for (let i = 0; i < arr.length; i++) {
        const c = arr[i];
        ttype = typeof c;

        if (ttype === "object") {
            for (const f in c) {
                obj[f] = c[f];
            }
        } else if (ttype === "string") {
            currentKey = c;
        } else if (c === 8) {
            const next = arr[++i];
            if (next[0] === 4) {
                const bin = next[1].toString(2).padStart(32, "0");
                const a = parseInt(bin.slice(0, 8), 2);
                const l = parseInt(bin.slice(8, 16), 2);
                const r = parseInt(bin.slice(16, 24), 2);
                const g = parseInt(bin.slice(24, 32), 2);
                obj[currentKey] = { __type__: "cc.Color", r: g, g: r, b: l, a };
            } else {
                obj[currentKey] = { __type__: "cc.Vec2", x: next[1], y: next[2] };
            }
        } else if (c === 11) {
            i++;
            obj[currentKey] = await aniAnimsObjs(arr[i], spanimFrames);
        } else if (c === 12) {
            i++;
            obj[currentKey] = await aniAnimsArray(arr[i], spanimFrames);
        }
    }

    return obj;
}

export async function aniAnimsArray(iArr: any[], spanimFrames: any): Promise<any[]> {
    const result: any[] = [];
    let currentKey = "";
    let ttype: string;

    for (let idx = 0; idx < iArr[0].length; idx++) {
        const t = iArr[0][idx];
        let item: any = {};
        ttype = typeof t;

        if (Array.isArray(t)) {
            for (let j = 0; j < t.length; j++) {
                const u = t[j];
                const p = typeof u;
                if (p === "object") {
                    for (const k in u) {
                        item[k] = u[k];
                    }
                } else if (p === "string") {
                    currentKey = u;
                } else if (u === 8) {
                    const next = t[++j];
                    if (next[0] === 4) {
                        const bin = next[1].toString(2).padStart(32, "0");
                        const a = parseInt(bin.slice(0, 8), 2);
                        const l = parseInt(bin.slice(8, 16), 2);
                        const r = parseInt(bin.slice(16, 24), 2);
                        const g = parseInt(bin.slice(24, 32), 2);
                        item[currentKey] = { __type__: "cc.Color", r: g, g: r, b: l, a };
                    } else {
                        item[currentKey] = {
                            __type__: "cc.Vec2",
                            x: next[1],
                            y: next[2],
                        };
                    }
                } else if (u === 6) {
                    j++;
                    item[currentKey] = { __uuid__: spanimFrames[t[j]] };
                }
            }
        } else if (ttype === "object") {
            item = t;
        }

        result.push(item);
    }

    return result;
}
