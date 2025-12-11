// @ts-nocheck
import { unpackJSONs } from "./libs/deserialize-compiled";
import deserialize from "./libs/deserialize-compiled";
import { UuidUtils } from "./utils/uuid-utils";
import { dir } from "./utils/fs-dir";
import * as fs from "fs";

// 这些全局由其他模块注入，这里只做类型声明以通过 TS 编译
declare const GConfig: { [key: string]: any };
declare const GAnalys: { [key: string]: any };
declare const GFrameNames: { [key: string]: string };
declare const UNKOWN_PBS: { [uuid: string]: string } | undefined;

export class HelloWorld {
    // 外部可挂载：HelloWorld.mapplist = GMapPlist;
    static mapplist: { [uuid: string]: string } = {};
    private static PrefabLoaded: { [uuid: string]: 1 } = {};

    static async writefile(filePath: string, content: string): Promise<void> {
        const normPath = filePath.replace(/\\/g, "/");
        const parts = normPath.split("/");
        parts.pop();
        await dir.dirExists(parts.join("/"));
        try {
            fs.writeFileSync(normPath, content);
        } catch (err) {
            console.log("newMetaFiles err:", err);
        }
    }

    static async writeSceneMeta(outPath: string, _name: string, uuid: string): Promise<void> {
        const metaJson =
            "{\n" +
            '      "ver": "1.3.2",\n' +
            '      "uuid": "' +
            uuid +
            '",\n' +
            '      "importer": "prefab",\n' +
            '      "optimizationPolicy": "AUTO",\n' +
            '      "asyncLoadAssets": false,\n' +
            '      "readonly": false,\n' +
            '      "subMetas": {}\n' +
            "}";
        try {
            fs.writeFileSync(outPath + ".meta", metaJson);
        } catch (err) {
            console.log("newMetaSbine err:", err);
        }
    }

    static async writePrefabMeta(outPath: string, _name: string, uuid: string): Promise<void> {
        const metaJson =
            "{\n" +
            '      "ver": "1.3.2",\n' +
            '      "uuid": "' +
            uuid +
            '",\n' +
            '      "importer": "prefab",\n' +
            '      "optimizationPolicy": "AUTO",\n' +
            '      "asyncLoadAssets": false,\n' +
            '      "readonly": false,\n' +
            '      "subMetas": {}\n' +
            "}";
        try {
            fs.writeFileSync(outPath + ".meta", metaJson);
        } catch (err) {
            console.log("newMetaSbine err:", err);
        }
    }

