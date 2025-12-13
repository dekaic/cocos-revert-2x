const UuidUtils = require("../../utils/uuid-utils");

const decodeUuid = (value) => {
    if (typeof value !== "string" || value.includes("-")) {
        return value;
    }
    if (value.length === 22 || value.length === 23 || value.length === 32) {
        return UuidUtils.decompressUuid(value);
    }
    return value;
};

function normalizeManifest(cfgJson) {
    const debug = cfgJson.debug !== false;

    const uuidByIndex = Array.isArray(cfgJson.uuids) ? cfgJson.uuids.map(decodeUuid) : [];
    const types = Array.isArray(cfgJson.types) ? cfgJson.types : [];

    const assetInfoByUuid = {};
    const paths = cfgJson.paths || {};
    for (const [key, entry] of Object.entries(paths)) {
        if (!Array.isArray(entry) || entry.length < 2) continue;
        const assetPath = entry[0];
        const rawType = entry[1];
        const isSubAsset = entry[2] === 1;

        let uuid = null;
        let type = null;

        if (debug) {
            uuid = decodeUuid(key);
            type = typeof rawType === "string" ? rawType : types[rawType];
        } else {
            const uuidIndex = Number(key);
            uuid = uuidByIndex[uuidIndex];
            type = types[rawType];
        }

        if (!uuid) continue;
        assetInfoByUuid[uuid] = {
            uuid,
            path: assetPath,
            type,
            isSubAsset,
        };
    }

    const packById = {};
    const packs = cfgJson.packs || {};
    for (const [packId, packEntries] of Object.entries(packs)) {
        if (!Array.isArray(packEntries)) continue;
        const assetUuids = packEntries
            .map((value) => {
                if (typeof value === "number") return uuidByIndex[value];
                if (typeof value === "string" && !debug) return uuidByIndex[Number(value)];
                return decodeUuid(value);
            })
            .filter(Boolean);
        packById[packId] = { id: packId, assetUuids };
    }

    const importVerByUuid = {};
    const packVerById = {};
    const nativeVerByUuid = {};

    const versions = cfgJson.versions || {};
    const importPairs = Array.isArray(versions.import) ? versions.import : [];
    const nativePairs = Array.isArray(versions.native) ? versions.native : [];

    for (let i = 0; i + 1 < importPairs.length; i += 2) {
        const key = importPairs[i];
        const ver = importPairs[i + 1];
        if (typeof key === "string") {
            packVerById[key] = ver;
        } else {
            const uuid = uuidByIndex[key];
            if (uuid) importVerByUuid[uuid] = ver;
        }
    }

    for (let i = 0; i + 1 < nativePairs.length; i += 2) {
        const uuid = uuidByIndex[nativePairs[i]];
        const ver = nativePairs[i + 1];
        if (uuid) nativeVerByUuid[uuid] = ver;
    }

    const redirectByUuid = {};
    const deps = Array.isArray(cfgJson.deps) ? cfgJson.deps : [];
    const redirectPairs = Array.isArray(cfgJson.redirect) ? cfgJson.redirect : [];
    for (let i = 0; i + 1 < redirectPairs.length; i += 2) {
        const uuidKey = redirectPairs[i];
        const depIndex = redirectPairs[i + 1];
        const uuid =
            typeof uuidKey === "number"
                ? uuidByIndex[uuidKey]
                : typeof uuidKey === "string" && !debug
                ? uuidByIndex[Number(uuidKey)]
                : decodeUuid(uuidKey);
        const depName = deps[depIndex];
        if (uuid && depName) redirectByUuid[uuid] = depName;
    }

    const scenes = {};
    const rawScenes = cfgJson.scenes || {};
    for (const [scenePath, sceneUuidKey] of Object.entries(rawScenes)) {
        const uuid =
            typeof sceneUuidKey === "number"
                ? uuidByIndex[sceneUuidKey]
                : typeof sceneUuidKey === "string" && !debug
                ? uuidByIndex[Number(sceneUuidKey)]
                : decodeUuid(sceneUuidKey);
        if (uuid) scenes[scenePath] = uuid;
    }

    return {
        debug,
        uuidByIndex,
        assetInfoByUuid,
        packById,
        importVerByUuid,
        packVerById,
        nativeVerByUuid,
        redirectByUuid,
        scenes,
        deps,
        importBase: cfgJson.importBase || "import",
        nativeBase: cfgJson.nativeBase || "native",
        name: cfgJson.name,
    };
}

module.exports = {
    normalizeManifest,
};

