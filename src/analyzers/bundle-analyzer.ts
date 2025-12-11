import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import deserialize from "../libs/deserialize-compiled";
import { EXT_MAP } from "../config/constants";
import { UuidUtils } from "../utils/uuid-utils";
import { GAnalys, GAnimMp, GCfgJson, GConfig, GFrameNames, GMapPlist, GMapSubs, GUnkowns } from "../globals/globals";

export interface AnalyzerContext {
    dirOut: string;
    correctPath(p: string): string;
    isPicture(ext: string): boolean;
    isAFrame(e: any): boolean;
}

export function parseBundleConfig(ctx: AnalyzerContext, bundleName: string, cfg: any): void {
    GMapSubs[bundleName] = GMapSubs[bundleName] || 0;
    GMapSubs[bundleName] += 1;

    if (!fs.existsSync(ctx.dirOut)) {
        fs.mkdirSync(ctx.dirOut);
    }

    const bundleDir = ctx.dirOut + bundleName + "/";
    if (!fs.existsSync(bundleDir)) {
        fs.mkdirSync(bundleDir);
    }

    if (cfg.deps) {
        for (let i = 0; i < cfg.deps.length; i++) {
            const dep = cfg.deps[i];
            GMapSubs[dep] = GMapSubs[dep] || 0;
            GMapSubs[dep] += 1;
        }
    }

    const { paths, types, uuids } = cfg;
    const l = uuids as string[];

    for (let i = 0; i < l.length; i++) {
        const r = l[i];
        if (r.length >= 10) {
            l[i] = UuidUtils.decompressUuid(r);
        }
        console.log(bundleName + ": " + i + " = " + r + " : " + l[i]);
    }

    GCfgJson[bundleName] = cfg;

    const used: any = {};
    for (const key in paths) {
        const [p, typeIdx] = paths[key];
        const uuid = l[key as any];

        paths[key][(used[uuid] = 1)] = types[typeIdx];

        console.log(uuid + " ttype = ", types[typeIdx]);

        if (GAnalys[uuid]) {
            GAnalys[uuid].ttype = types[typeIdx];

            if (EXT_MAP[types[typeIdx]]) {
                if (GAnalys[uuid].ext === ".atlas") {
                    GAnalys[uuid].fileout = ctx.correctPath(bundleDir + p + ".atlas");
                } else if (GAnalys[uuid].ext === ".bin" && types[typeIdx] !== "cc.BufferAsset") {
                    GAnalys[uuid].fileout = ctx.correctPath(bundleDir + p + ".skel");
                } else if (types[typeIdx] === "cc.Asset") {
                    GAnalys[uuid].fileout = ctx.correctPath(bundleDir + p + GAnalys[uuid].ext);
                } else if (GAnalys[uuid].ext === ".jpg") {
                    GAnalys[uuid].fileout = ctx.correctPath(bundleDir + p + ".jpg");
                } else {
                    GAnalys[uuid].fileout = ctx.correctPath(bundleDir + p + EXT_MAP[types[typeIdx]]);
                }
            } else {
                GAnalys[uuid].pathdir = p;
                if (types[typeIdx] === "cc.SpriteFrame") {
                    GFrameNames[uuid] = bundleDir + p;
                }
            }
        } else if (types[typeIdx] === "cc.AnimationClip") {
            GAnalys[uuid] = GAnalys[uuid] || GConfig[uuid] || {};
            GAnalys[uuid].ttype = types[typeIdx];
            GAnalys[uuid].ext = ".anim";
            GAnalys[uuid].fileout = ctx.correctPath(bundleDir + p + EXT_MAP[types[typeIdx]]);
            const parts = p.split("/");
            if (parts.length > 0) {
                GAnimMp[parts[parts.length - 1]] = GAnalys[uuid];
                console.log(uuid + " is a cc.Anim");
            }
        } else if (types[typeIdx] === "cc.SpriteFrame") {
            GFrameNames[uuid] = bundleDir + p;
        } else if (types[typeIdx] === "cc.JsonAsset") {
            if (GConfig[uuid]) {
                GConfig[uuid].ttype = types[typeIdx];
                GConfig[uuid].fileout = ctx.correctPath(bundleDir + p + EXT_MAP[types[typeIdx]]);
            } else if (GAnalys[uuid]) {
                GAnalys[uuid].ttype = types[typeIdx];
                GAnalys[uuid].fileout = ctx.correctPath(bundleDir + p + EXT_MAP[types[typeIdx]]);
            } else {
                GConfig[uuid] = GConfig[uuid] || { bundle: bundleName };
                GConfig[uuid].ttype = types[typeIdx];
                GConfig[uuid].fileout = ctx.correctPath(bundleDir + p + EXT_MAP[types[typeIdx]]);
            }
        } else if (types[typeIdx] === "dragonBones.DragonBonesAsset" || types[typeIdx] === "dragonBones.DragonBonesAtlasAsset") {
            GAnalys[uuid] = GAnalys[uuid] || { bundle: bundleName };
            GAnalys[uuid].ttype = types[typeIdx];
            GAnalys[uuid].fileout = ctx.correctPath(bundleDir + p + EXT_MAP[types[typeIdx]]);
        } else {
            GFrameNames[uuid] = bundleDir + p;
        }
    }

    for (const c in GAnalys) {
        const m = GAnalys[c];
        if (m.bundle === bundleName && !(used[c] || (cfg.packs && cfg.packs[c]))) {
            if (m.content && m.content.includes("cc.AnimationClip")) {
                console.log(c, " has igore cc.AnimationClip");
                m.ttype = "cc.AnimationClip";
            }

            if (m.ext === ".plist" && !m.fileout) {
                m.ttype = "cc.ParticleAsset";
                let particleName = c;
                if (GConfig[c]) {
                    try {
                        const json = JSON.parse(GConfig[c].content);
                        particleName = json[5][0][1];
                    } catch {
                        continue;
                    }
                }
                m.fileout = ctx.correctPath(bundleDir + "/unkown_particle/" + particleName + ".plist");
            }

            if (m.ext === ".mp3") {
                m.ttype = "cc.AudioClip";
                m.fileout = ctx.correctPath(bundleDir + "/unkown_video/" + c + ".mp3");
            }
        }
    }

    analysFiles(ctx, bundleName, cfg);
}