    // revert = Revert 实例（有 dirOut / isPicture / correctPath 等）
    static async parseBundleConfig(revert: any, bundleName: string, cfg: any): Promise<void> {
        const { uuids, types } = cfg as { uuids: string[]; types: string[] };
        const i = uuids;

        // 解压 uuid
        for (let idx = 0; idx < i.length; idx++) {
            const raw = i[idx];
            if (raw && raw.length >= 10) {
                i[idx] = UuidUtils.decompressUuid(raw);
            }
        }

        const packs = cfg.packs || {};
        const paths = cfg.paths || {};
        const outDir = revert.dirOut + bundleName + "/";

        // 处理 packs：Texture2D / SceneAsset / Prefab 等打包内容
        for (const [packKey, indexArray] of Object.entries(packs) as [string, number[]][]) {
            try {
                const entry = GConfig[packKey] || GAnalys[packKey];
                if (!entry) continue;

                const u = JSON.parse(entry.content);

                // 纹理设置
                if (u.type === "cc.Texture2D" && u.data) {
                    const segments: string[] = u.data.split("|");
                    for (let idx = 0; idx < segments.length; idx++) {
                        const seg = segments[idx];
                        const texUuid = i[indexArray[idx]];
                        const tokens = seg.split(",");
                        if (tokens.length === 8 && GAnalys[texUuid] && revert.isPicture(GAnalys[texUuid].ext)) {
                            GAnalys[texUuid].premultiplyAlpha = tokens[5].charCodeAt(0) === 49; // '1'
                            GAnalys[texUuid].genMipmaps = tokens[6].charCodeAt(0) === 49;
                            GAnalys[texUuid].packable = tokens[7].charCodeAt(0) === 49;
                        }
                    }
                } else {
                    let m: string | undefined;
                    const jsonArr = unpackJSONs(u);
                    if (Array.isArray(jsonArr)) {
                        for (let idx = 0; idx < jsonArr.length; idx++) {
                            try {
                                // @ts-ignore
                                const k = deserialize(jsonArr[idx]);
                                // @ts-ignore
                                k._uuid = i[indexArray[idx]];

                                // @ts-ignore
                                if (k.__cid__ === "cc.SceneAsset") {
                                    // @ts-ignore
                                    console.log("start parse :", k._name);
                                    // @ts-ignore
                                    this.storeScene(k._name, k);
                                    // @ts-ignore
                                    const sceneJson = this.storeScene(k._name, k);
                                    // @ts-ignore
                                    const firePath = revert.correctPath(outDir + k._name + ".fire");
                                    await this.writefile(firePath, sceneJson);

                                    await this.writeSceneMeta(firePath, k._name, i[indexArray[idx]]);
                                } else if (k.__cid__ === "cc.Prefab") {
                                    console.log("start parse :", k._name);
                                    this.storePrefab(k._name, k);
                                    const prefabJson = this.storePrefab(k._name, k);

                                    let prefabPath = revert.correctPath(outDir + k._name + ".prefab");
                                    if (paths[indexArray[idx]]) {
                                        prefabPath = outDir + paths[indexArray[idx]][0] + ".prefab";
                                    } else if (GFrameNames[i[indexArray[idx]]]) {
                                        prefabPath = GFrameNames[i[indexArray[idx]]] + ".prefab";
                                    }

                                    await this.writefile(prefabPath, prefabJson);
                                    await this.writePrefabMeta(prefabPath, k._name, i[indexArray[idx]]);
                                    this.PrefabLoaded[i[indexArray[idx]]] = 1;
                                } else if (k.__cid__ === "cc.AnimationClip") {
                                    const targetUuid = i[indexArray[idx]];
                                    if (GAnalys[targetUuid]) {
                                        GAnalys[targetUuid].testpb = k;
                                    }
                                } else {
                                    m = i[indexArray[idx]];
                                    if (GAnalys[m] && revert.isPicture(GAnalys[m].ext)) {
                                        GAnalys[m].premultiplyAlpha = k._premultiplyAlpha;
                                        GAnalys[m].genMipmaps = k._genMipmaps;
                                        GAnalys[m].packable = k._packable;
                                    }
                                }
                            } catch {
                                continue;
                            }
                        }
                    }
                }
            } catch {
                continue;
            }
        }

        // 处理 paths：直接标注的 SceneAsset / Prefab
        for (const key in paths) {
            const [relPath, typeIndex] = paths[key];
            const uuidIndex = Number(key);
            const assetUuid = i[uuidIndex];
            const type = types[typeIndex];

            if (type === "cc.SceneAsset") {
                let g = GConfig[assetUuid] || GAnalys[assetUuid];
                if (g) {
                    g = JSON.parse(g.content);
                    const k = deserialize(g);
                    k._uuid = assetUuid;
                    console.log("start parse :", k._name);
                    let sceneJson = this.storeScene(k._name, k);
                    sceneJson = this.storeScene(k._name, k);
                    const firePath = revert.correctPath(outDir + k._name + ".fire");
                    await this.writefile(firePath, sceneJson);
                    await this.writeSceneMeta(firePath, k._name, assetUuid);
                }
            } else if (type === "cc.Prefab") {
                let g = GConfig[assetUuid] || GAnalys[assetUuid];
                if (g) {
                    const raw = JSON.parse(g.content);
                    const k = deserialize(raw);
                    k._uuid = assetUuid;
                    console.log("start parse :", k._name);
                    this.storePrefab(k._name, k);
                    const prefabJson = this.storePrefab(k._name, k);
                    const prefabPath = outDir + relPath + ".prefab";
                    await this.writefile(prefabPath, prefabJson);
                    await this.writePrefabMeta(prefabPath, k._name, assetUuid);
                    this.PrefabLoaded[assetUuid] = 1;
                }
            }
        }

        // cfg.scenes 显式场景列表
        if (cfg.scenes) {
            for (const key in cfg.scenes) {
                const uuidIndex = cfg.scenes[key];
                const sceneUuid = i[uuidIndex];
                let sceneEntry = GConfig[sceneUuid] || GAnalys[sceneUuid];
                if (sceneEntry) {
                    sceneEntry = JSON.parse(sceneEntry.content);
                    const k = deserialize(sceneEntry);
                    console.log("start parse :", k._name);
                    this.storeScene(k._name, k);
                    const sceneJson = this.storeScene(k._name, k);
                    const firePath = revert.correctPath(outDir + k._name + ".fire");
                    await this.writefile(firePath, sceneJson);
                    await this.writeSceneMeta(firePath, k._name, sceneUuid);
                }
            }
        }

        // 遍历 GConfig 中残留的 Prefab
        for (const uuid in GConfig) {
            const M = GConfig[uuid];
            if (M.content && M.ext === ".json") {
                try {
                    const N = JSON.parse(M.content);
                    const F = deserialize(N);
                    M.deserial = F;
                    if (F.__cid__ === "cc.Prefab" && !this.PrefabLoaded[uuid]) {
                        F._uuid = uuid;
                        console.log("start parse :", F._name);
                        this.storePrefab(F._name, F);
                        const prefabJson = this.storePrefab(F._name, F);
                        const prefabPath = outDir + F._name + ".prefab";
                        await this.writefile(prefabPath, prefabJson);
                        await this.writePrefabMeta(prefabPath, F._name, uuid);
                        this.PrefabLoaded[uuid] = 1;
                    }
                } catch {
                    continue;
                }
            }
        }

        // 遍历 GAnalys 中残留的 Prefab
        for (const uuid in GAnalys) {
            const O = GAnalys[uuid];
            if (O.content && O.ext === ".json") {
                try {
                    const raw = JSON.parse(O.content);
                    const U = deserialize(raw);
                    O.deserial = U;
                    if (U.__cid__ === "cc.Prefab" && !this.PrefabLoaded[uuid]) {
                        U._uuid = uuid;
                        console.log("start parse :", U._name);
                        this.storePrefab(U._name, U);
                        const prefabJson = this.storePrefab(U._name, U);
                        const prefabPath = outDir + U._name + ".prefab";
                        await this.writefile(prefabPath, prefabJson);
                        await this.writePrefabMeta(prefabPath, U._name, uuid);
                        this.PrefabLoaded[uuid] = 1;
                    }
                } catch {
                    continue;
                }
            }
        }
    }

