const { unpackJSONs, deserialize } = require("./libs/parseclass");
const UuidUtils = require("./utils/uuid-utils");
const DirUtils = require("./utils/dir-utils");
const fs = require("fs");

// 记录已经生成过的 Prefab，避免重复输出
const PrefabLoaded = {};

const RevertPrefab = {
    // 写入普通文件（保证目录存在）
    async writefile(filePath, content) {
        const normalizedPath = filePath.replace(/\\/g, "/");
        const segments = normalizedPath.split("/");
        segments.pop();

        await DirUtils.dirExists(segments.join("/"));

        fs.writeFileSync(normalizedPath, content, { undefined: void 0 }, (err) => {
            if (err) {
                console.log("newMetaFiles err:", err);
            }
        });
    },

    // 写入场景 .fire 对应的 meta
    async writeSceneMeta(filePath, name, uuid) {
        const metaContent = `{
      "ver": "1.3.2",
      "uuid": "${uuid}",
      "importer": "prefab",
      "optimizationPolicy": "AUTO",
      "asyncLoadAssets": false,
      "readonly": false,
      "subMetas": {}
}`;

        fs.writeFileSync(`${filePath}.meta`, metaContent, { undefined: void 0 }, (err) => {
            if (err) {
                console.log("newMetaSbine err:", err);
            }
        });
    },

    // 写入 Prefab 对应的 meta
    async writePrefabMeta(filePath, name, uuid) {
        const metaContent = `{
      "ver": "1.3.2",
      "uuid": "${uuid}",
      "importer": "prefab",
      "optimizationPolicy": "AUTO",
      "asyncLoadAssets": false,
      "readonly": false,
      "subMetas": {}
}`;

        fs.writeFileSync(`${filePath}.meta`, metaContent, { undefined: void 0 }, (err) => {
            if (err) {
                console.log("newMetaSbine err:", err);
            }
        });
    },

    // 解析 bundle 配置，生成场景 / prefab / 资源参数
    async parseBundleConfig(ctx, bundleName, configJson) {
        const { assets: GAnalys, configs: GConfig, spriteFrameNames: GFrameNames } = ctx.state;
        const { isPicture, correctPath } = ctx.helpers;
        const { dirOut } = ctx;

        const { uuids: uuidsList, types: typeList } = configJson;

        const decodeUuid = (value) => {
            if (typeof value !== "string" || value.includes("-")) {
                return value;
            }
            if (value.length === 22 || value.length === 23 || value.length === 32) {
                return UuidUtils.decompressUuid(value);
            }
            return value;
        };

        // 先解压短 uuid
        for (let eIndex = 0; eIndex < uuidsList.length; eIndex++) {
            uuidsList[eIndex] = decodeUuid(uuidsList[eIndex]);
        }

        const packs = configJson.packs || {};
        const paths = configJson.paths || {};
        const outDir = `${dirOut}${bundleName}/`;

        // packs 中的内容优先处理（可能是 Texture2D、Prefab 等）
        for (const [packUuid, packIndices] of Object.entries(packs)) {
            try {
                const packConfig = GConfig[packUuid] || GAnalys[packUuid];
                if (!packConfig) continue;

                const packJson = JSON.parse(packConfig.content);

                // cc.Texture2D 的 pack 配置，记录贴图属性
                if (packJson.type === "cc.Texture2D" && packJson.data) {
                    const textureData = packJson.data.split("|");
                    for (let idx = 0; idx < textureData.length; idx++) {
                        const one = textureData[idx];
                        const texUuid = uuidsList[packIndices[idx]];
                        const texAttrs = one.split(",");

                        if (texAttrs.length === 8 && GAnalys[texUuid] && isPicture(GAnalys[texUuid].ext)) {
                            GAnalys[texUuid].premultiplyAlpha = texAttrs[5].charCodeAt(0) === 49;
                            GAnalys[texUuid].genMipmaps = texAttrs[6].charCodeAt(0) === 49;
                            GAnalys[texUuid].packable = texAttrs[7].charCodeAt(0) === 49;
                        }
                    }
                } else {
                    const unpacked = unpackJSONs(packJson);

                    if (Array.isArray(unpacked)) {
                        for (let packIndex = 0; packIndex < unpacked.length; packIndex++) {
                            try {
                                // resource 为反序列化后的资源对象
                                const resource = deserialize(unpacked[packIndex]);
                                resource._uuid = uuidsList[packIndices[packIndex]];

                                // 场景
                                if (resource.__cid__ === "cc.SceneAsset") {
                                    console.log("start parse :", resource._name);
                                    const sceneContent = this.storeScene(ctx, resource._name, resource);
                                    const sceneOutPath = correctPath(outDir + resource._name + ".fire");

                                    await this.writefile(sceneOutPath, sceneContent);
                                    await this.writeSceneMeta(sceneOutPath, resource._name, uuidsList[packIndices[packIndex]]);

                                    // Prefab
                                } else if (resource.__cid__ === "cc.Prefab") {
                                    console.log("start parse :", resource._name);
                                    const prefabContent = this.storePrefab(ctx, resource._name, resource);
                                    let prefabOutPath = correctPath(outDir + resource._name + ".prefab");

                                    if (paths[packIndices[packIndex]]) {
                                        prefabOutPath = `${outDir}${paths[packIndices[packIndex]][0]}.prefab`;
                                    } else if (GFrameNames[uuidsList[packIndices[packIndex]]]) {
                                        prefabOutPath = `${GFrameNames[uuidsList[packIndices[packIndex]]]}.prefab`;
                                    }

                                    await this.writefile(prefabOutPath, prefabContent);
                                    await this.writePrefabMeta(prefabOutPath, resource._name, uuidsList[packIndices[packIndex]]);
                                    PrefabLoaded[uuidsList[packIndices[packIndex]]] = 1;

                                    // AnimationClip
                                } else if (resource.__cid__ === "cc.AnimationClip") {
                                    if (GAnalys[uuidsList[packIndices[packIndex]]]) {
                                        GAnalys[uuidsList[packIndices[packIndex]]].testpb = resource;
                                    }
                                } else {
                                    // 其它资源上可能也携带纹理参数
                                    const targetUuid = uuidsList[packIndices[packIndex]];
                                    if (GAnalys[targetUuid] && isPicture(GAnalys[targetUuid].ext)) {
                                        GAnalys[targetUuid].premultiplyAlpha = resource._premultiplyAlpha;
                                        GAnalys[targetUuid].genMipmaps = resource._genMipmaps;
                                        GAnalys[targetUuid].packable = resource._packable;
                                    }
                                }
                            } catch (err) {
                                continue;
                            }
                        }
                    }
                }
            } catch (err) {
                continue;
            }
        }

        // paths 中的场景 / prefab
        for (const pathIndex in paths) {
            const [relativePath, typeIndex] = paths[pathIndex];
            const uuid = uuidsList[pathIndex];
            const typeName = typeList[typeIndex];

            // Scene
            if (typeName === "cc.SceneAsset") {
                let sceneConfig = GConfig[uuid] || GAnalys[uuid];
                if (!sceneConfig) continue;

                sceneConfig = JSON.parse(sceneConfig.content);
                const sceneObj = deserialize(sceneConfig);
                sceneObj._uuid = uuid;

                console.log("start parse :", sceneObj._name);
                const sceneContent = this.storeScene(ctx, sceneObj._name, sceneObj);

                const sceneOutPath = correctPath(outDir + sceneObj._name + ".fire");
                await this.writefile(sceneOutPath, sceneContent);
                await this.writeSceneMeta(sceneOutPath, sceneObj._name, uuid);
            } else if (typeName === "cc.Prefab") {
                // Prefab
                let prefabConfig = GConfig[uuid] || GAnalys[uuid];
                if (!prefabConfig) continue;

                prefabConfig = JSON.parse(prefabConfig.content);
                const prefabObj = deserialize(prefabConfig);
                prefabObj._uuid = uuid;

                console.log("start parse :", prefabObj._name);
                const prefabJson = this.storePrefab(ctx, prefabObj._name, prefabObj);
                const prefabOutPath = `${outDir}${relativePath}.prefab`;

                await this.writefile(prefabOutPath, prefabJson);
                await this.writePrefabMeta(prefabOutPath, prefabObj._name, uuid);
                PrefabLoaded[uuid] = 1;
            }
        }

        // e.scenes 兜底再生成一次场景
        if (configJson.scenes) {
            for (const sceneKey in configJson.scenes) {
                const sceneUuid = uuidsList[configJson.scenes[sceneKey]];
                let sceneConfig = GConfig[sceneUuid] || GAnalys[sceneUuid];

                if (!sceneConfig) continue;

                sceneConfig = JSON.parse(sceneConfig.content);
                const sceneObj = deserialize(sceneConfig);

                console.log("start parse :", sceneObj._name);
                const sceneContent = this.storeScene(ctx, sceneObj._name, sceneObj);
                const sceneOutPath = correctPath(outDir + sceneObj._name + ".fire");

                await this.writefile(sceneOutPath, sceneContent);
                await this.writeSceneMeta(sceneOutPath, sceneObj._name, sceneUuid);
            }
        }

        // 遍历 GConfig，找到没有被 packs/paths 处理到的 Prefab
        for (const configUuid in GConfig) {
            const configItem = GConfig[configUuid];

            if (!configItem.content || configItem.ext !== ".json") continue;

            try {
                const parsedContent = JSON.parse(configItem.content);
                const deserialObj = deserialize(parsedContent);
                configItem.deserial = deserialObj;

                if (deserialObj.__cid__ !== "cc.Prefab" || PrefabLoaded[configUuid]) {
                    continue;
                }

                deserialObj._uuid = configUuid;

                console.log("start parse :", deserialObj._name);
                const prefabContent = this.storePrefab(ctx, deserialObj._name, deserialObj);
                const prefabOut = outDir + deserialObj._name + ".prefab";

                await this.writefile(prefabOut, prefabContent);
                await this.writePrefabMeta(prefabOut, deserialObj._name, configUuid);

                PrefabLoaded[configUuid] = 1;
            } catch (err) {
                continue;
            }
        }

        // 遍历 GAnalys，同样补齐 Prefab
        for (const analysUuid in GAnalys) {
            const analysItem = GAnalys[analysUuid];

            if (!analysItem.content || analysItem.ext !== ".json") continue;

            try {
                const parsedContent = JSON.parse(analysItem.content);
                const deserialObj = deserialize(parsedContent);
                analysItem.deserial = deserialObj;

                if (deserialObj.__cid__ !== "cc.Prefab" || PrefabLoaded[analysUuid]) {
                    continue;
                }

                deserialObj._uuid = analysUuid;

                console.log("start parse :", deserialObj._name);
                const prefabContent = this.storePrefab(ctx, deserialObj._name, deserialObj);
                const prefabOut = outDir + deserialObj._name + ".prefab";

                await this.writefile(prefabOut, prefabContent);
                await this.writePrefabMeta(prefabOut, deserialObj._name, analysUuid);

                PrefabLoaded[analysUuid] = 1;
            } catch (err) {
                continue;
            }
        }
    },

    // 序列化场景为 .fire JSON
    storeScene(ctx, name, sceneAsset) {
        const nodes = [];

        nodes[(sceneAsset.__id__ = 0)] = {
            __type__: "cc.SceneAsset",
            _name: "",
            _objFlags: sceneAsset._objFlags,
            _native: sceneAsset._native,
            scene: { __id__: 1 },
            optimizationPolicy: sceneAsset.optimizationPolicy,
            asyncLoadAssets: sceneAsset.__asyncLoadAssets__ || !1,
            readonly: sceneAsset.readonly,
        };

        sceneAsset.scene.__id__ = 1;

        let prefabAsset = null;
        if (sceneAsset.scene._prefab && !sceneAsset.scene._prefab.asset) {
            prefabAsset = { __uuid__: sceneAsset._uuid };
        }

        this.checkChildren(ctx, sceneAsset.scene, null, nodes, prefabAsset);

        return JSON.stringify(nodes, null, 2);
    },

    // 序列化 Prefab 为 .prefab JSON
    storePrefab(ctx, name, prefabAsset) {
        const nodes = [];

        nodes[(prefabAsset.__id__ = 0)] = {
            __type__: "cc.Prefab",
            _name: "",
            _objFlags: prefabAsset._objFlags,
            _native: prefabAsset._native,
            data: { __id__: 1 },
            optimizationPolicy: prefabAsset.optimizationPolicy,
            asyncLoadAssets: prefabAsset.__asyncLoadAssets__ || !1,
            readonly: prefabAsset.readonly,
        };

        prefabAsset.data.__id__ = 1;

        let prefabInfo = null;
        if (prefabAsset.data._prefab && !prefabAsset.data._prefab.asset) {
            prefabInfo = { __uuid__: prefabAsset._uuid };
        }

        this.checkChildren(ctx, prefabAsset.data, null, nodes, prefabInfo);

        return JSON.stringify(nodes, null, 2);
    },

    // 递归处理节点树
    checkChildren(ctx, node, parent, nodes, prefabInfo) {
        node.__id__ = nodes.length;

        const serialized = {
            __type__: node.__cid__,
            _name: node._name,
            _objFlags: node._objFlags,
        };

        serialized._parent = parent ? { __id__: parent.__id__ } : null;

        nodes[nodes.length] = serialized;
        serialized._children = [];

        // 子节点
        if (node._children) {
            for (let idx = 0; idx < node._children.length; idx++) {
                serialized._children[idx] = { __id__: nodes.length };
                this.checkChildren(ctx, node._children[idx], node, nodes, prefabInfo);
            }
        }

        // 组件
        serialized._active = node._active;
        serialized._components = [];

        if (node._components) {
            for (let idx = 0; idx < node._components.length; idx++) {
                if (node._components[idx]) {
                    serialized._components[serialized._components.length] = { __id__: nodes.length };
                    this.checkComponents(ctx, node._components[idx], node, nodes);
                }
            }
        }

        serialized._prefab = node._prefab ? { __id__: nodes.length } : null;

        if (node.__cid__ === "cc.Scene") {
            serialized._eulerAngles = void 0;
            serialized._skewX = void 0;
            serialized._skewY = void 0;
            serialized.autoReleaseAssets = node.autoReleaseAssets;
        } else if (node.__values__ && node.__values__.length > 0) {
            for (const fieldName of node.__values__) {
                if (
                    fieldName === "_name" ||
                    fieldName === "_id" ||
                    fieldName === "_objFlags" ||
                    fieldName === "_active" ||
                    fieldName === "_parent" ||
                    fieldName === "_components" ||
                    fieldName === "_children" ||
                    fieldName === "node" ||
                    fieldName === "_prefab" ||
                    fieldName === "__prefab"
                ) {
                    continue;
                }

                if (Array.isArray(node[fieldName])) {
                    serialized[fieldName] = [];
                    for (let idx = 0; idx < node[fieldName].length; idx++) {
                        const scriptParam = this.initScriptParams(ctx, node[fieldName][idx], nodes);
                        if (scriptParam) {
                            serialized[fieldName][serialized[fieldName].length] = scriptParam;
                        }
                    }
                } else if (typeof node[fieldName] === "object" && node[fieldName] !== null) {
                    const scriptParam = this.initScriptParams(ctx, node[fieldName], nodes);
                    if (scriptParam) {
                        serialized[fieldName] = scriptParam;
                    }
                } else {
                    serialized[fieldName] = node[fieldName];
                }
            }
        }

        if (serialized.__type__ === "cc.Node" && !serialized.groupIndex && serialized._groupIndex) {
            serialized.groupIndex = serialized._groupIndex;
        }

        // PrefabInfo
        if (node._prefab && node._prefab.root) {
            const prefabInfoNode = {
                __type__: "cc.PrefabInfo",
                root: { __id__: node._prefab.root.__id__ },
                asset: null,
                fileId: node._prefab.fileId,
                sync: node._prefab.sync,
            };

            if (prefabInfo) {
                prefabInfoNode.asset = { __uuid__: prefabInfo.__uuid__ };
            } else if (node._prefab.asset) {
                prefabInfoNode.asset = { __uuid__: node._prefab.asset._uuid };
            }

            if (!prefabInfoNode.asset || !prefabInfoNode.asset.__uuid__) {
                prefabInfoNode.sync = !1;
            }

            nodes[nodes.length] = prefabInfoNode;
        }
    },

    // 序列化脚本字段 / 资源引用
    initScriptParams(ctx, value, nodes) {
        const { atlasBySpriteFrame: GMapPlist } = ctx.state;

        if (typeof value !== "object" || value === null) {
            return value;
        }

        if (value._depend_uuid) {
            return { __uuid__: UuidUtils.decompressUuid(value._depend_uuid) };
        }

        switch (value.__cid__) {
            case "cc.SpriteFrame":
            case "cc.AudioClip":
            case "sp.SkeletonData":
            case "cc.Material":
            case "dragonBones.DragonBonesAsset":
            case "dragonBones.DragonBonesAtlasAsset":
            case "cc.Asset":
            case "cc.JsonAsset":
            case "cc.BufferAsset": {
                const target = value.node || value;
                if (target._uuid) {
                    return { __uuid__: target._uuid };
                }
                break;
            }
            case "cc.Prefab": {
                const target = value.node || value;
                if (target._uuid) {
                    if (typeof UNKOWN_PBS !== "undefined" && UNKOWN_PBS) {
                        UNKOWN_PBS[target._uuid] = target._name;
                    }
                    return { __uuid__: target._uuid };
                }
                break;
            }
            case "cc.SpriteAtlas": {
                let atlasUuid = null;
                for (const key of Object.keys(value._spriteFrames)) {
                    const frame = value._spriteFrames[key];
                    if (frame.__cid__ === "cc.SpriteFrame" && frame._uuid && GMapPlist[frame._uuid]) {
                        atlasUuid = GMapPlist[frame._uuid];
                        break;
                    }
                }
                return atlasUuid ? { __uuid__: atlasUuid } : null;
            }
            case "cc.Button":
                return { __id__: value.__id__ || value.node.__id__ };
            case "cc.ClickEvent":
                const clickEvent = { __type__: value.__cid__ };
                value.__id__ = nodes.length;
                nodes[nodes.length] = clickEvent;
                this.checkComponentClickEvent(clickEvent, value);
                return { __id__: value.__id__ };
            case "cc.Color":
                return { __type__: value.__cid__, r: value.r, g: value.g, b: value.b, a: value.a };
            case "cc.Quat":
                return { __type__: value.__cid__, x: value.x, y: value.y, z: value.z, w: value.w };
            case "cc.Vec2":
                return { __type__: value.__cid__, x: value.x, y: value.y };
            case "cc.Vec3":
                return { __type__: value.__cid__, x: value.x, y: value.y, z: value.z };
            case "cc.Size":
                return { __type__: value.__cid__, width: value.width, height: value.height };
            case "cc.Rect":
                return {
                    __type__: value.__cid__,
                    x: value.x,
                    y: value.y,
                    width: value.width,
                    height: value.height,
                };
            case "TypedArray":
                return {
                    __type__: value.__cid__,
                    ctor: "Float64Array",
                    array: value._trs,
                };
        }

        return { __id__: value.__id__ };
    },

    // 处理组件
    checkComponents(ctx, component, node, nodes) {
        component.__id__ = nodes.length;

        const serialized = {
            __type__: component.__cid__,
            _name: component._name,
            _objFlags: component._objFlags,
            node: { __id__: node.__id__ },
            _enabled: component._enabled,
        };

        if (!component.__cid__) {
            serialized.__type__ = "cc.MissingScript";
            serialized._name = "";
            serialized._objFlags = 0;
            serialized._enabled = !0;
        }

        nodes[nodes.length] = serialized;

        if (component.__values__ && component.__values__.length > 0) {
            // 常规序列化字段
            for (const fieldName of component.__values__) {
                if (
                    fieldName === "_name" ||
                    fieldName === "_id" ||
                    fieldName === "node" ||
                    fieldName === "_objFlags" ||
                    fieldName === "_active" ||
                    fieldName === "_parent" ||
                    fieldName === "_components" ||
                    fieldName === "_children" ||
                    fieldName === "__prefab"
                ) {
                    continue;
                }

                if (Array.isArray(component[fieldName])) {
                    serialized[fieldName] = [];
                    for (let idx = 0; idx < component[fieldName].length; idx++) {
                        const scriptParam = this.initScriptParams(ctx, component[fieldName][idx], nodes);
                        if (scriptParam) {
                            serialized[fieldName][serialized[fieldName].length] = scriptParam;
                        }
                    }
                } else if (typeof component[fieldName] === "object" && component[fieldName] !== null) {
                    const scriptParam = this.initScriptParams(ctx, component[fieldName], nodes);
                    if (scriptParam) {
                        serialized[fieldName] = scriptParam;
                    }
                } else {
                    serialized[fieldName] = component[fieldName];
                }
            }

            // 特殊组件字段兼容
            if (component.__cid__ === "sp.Skeleton") {
                if (component._N$skeletonData && component._N$skeletonData._depend_uuid) {
                    const skeletonUuid = UuidUtils.decompressUuid(component._N$skeletonData._depend_uuid);
                    serialized._N$skeletonData = { __uuid__: skeletonUuid };
                }
            } else if (component.__cid__ === "cc.ScrollView" || component.__cid__ === "cc.PageView") {
                if (serialized._N$content && !serialized.content) {
                    serialized.content = serialized._N$content;
                }
            } else if (component.__cid__ === "cc.Label") {
                if (!serialized._N$string && serialized._string) {
                    serialized._N$string = serialized._string;
                }
            } else if (component.__cid__ === "cc.Animation") {
                if (component._defaultClip && component._defaultClip._depend_uuid) {
                    const clipUuid = UuidUtils.decompressUuid(component._defaultClip._depend_uuid);
                    serialized._defaultClip = { __uuid__: clipUuid };
                }
            } else if (!component.__cid__.includes(".")) {
                // 自定义脚本，补充未在 __values__ 中列出的字段
                for (const fieldName in component) {
                    if (
                        !Object.prototype.hasOwnProperty.call(component, fieldName) ||
                        serialized[fieldName] !== undefined ||
                        fieldName === "_name" ||
                        fieldName === "_id" ||
                        fieldName === "node" ||
                        fieldName === "_objFlags" ||
                        fieldName === "_active" ||
                        fieldName === "_parent" ||
                        fieldName === "_components" ||
                        fieldName === "_children" ||
                        fieldName === "__cid__" ||
                        fieldName === "__id__" ||
                        fieldName === "__values__" ||
                        fieldName === "__prefab"
                    ) {
                        continue;
                    }

                    if (Array.isArray(component[fieldName])) {
                        serialized[fieldName] = [];
                        for (let idx = 0; idx < component[fieldName].length; idx++) {
                            const scriptParam = this.initScriptParams(ctx, component[fieldName][idx], nodes);
                            if (scriptParam) {
                                serialized[fieldName][serialized[fieldName].length] = scriptParam;
                            }
                        }
                    } else if (typeof component[fieldName] === "object" && component[fieldName] !== null) {
                        const scriptParam = this.initScriptParams(ctx, component[fieldName], nodes);
                        if (scriptParam) {
                            serialized[fieldName] = scriptParam;
                        }
                    } else {
                        serialized[fieldName] = component[fieldName];
                    }
                }
            }
        }
    },

    // Button ClickEvent 序列化
    checkComponentClickEvent(target, source) {
        target.target = source.target ? { __id__: source.target.__id__ } : null;
        target.component = source.component;
        target._componentId = source._componentId;
        target.handler = source.handler;
        target.customEventData = source.customEventData;
    },
};

module.exports = RevertPrefab;