function analysFiles(ctx: AnalyzerContext, bundleName: string, cfg: any): void {
    const packs = cfg.packs || {};
    const paths = cfg.paths || {};
    const uuids = cfg.uuids || [];
    analysBitmapAndPlist(ctx, bundleName, packs, paths, uuids);
    analystextureSetter(ctx, bundleName, packs, paths, uuids);
    analysAnimFrameAtlas(ctx, bundleName, packs, paths, uuids);
    analysPacksPlist(bundleName, packs, paths, uuids);
    analysPathsMaterialAndEffect(bundleName, packs, paths, uuids);
}

function analysBitmapAndPlist(ctx: AnalyzerContext, bundleName: string, packs: any, paths: any, uuids: string[]): void {
    for (const [t, r] of Object.entries<any>(packs)) {
        try {
            const s = GConfig[t] || GAnalys[t];
            if (!s) continue;

            const hasFontDef = s.content.includes("fontDefDictionary");
            const matEffectIdx: string[] = [];
            const parsed = JSON.parse(s.content);
            for (let i = 0; i < parsed[2].length; i++) {
                parsed[2][i];
                parsed[1][i];
            }
            const u = parsed[5];

            // 位图字体
            if (hasFontDef) {
                for (let i = 0; i < u.length; i++) {
                    const m = u[i];
                    if (m.length >= 6) {
                        try {
                            if (JSON.stringify(m, null).includes("fontDefDictionary")) {
                                const iIndex = m[5][0];
                                const p = UuidUtils.decompressUuid(parsed[1][iIndex]);
                                const d = m[0][0];
                                const y = uuids[(r as any)[i]];
                                GAnalys[p] = GAnalys[p] || { bundle: bundleName };
                                GAnalys[p].bitmap = {
                                    name: d[1],
                                    info: d[3],
                                    fntuuid: y,
                                };
                                console.log(p + " has BitmapFont info");
                            }
                        } catch {
                            continue;
                        }
                    }
                }
            }

            for (let iIdx = 0; iIdx < u.length; iIdx++) {
                const tNode = u[iIdx];
                let ccMaterialJson: any = null;
                try {
                    for (let eIdx = 0; eIdx < tNode[5].length; eIdx++) {
                        tNode[5][eIdx] = UuidUtils.decompressUuid(parsed[1][tNode[5][eIdx]]);
                    }
                    // @ts-ignore
                    ccMaterialJson = parsed[3][parsed[4][[tNode[0][0][0]]][0]];
                } catch {
                    // ignore
                }

                if (tNode.length >= 6) {
                    try {
                        const h = tNode[0][0];
                        const A = tNode[5][0];
                        if (!ctx.isAFrame(h) || !ctx.isPicture(GAnalys[A].ext)) {
                            throw new Error("An error occurred!");
                        }

                        console.log(A + " has spriteframe info");

                        if (h.name && h.name !== "") {
                            GAnalys[A].frames = GAnalys[A].frames || {};
                            h.uuid = uuids[(r as any)[iIdx]];
                            if (GAnalys[A].frames[h.name]) {
                                h.name = h.name + "_" + h.uuid;
                            }
                            GAnalys[A].frames[h.name] = h;

                            if (hasFontDef && GAnalys[h.uuid] && GAnalys[h.uuid].bitmap) {
                                GAnalys[A].bitmap = GAnalys[h.uuid].bitmap;
                            }
                        }
                    } catch {
                        // 根据 ccMaterialJson 走不同类型
                        if (Array.isArray(ccMaterialJson) && ccMaterialJson[0]) {
                            switch (ccMaterialJson[0]) {
                                case "cc.Material": {
                                    if (bundleName !== "internal") {
                                        const eId = tNode[5][0];
                                        GAnalys[eId] = GAnalys[eId] || { bundle: bundleName };
                                        GAnalys[eId].material = GAnalys[eId].material || {};
                                        GAnalys[eId].material.mtls = GAnalys[eId].material.mtls || [];
                                        GAnalys[eId].material.mtls.push({
                                            mtl: tNode[0][0],
                                            mtluuid: uuids[(r as any)[iIdx]],
                                        });
                                    }
                                    break;
                                }
                                case "cc.EffectAsset": {
                                    if (bundleName !== "internal") {
                                        const gStr = JSON.stringify(tNode[0], null);
                                        if (gStr.includes("glsl3") && gStr.includes("glsl1")) {
                                            const propsArr: any[] = [];
                                            // @ts-ignore
                                            for (let e = 1; e < parsed[4][[tNode[0][0][0]]].length; e++) {
                                                // @ts-ignore
                                                if (ccMaterialJson[1][parsed[4][[tNode[0][0][0]]][e]]) {
                                                    // @ts-ignore
                                                    propsArr.push(ccMaterialJson[1][parsed[4][[tNode[0][0][0]]][e]]);
                                                }
                                            }
                                            const bUuid = uuids[(r as any)[iIdx]];
                                            GAnalys[bUuid] = GAnalys[bUuid] || { bundle: bundleName };
                                            GAnalys[bUuid].material = GAnalys[bUuid].material || {};
                                            GAnalys[bUuid].material.effect = tNode[0][0];
                                            GAnalys[bUuid].material.name = tNode[0][0][1];
                                            GAnalys[bUuid].material.props = propsArr;
                                            matEffectIdx.push(bUuid);
                                        }
                                    }
                                    break;
                                }
                                case "cc.AnimationClip": {
                                    const v = tNode[0][0];
                                    if (typeof v[1] === "string" && v.length >= 4) {
                                        const propsArr: any[] = [];
                                        // @ts-ignore
                                        for (let e = 1; e < parsed[4][[tNode[0][0][0]]].length; e++) {
                                            // @ts-ignore
                                            if (ccMaterialJson[1][parsed[4][[tNode[0][0][0]]][e]]) {
                                                // @ts-ignore
                                                propsArr.push(ccMaterialJson[1][parsed[4][[tNode[0][0][0]]][e]]);
                                            }
                                        }

                                        if (GAnimMp[v[1]]) {
                                            GAnimMp[v[1]].spanim = v;
                                            GAnimMp[v[1]].spanim_frames = tNode[5];
                                            GAnimMp[v[1]].props = propsArr;
                                        } else {
                                            const wUuid = uuids[(r as any)[iIdx]];
                                            GAnalys[wUuid] = GAnalys[wUuid] || { bundle: bundleName };
                                            GAnalys[wUuid].spanim = v;
                                            GAnalys[wUuid].spanim_frames = tNode[5];
                                            GAnalys[wUuid].props = propsArr;
                                        }
                                    }
                                    break;
                                }
                                case "cc.BitmapFont": {
                                    const S = tNode[5][0];
                                    const F = tNode[0][0];
                                    const x = uuids[(r as any)[iIdx]];
                                    GAnalys[S] = GAnalys[S] || { bundle: bundleName };
                                    GAnalys[S].bitmap = {
                                        name: F[1],
                                        info: F[3],
                                        fntuuid: x,
                                    };
                                    console.log(S + " has BitmapFont info");
                                    break;
                                }
                                case "cc.JsonAsset": {
                                    const O = uuids[(r as any)[iIdx]];
                                    if (!GAnalys[O]) {
                                        GAnalys[O] = GConfig[O] || { bundle: bundleName };
                                        delete GConfig[O];
                                        GAnalys[O].ttype = "cc.JsonAsset";
                                        tNode[5] = tNode[0];
                                        GAnalys[O].content = JSON.stringify(tNode, null, 2);
                                        console.log(O + " has json info");
                                    }
                                    break;
                                }
                                case "cc.TextAsset": {
                                    const k = uuids[(r as any)[iIdx]];
                                    if (!GAnalys[k]) {
                                        GAnalys[k] = GConfig[k] || { bundle: bundleName };
                                        delete GConfig[k];
                                        GAnalys[k].ttype = "cc.TextAsset";
                                        tNode[5] = tNode[0];
                                        GAnalys[k].fileout = ctx.correctPath(ctx.dirOut + bundleName + "/unkown_text/" + tNode[5][0][1] + ".txt");
                                        GAnalys[k].content = JSON.stringify(tNode, null, 2);
                                        console.log(k + " has text info");
                                    }
                                    break;
                                }
                                case "dragonBones.DragonBonesAtlasAsset": {
                                    const j = uuids[(r as any)[iIdx]];
                                    GAnalys[j] = GAnalys[j] || { bundle: bundleName };
                                    GAnalys[j].ttype = "dragonBones.DragonBonesAtlasAsset";
                                    tNode[5] = tNode[0];
                                    GAnalys[j].content = JSON.stringify(tNode, null, 2);
                                    console.log(j + " has dragonBones.DragonBonesAtlasAsset info");
                                    break;
                                }
                                case "dragonBones.DragonBonesAsset": {
                                    const P = uuids[(r as any)[iIdx]];
                                    GAnalys[P] = GAnalys[P] || { bundle: bundleName };
                                    GAnalys[P].ttype = "dragonBones.DragonBonesAsset";
                                    tNode[5] = tNode[0];
                                    GAnalys[P].content = JSON.stringify(tNode, null, 2);
                                    console.log(P + " has dragonBones.DragonBonesAsset info");
                                    break;
                                }
                                case "cc.SpriteAtlas": {
                                    const U = uuids[(r as any)[iIdx]];
                                    for (let e = 0; e < tNode[5].length; e++) {
                                        GMapPlist[tNode[5][e]] = U;
                                    }
                                    break;
                                }
                            }
                        }
                        continue;
                    }
                }
            }
        } catch {
            continue;
        }
    }
}