    static storeScene(_name: string, sceneAsset: any): string {
        const arr: any[] = [];
        sceneAsset.__id__ = 0;
        arr[0] = {
            __type__: "cc.SceneAsset",
            _name: "",
            _objFlags: sceneAsset._objFlags,
            _native: sceneAsset._native,
            scene: { __id__: 1 },
            optimizationPolicy: sceneAsset.optimizationPolicy,
            asyncLoadAssets: sceneAsset.__asyncLoadAssets__ || false,
            readonly: sceneAsset.readonly,
        };

        sceneAsset.scene.__id__ = 1;

        let prefabAsset: any = null;
        if (sceneAsset.scene._prefab && !sceneAsset.scene._prefab.asset) {
            prefabAsset = { __uuid__: sceneAsset._uuid };
        }
        this.checkChildren(sceneAsset.scene, null, arr, prefabAsset);
        return JSON.stringify(arr, null, 2);
    }

    static storePrefab(_name: string, prefabAsset: any): string {
        const arr: any[] = [];
        prefabAsset.__id__ = 0;
        arr[0] = {
            __type__: "cc.Prefab",
            _name: "",
            _objFlags: prefabAsset._objFlags,
            _native: prefabAsset._native,
            data: { __id__: 1 },
            optimizationPolicy: prefabAsset.optimizationPolicy,
            asyncLoadAssets: prefabAsset.__asyncLoadAssets__ || false,
            readonly: prefabAsset.readonly,
        };

        prefabAsset.data.__id__ = 1;
        let prefabInfo: any = null;
        if (prefabAsset.data._prefab && !prefabAsset.data._prefab.asset) {
            prefabInfo = { __uuid__: prefabAsset._uuid };
        }
        this.checkChildren(prefabAsset.data, null, arr, prefabInfo);
        return JSON.stringify(arr, null, 2);
    }

