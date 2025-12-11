// Shared state for revert process
const GAnalys = {}; // 所有资源分析结果（主表）
const GConfig = {}; // config / json 等中间表
const GAnimMp = {}; // 动画名 -> 动画对象映射
const GMapSubs = {}; // bundle 依赖/优先级统计
const GMapPlist = {}; // frame uuid -> plist uuid
const GMapFrame = {}; // 预留
const GUnkowns = {}; // 纹理未绑定时的临时记录
const GCfgJson = {}; // bundle config 原始 json
const GFrameNames = {}; // uuid -> spriteFrame 路径

// 资源类型 => 扩展名映射
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

module.exports = {
    EXT_MAP,
    GAnalys,
    GConfig,
    GAnimMp,
    GMapSubs,
    GMapPlist,
    GMapFrame,
    GUnkowns,
    GCfgJson,
    GFrameNames,
};