function analysPathsMaterialAndEffect(bundleName: string, packs: any, paths: any, uuids: string[]): void {
    for (const key in GAnalys) {
        const n = GAnalys[key];
        try {
            if (n.bundle === bundleName && bundleName !== "internal" && n.content) {
                const arr = JSON.parse(n.content);
                // @ts-ignore
                const o = deserialize(arr, null, null);
                // @ts-ignore
                if (o.__cid__ === "cc.Material" || o.__cid__ === "cc.EffectAsset") {
                    // @ts-ignore
                    n.ttype = o.__cid__;
                }
            }
        } catch {
            continue;
        }
    }

    for (const k in GConfig) {
        const c = GConfig[k];
        if (GAnalys[k]) {
            try {
                if (c.bundle === bundleName && bundleName !== "internal" && c.content) {
                    const arr = JSON.parse(c.content);
                    // @ts-ignore
                    const o = deserialize(arr);
                    // @ts-ignore
                    if (o.__cid__ === "cc.TTFFont") {
                        // @ts-ignore
                        GAnalys[k].ttfname = o._name;
                        // @ts-ignore
                        GAnalys[k].ttype = o.__cid__;
                    }
                }
            } catch {
                continue;
            }
        }
    }

    for (const key in GAnalys) {
        const u = GAnalys[key];
        try {
            if (u.bundle === bundleName && bundleName !== "internal") {
                if (u.ttype === "cc.Material") {
                    const pArr = JSON.parse(u.content);
                    const d = UuidUtils.decompressUuid(pArr[1][0]);
                    GAnalys[d] = GAnalys[d] || { bundle: bundleName };
                    GAnalys[d].material = GAnalys[d].material || {};
                    GAnalys[d].material.mtls = GAnalys[d].material.mtls || [];
                    GAnalys[d].material.mtls.push({
                        mtl: pArr[5][0],
                        mtluuid: key,
                    });
                } else if (u.ttype === "cc.EffectAsset") {
                    const propsArr: any[] = [];
                    const mArr = JSON.parse(u.content);
                    for (let i = 0; i < mArr[1].length; i++) {
                        mArr[1][i] = UuidUtils.decompressUuid(mArr[1][i]);
                    }
                    for (let i = 0; i < mArr[2].length; i++) {
                        mArr[2][i];
                        mArr[1][i];
                    }
                    const ccNode = mArr[3][mArr[4][mArr[5][0][0]][0]];
                    for (let i = 1; i < mArr[4][mArr[5][0][0]].length; i++) {
                        const idx = mArr[4][mArr[5][0][0]][i];
                        if (ccNode[1][idx]) {
                            propsArr.push(ccNode[1][idx]);
                        }
                    }
                    u.material = u.material || {};
                    u.material.effect = mArr[5][0];
                    u.material.name = mArr[5][0][1];
                    u.material.props = propsArr;
                }
            }
        } catch {
            continue;
        }
    }
}