    static checkChildren(node: any, parent: any | null, arr: any[], prefabInfo: any | null): void {
        node.__id__ = arr.length;
        const s: any = {
            __type__: node.__cid__,
            _name: node._name,
            _objFlags: node._objFlags,
        };
        s._parent = parent ? { __id__: parent.__id__ } : null;

        arr[arr.length] = s;
        s._children = [];

        if (node._children) {
            for (let idx = 0; idx < node._children.length; idx++) {
                s._children[idx] = { __id__: arr.length };
                this.checkChildren(node._children[idx], node, arr, prefabInfo);
            }
        }

        s._active = node._active;
        s._components = [];

        if (node._components) {
            for (let idx = 0; idx < node._components.length; idx++) {
                if (node._components[idx]) {
                    s._components[s._components.length] = { __id__: arr.length };
                    this.checkComponents(node._components[idx], node, arr);
                }
            }
        }

        s._prefab = node._prefab ? { __id__: arr.length } : null;

        if (node.__cid__ === "cc.Scene") {
            s._eulerAngles = undefined;
            s._skewX = undefined;
            s._skewY = undefined;
            s.autoReleaseAssets = node.autoReleaseAssets;
        } else if (node.__values__ && node.__values__.length > 0) {
            for (const key of node.__values__) {
                if (
                    key !== "_name" &&
                    key !== "_id" &&
                    key !== "_objFlags" &&
                    key !== "_active" &&
                    key !== "_parent" &&
                    key !== "_components" &&
                    key !== "_children" &&
                    key !== "node" &&
                    key !== "_prefab" &&
                    key !== "__prefab"
                ) {
                    if (Array.isArray(node[key])) {
                        s[key] = [];
                        for (let idx = 0; idx < node[key].length; idx++) {
                            const v = this.initScriptParams(node[key][idx], arr);
                            if (v) s[key][s[key].length] = v;
                        }
                    } else if (typeof node[key] === "object" && node[key] !== null) {
                        const v = this.initScriptParams(node[key], arr);
                        if (v) s[key] = v;
                    } else {
                        s[key] = node[key];
                    }
                }
            }
        }

        if (s.__type__ === "cc.Node" && !s.groupIndex && s._groupIndex) {
            s.groupIndex = s._groupIndex;
        }

        if (node._prefab && node._prefab.root) {
            const info: any = {
                __type__: "cc.PrefabInfo",
                root: { __id__: node._prefab.root.__id__ },
                asset: null,
                fileId: node._prefab.fileId,
                sync: node._prefab.sync,
            };

            if (prefabInfo) {
                info.asset = { __uuid__: prefabInfo.__uuid__ };
            } else if (node._prefab.asset) {
                info.asset = { __uuid__: node._prefab.asset._uuid };
            }

            if (!info.asset || !info.asset.__uuid__) {
                info.sync = false;
            }
            arr[arr.length] = info;
        }
    }

    static initScriptParams(obj: any, arr: any[]): any {
        if (typeof obj !== "object" || obj === null) return obj;

        if (obj._depend_uuid) {
            return { __uuid__: UuidUtils.decompressUuid(obj._depend_uuid) };
        }

        switch (obj.__cid__) {
            case "cc.SpriteFrame":
            case "cc.AudioClip":
            case "sp.SkeletonData":
            case "cc.Material":
            case "dragonBones.DragonBonesAsset":
            case "dragonBones.DragonBonesAtlasAsset":
            case "cc.Asset":
            case "cc.JsonAsset":
            case "cc.BufferAsset": {
                const t = obj.node || obj;
                if (t._uuid) return { __uuid__: t._uuid };
                break;
            }
            case "cc.Prefab": {
                const t = obj.node || obj;
                if (t._uuid) {
                    if (UNKOWN_PBS) {
                        UNKOWN_PBS[t._uuid] = t._name;
                    }
                    return { __uuid__: t._uuid };
                }
                break;
            }
            case "cc.SpriteAtlas": {
                let atlasUuid: string | null = null;
                for (const key of Object.keys(obj._spriteFrames)) {
                    const sf = obj._spriteFrames[key];
                    if (sf.__cid__ === "cc.SpriteFrame" && sf._uuid && this.mapplist[sf._uuid]) {
                        atlasUuid = this.mapplist[sf._uuid];
                        break;
                    }
                }
                return atlasUuid ? { __uuid__: atlasUuid } : null;
            }
            case "cc.Button":
                return { __id__: obj.__id__ || obj.node.__id__ };
            case "cc.ClickEvent": {
                const t: any = { __type__: obj.__cid__ };
                obj.__id__ = arr.length;
                arr[arr.length] = t;
                this.checkComponentClickEvent(t, obj);
                return { __id__: obj.__id__ };
            }
            case "cc.Color":
                return { __type__: obj.__cid__, r: obj.r, g: obj.g, b: obj.b, a: obj.a };
            case "cc.Quat":
                return { __type__: obj.__cid__, x: obj.x, y: obj.y, z: obj.z, w: obj.w };
            case "cc.Vec2":
                return { __type__: obj.__cid__, x: obj.x, y: obj.y };
            case "cc.Vec3":
                return { __type__: obj.__cid__, x: obj.x, y: obj.y, z: obj.z };
            case "cc.Size":
                return { __type__: obj.__cid__, width: obj.width, height: obj.height };
            case "cc.Rect":
                return {
                    __type__: obj.__cid__,
                    x: obj.x,
                    y: obj.y,
                    width: obj.width,
                    height: obj.height,
                };
            case "TypedArray":
                return { __type__: obj.__cid__, ctor: "Float64Array", array: obj._trs };
        }

        return { __id__: obj.__id__ };
    }

