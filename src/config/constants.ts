import path from "path";

// 资源类型 -> 扩展名映射
export const EXT_MAP: Record<string, string> = {
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

export const DIR_PATH = path.resolve(".");