function analysPacksPlist(bundleName: string, packs: any, paths: any, uuids: string[]): void {
    for (const [n, a] of Object.entries<any>(packs)) {
        try {
            const l = GAnalys[n];
            if (!l) continue;
            const r = JSON.parse(l.content);
            const map: any = {};
            for (let i = 0; i < r[2].length; i++) {
                map[r[2][i]] = r[1][i];
            }
            const c = r[5];
            for (let i = 0; i < c.length; i++) {
                const f = c[i];
                try {
                    if (Array.isArray(f[0]) && Array.isArray(f[0][0])) {
                        const u = f[0][0];
                        if (typeof u[1] === "string" && u[1].includes(".plist")) {
                            const p = UuidUtils.decompressUuid(map._textureSetter);
                            if (GAnalys[p] && GAnalys[p].frames) {
                                for (const d in map) {
                                    if (GAnalys[p].frames[d] && !GAnalys[p].frames[d].uuid) {
                                        GAnalys[p].frames[d].uuid = UuidUtils.decompressUuid(map[d]);
                                    }
                                }
                            }
                        }
                    }
                } catch {
                    continue;
                }
            }
        } catch {
            continue;
        }
    }
}

function analysAnimFrameAtlas(ctx: AnalyzerContext, bundleName: string, packs: any, paths: any, uuids: string[]): void {
    for (const key in GAnalys) {
        const o = GAnalys[key];
        if (o.bundle !== bundleName) continue;

        if (o.ttype === "cc.SpriteFrame") {
            try {
                const arr = JSON.parse(o.content);
                const texUuid = UuidUtils.decompressUuid(arr[1][0]);
                if (GAnalys[texUuid]) {
                    const frame = arr[5][0];
                    let name = frame.name;
                    GAnalys[texUuid].frames = GAnalys[texUuid].frames || {};
                    if (ctx.isPicture(GAnalys[texUuid].ext)) {
                        console.log(texUuid + " has spriteframe info");
                        console.log(texUuid + " " + GAnalys[texUuid].ttype);
                        GAnalys[texUuid].frames = GAnalys[texUuid].frames || {};
                        if (GAnalys[texUuid].frames[name]) {
                            name = key;
                        }
                        (GAnalys[texUuid].frames[name] = frame).uuid = key;
                    }
                }
            } catch {
                continue;
            }
        } else if (o.ttype === "cc.SpriteAtlas") {
            try {
                const arr = JSON.parse(o.content);
                const map: any = {};
                for (let i = 0; i < arr[2].length; i++) {
                    map[arr[2][i]] = arr[1][i];
                }
                const f = arr[5][0];
                if (typeof f[1] === "string" && f[1].includes(".plist")) {
                    const texUuid = UuidUtils.decompressUuid(arr[1][0]);
                    if (GAnalys[texUuid]) {
                        const pJson = JSON.parse(GAnalys[texUuid].content);
                        const pngUuid = UuidUtils.decompressUuid(pJson[1][0]);
                        if (GAnalys[pngUuid]) {
                            let framesArr = pJson[5];
                            if (Array.isArray(pJson[5][0])) {
                                framesArr = pJson[5][0];
                            }
                            for (let e = 0; e < framesArr.length; e++) {
                                try {
                                    const y = framesArr[e];
                                    const m = pngUuid;
                                    if (ctx.isPicture(GAnalys[m].ext)) {
                                        console.log(m + " has spriteframe info");
                                        console.log(m + " " + GAnalys[m].ttype);
                                        if (y.name && y.name !== "") {
                                            GAnalys[m].frames = GAnalys[m].frames || {};
                                            y.uuid = UuidUtils.decompressUuid(map[y.name]);
                                            if (GAnalys[m].frames[y.name]) {
                                                y.name = y.name + "_" + y.uuid;
                                            }
                                            GAnalys[m].frames[y.name] = y;
                                        }
                                        for (const h in GAnalys[m].frames) {
                                            if (!GAnalys[m].frames[h].uuid && map[h]) {
                                                GAnalys[m].frames[h].uuid = UuidUtils.decompressUuid(map[h]);
                                            }
                                        }
                                        GAnalys[m].plists = GAnalys[m].plists || {};
                                        GAnalys[m].plists.uuid = key;
                                    }
                                } catch {
                                    continue;
                                }
                            }
                        }
                    } else {
                        const g = o.fileout.replace(".plist", "");
                        for (const A in GAnalys) {
                            if (GAnalys[A].fileout && GAnalys[A].fileout.includes(g)) {
                                if (GAnalys[A].frames) {
                                    for (const GName in GAnalys[A].frames) {
                                        if (GAnalys[A].frames[GName] && map[GName]) {
                                            let e = GName;
                                            const tUuid = UuidUtils.decompressUuid(map[GName]);
                                            if (GAnalys[A].frames[e]) {
                                                e = tUuid;
                                            }
                                            GAnalys[A].frames[e].uuid = tUuid;
                                        }
                                    }
                                }
                                GAnalys[A].plists = GAnalys[A].plists || {};
                                GAnalys[A].plists.uuid = key;
                            }
                        }
                    }
                } else {
                    for (let e = 0; e < arr[2].length; e++) {
                        const v = arr[2][e];
                        const w = UuidUtils.decompressUuid(arr[1][e]);
                        if (GUnkowns[w]) {
                            const b = GAnalys[GUnkowns[w].uuid];
                            if (b && b.fileout) {
                                if (!b.fileout) {
                                    b.fileout = o.fileout.replace(".plist", b.ext);
                                }
                                if (b.frames && b.frames[v]) {
                                    b.frames[v].uuid = UuidUtils.decompressUuid(arr[1][e]);
                                }
                            }
                        }
                    }
                }
            } catch {
                continue;
            }
        } else if (o.ttype === "cc.AnimationClip" && !o.spanim) {
            try {
                const arr = JSON.parse(o.content);
                o.spanim = arr[5][0];
                if (arr[10]) {
                    for (let i = 0; i < arr[10].length; i++) {
                        arr[10][i] = UuidUtils.decompressUuid(arr[1][arr[10][i]]);
                    }
                    o.spanim_frames = arr[10];
                }
                const propsArr: any[] = [];
                for (let i = 0; i < arr[1].length; i++) {
                    arr[1][i] = UuidUtils.decompressUuid(arr[1][i]);
                }
                for (let i = 0; i < arr[2].length; i++) {
                    arr[2][i];
                    arr[1][i];
                }
                const ccNode = arr[3][arr[4][arr[5][0][0]][0]];
                for (let i = 1; i < arr[4][arr[5][0][0]].length; i++) {
                    const idx = arr[4][arr[5][0][0]][i];
                    if (ccNode[1][idx]) {
                        propsArr.push(ccNode[1][idx]);
                    }
                }
                o.props = propsArr;
            } catch {
                continue;
            }
        }

        // spine 解析
        if (o.sbines) {
            const x = o.sbines.datas;
            if (Array.isArray(x) && x.length > 5) {
                for (let n = 0; n < x[5].length; n++) {
                    try {
                        let j = x[5][n];
                        let iArr = j[5];
                        Array.isArray(iArr) || (iArr = j[6]);

                        for (let e = 0; e < iArr.length; e++) {
                            if (typeof iArr[e] === "number") {
                                iArr[e] = UuidUtils.decompressUuid(x[1][iArr[e]]);
                            } else {
                                iArr[e] = UuidUtils.decompressUuid(x[1][e]);
                            }
                        }

                        while (Array.isArray(j[0])) {
                            j = j[0];
                        }

                        if (typeof j[0] === "number" && typeof j[1] === "string" && typeof j[2] === "string") {
                            let tIdx = 3;
                            let sIdx = 4;
                            let ok = false;

                            if (Array.isArray(j[tIdx]) && typeof j[sIdx] === "object" && Array.isArray(j[5])) {
                                ok = true;
                            } else if (typeof j[3] === "number" && Array.isArray(j[4]) && typeof j[5] === "object") {
                                tIdx = 4;
                                sIdx = 5;
                                ok = true;
                            }

                            if (ok) {
                                let target = o;
                                if (packs[key]) {
                                    const O = uuids[(packs as any)[key][n]];
                                    let e = GAnalys[O];
                                    if (!e) {
                                        e = { bundle: o.bundle, sbines: j };
                                        GAnalys[O] = e;
                                    }
                                    target = e;
                                    o.sbines = null;
                                }

                                for (let e = 0; e < iArr.length; e++) {
                                    const P = GAnalys[iArr[e]];
                                    if (P && !P.fileout) {
                                        P.fileout = ctx.correctPath(ctx.dirOut + P.bundle + "/unkown_sbine/" + j[tIdx][e]);
                                        console.log("pngfile.fileout = ", P.fileout);
                                        if (!P.frames) {
                                            P.frames = [];
                                            P.frames[j[tIdx][e]] = {
                                                name: j[tIdx][e],
                                                unkown_uuid: uuidv4(),
                                                rotated: false,
                                                offset: [0, 0],
                                                rect: [0, 0, P.width, P.height],
                                                originalSize: [P.width, P.height],
                                                capInsets: [0, 0, 0, 0],
                                            };
                                        }
                                    }
                                }

                                target.sbines.pnguuid = iArr;
                                target.sbines.skname = j[1];
                                target.sbines.atlas = j[2];
                                target.sbines.jsons = JSON.stringify(j[sIdx], null, 2);
                            } else {
                                let binIdx = -1;
                                for (let e = 1; e < j.length - 1; e++) {
                                    if (j[e] === ".bin") {
                                        binIdx = e;
                                        break;
                                    }
                                }
                                if (binIdx > 0) {
                                    let target = o;
                                    if (packs[key]) {
                                        o.sbines = null;
                                        const k = uuids[(packs as any)[key][n]];
                                        let t2 = GAnalys[k];
                                        if (!t2) {
                                            t2 = { bundle: o.bundle, sbines: j };
                                            GAnalys[k] = t2;
                                        }
                                        target = t2;
                                        target.sbines = target.sbines || j;
                                    }

                                    target.sbines.pnguuid = iArr;
                                    target.sbines.skname = j[binIdx - 1];
                                    target.sbines.atlas = j[binIdx + 1];

                                    if (target.ext === ".bin" && target.fileout) {
                                        target.fileout = o.fileout.replace(/.json/g, ".skel");
                                    }

                                    for (let e = 0; e < iArr.length; e++) {
                                        const U = GAnalys[iArr[e]];
                                        if (U && !U.fileout) {
                                            if (j[5][e].includes(".")) {
                                                U.fileout = ctx.correctPath(ctx.dirOut + U.bundle + "/unkown_sbine/" + j[5][e]);
                                            } else {
                                                U.fileout = ctx.correctPath(ctx.dirOut + U.bundle + "/unkown_sbine/" + target.sbines.skname + U.ext);
                                            }

                                            console.log("pngfile.fileout = ", U.fileout);

                                            if (!U.frames) {
                                                U.frames = [];
                                                U.frames[j[5][e]] = {
                                                    name: j[5][e],
                                                    unkown_uuid: uuidv4(),
                                                    rotated: false,
                                                    offset: [0, 0],
                                                    rect: [0, 0, U.width, U.height],
                                                    originalSize: [U.width, U.height],
                                                    capInsets: [0, 0, 0, 0],
                                                };
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch {
                        continue;
                    }
                }
            }
        }
    }
}

function analystextureSetter(ctx: AnalyzerContext, bundleName: string, packs: any, paths: any, uuids: string[]): void {
    for (const n in GConfig) {
        const a = GConfig[n];
        if (a.bundle === bundleName && a.ext === ".json") {
            try {
                if (a.content.includes("_textureSetter")) {
                    const l = JSON.parse(a.content);
                    for (let i = 0; i < l[5].length; i++) {
                        const c = l[5][i];
                        if (ctx.isAFrame(c)) {
                            if (GAnalys[l[1][0]]) {
                                const r = l[1][0];
                                if (ctx.isPicture(GAnalys[r].ext)) {
                                    GAnalys[r].frames = GAnalys[r].frames || {};
                                    if (GAnalys[r].frames[c.name]) {
                                        c.name = c.name + "_" + n;
                                    }
                                    (GAnalys[r].frames[c.name] = c).unkown_uuid = n;
                                    if (!GAnalys[r].fileout) {
                                        GUnkowns[c.unkown_uuid] = { uuid: r, name: c.name };
                                        a.filein = null;
                                        a.fileout = null;
                                    }
                                    a.png_uuid = r;
                                }
                            } else {
                                const o = UuidUtils.decompressUuid(l[1][0]);
                                if (ctx.isPicture(GAnalys[o].ext)) {
                                    GAnalys[o].frames = GAnalys[o].frames || {};
                                    if (GAnalys[o].frames[c.name]) {
                                        c.name = c.name + "_" + n;
                                    }
                                    (GAnalys[o].frames[c.name] = c).unkown_uuid = n;
                                    a.png_uuid = o;
                                }
                            }
                        }
                    }
                }
            } catch {
                continue;
            }
        }
    }

    for (const f in GAnalys) {
        const u = GAnalys[f];
        if (u.bundle === bundleName && u.ext === ".json") {
            try {
                if (u.content.includes("_textureSetter")) {
                    const pArr = JSON.parse(u.content);
                    for (let i = 0; i < pArr[5].length; i++) {
                        const m = pArr[5][i];
                        if (ctx.isAFrame(m)) {
                            const d = pArr[1][0];
                            if (GAnalys[d]) {
                                if (ctx.isPicture(GAnalys[d].ext)) {
                                    GAnalys[d].frames = GAnalys[d].frames || {};
                                    if (GAnalys[d].frames[m.name]) {
                                        m.name = m.name + "_" + f;
                                    }
                                    (GAnalys[d].frames[m.name] = m).unkown_uuid = f;
                                    if (!GAnalys[d].fileout) {
                                        GUnkowns[m.unkown_uuid] = { uuid: d, name: m.name };
                                        u.filein = null;
                                        u.fileout = null;
                                    }
                                    u.png_uuid = d;
                                }
                            } else {
                                const y = UuidUtils.decompressUuid(pArr[1][0]);
                                if (GAnalys[y] && ctx.isPicture(GAnalys[y].ext)) {
                                    GAnalys[y].frames = GAnalys[y].frames || {};
                                    if (GAnalys[y].frames[m.name]) {
                                        m.name = m.name + "_" + f;
                                    }
                                    (GAnalys[y].frames[m.name] = m).unkown_uuid = f;
                                    u.png_uuid = y;
                                }
                            }
                        }
                    }
                }
            } catch {
                continue;
            }
        }
    }

    for (const h in GAnalys) {
        const A = GAnalys[h];
        if (A.bundle === bundleName && A.ext === ".json") {
            try {
                if (A.content.includes("fontDefDictionary")) {
                    const gArr = JSON.parse(A.content);
                    for (let i = 0; i < gArr[5].length; i++) {
                        const G = gArr[5][i];
                        const b = UuidUtils.decompressUuid(gArr[1][0]);
                        if (GAnalys[b] && GAnalys[b].png_uuid) {
                            if (ctx.isPicture(GAnalys[GAnalys[b].png_uuid].ext)) {
                                GAnalys[GAnalys[b].png_uuid].bitmap = {
                                    name: G[1],
                                    info: G[3],
                                    fntuuid: h,
                                };
                            }
                        }
                    }
                }
            } catch {
                continue;
            }
        }
    }
}
