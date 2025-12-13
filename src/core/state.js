const EXT_MAP = {
    "cc.TextAsset": ".txt",
    "cc.JsonAsset": ".json",
    "cc.Texture2D": ".png",
    "cc.Prefab": ".prefab",
    "cc.AudioClip": ".mp3",
    "sp.SkeletonData": ".json",
    "cc.Asset": ".unknown",
    "cc.ParticleAsset": ".plist",
    "cc.AnimationClip": ".anim",
    "cc.TTFFont": ".ttf",
    "cc.BufferAsset": ".bin",
    "dragonBones.DragonBonesAsset": ".json",
    "dragonBones.DragonBonesAtlasAsset": ".json",
};

function createRevertState() {
    return {
        assets: {},
        configs: {},
        animClipsByName: {},
        bundlePriority: {},
        atlasBySpriteFrame: {},
        textureBySpriteFrame: {},
        unknownFrames: {},
        bundleCfgJson: {},
        bundleNormalizedManifest: {},
        spriteFrameNames: {},
    };
}

module.exports = {
    EXT_MAP,
    createRevertState,
};