    static checkComponents(comp: any, node: any, arr: any[]): void {
        comp.__id__ = arr.length;

        const s: any = {
            __type__: comp.__cid__,
            _name: comp._name,
            _objFlags: comp._objFlags,
            node: { __id__: node.__id__ },
            _enabled: comp._enabled,
        };

        if (!comp.__cid__) {
            s.__type__ = "cc.MissingScript";
            s._name = "";
            s._objFlags = 0;
            s._enabled = true;
        }

        arr[arr.length] = s;

        if (comp.__values__ && comp.__values__.length > 0) {
            for (const key of comp.__values__) {
                if (
                    key !== "_name" &&
                    key !== "_id" &&
                    key !== "node" &&
                    key !== "_objFlags" &&
                    key !== "_active" &&
                    key !== "_parent" &&
                    key !== "_components" &&
                    key !== "_children" &&
                    key !== "__prefab"
                ) {
                    if (Array.isArray(comp[key])) {
                        s[key] = [];
                        for (let idx = 0; idx < comp[key].length; idx++) {
                            const v = this.initScriptParams(comp[key][idx], arr);
                            if (v) s[key][s[key].length] = v;
                        }
                    } else if (typeof comp[key] === "object" && comp[key] !== null) {
                        const v = this.initScriptParams(comp[key], arr);
                        if (v) s[key] = v;
                    } else {
                        s[key] = comp[key];
                    }
                }
            }

            if (comp.__cid__ === "sp.Skeleton") {
                if (comp._N$skeletonData && comp._N$skeletonData._depend_uuid) {
                    const u = UuidUtils.decompressUuid(comp._N$skeletonData._depend_uuid);
                    s._N$skeletonData = { __uuid__: u };
                }
            } else if (comp.__cid__ === "cc.ScrollView" || comp.__cid__ === "cc.PageView") {
                if (s._N$content && !s.content) s.content = s._N$content;
            } else if (comp.__cid__ === "cc.Label") {
                if (!s._N$string && s._string) s._N$string = s._string;
            } else if (comp.__cid__ === "cc.Animation") {
                if (comp._defaultClip && comp._defaultClip._depend_uuid) {
                    const u = UuidUtils.decompressUuid(comp._defaultClip._depend_uuid);
                    s._defaultClip = { __uuid__: u };
                }
            } else if (!comp.__cid__.includes(".")) {
                for (const key in comp) {
                    if (
                        Object.prototype.hasOwnProperty.call(comp, key) &&
                        s[key] === undefined &&
                        key !== "_name" &&
                        key !== "_id" &&
                        key !== "node" &&
                        key !== "_objFlags" &&
                        key !== "_active" &&
                        key !== "_parent" &&
                        key !== "_components" &&
                        key !== "_children" &&
                        key !== "__cid__" &&
                        key !== "__id__" &&
                        key !== "__values__" &&
                        key !== "__prefab"
                    ) {
                        if (Array.isArray(comp[key])) {
                            s[key] = [];
                            for (let idx = 0; idx < comp[key].length; idx++) {
                                const v = this.initScriptParams(comp[key][idx], arr);
                                if (v) s[key][s[key].length] = v;
                            }
                        } else if (typeof comp[key] === "object" && comp[key] !== null) {
                            const v = this.initScriptParams(comp[key], arr);
                            if (v) s[key] = v;
                        } else {
                            s[key] = comp[key];
                        }
                    }
                }
            }
        }
    }

    static checkComponentClickEvent(out: any, src: any): void {
        if (src.target) {
            out.target = { __id__: src.target.__id__ };
        } else {
            out.target = null;
        }
        out.component = src.component;
        out._componentId = src._componentId;
        out.handler = src.handler;
        out.customEventData = src.customEventData;
    }
}
