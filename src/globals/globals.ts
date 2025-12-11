// Shared global state used across revert pipeline.
export const GAnalys: any = {};
export const GConfig: any = {};
export const GAnimMp: any = {};
export const GMapSubs: any = {};
export const GMapPlist: any = {};
export const GMapFrame: any = {};
export const GUnkowns: any = {};
export const GCfgJson: any = {};
export const GFrameNames: any = {};

// Expose to globalThis for legacy code paths that rely on these globals.
(globalThis as any).GAnalys = GAnalys;
(globalThis as any).GConfig = GConfig;
(globalThis as any).GAnimMp = GAnimMp;
(globalThis as any).GMapSubs = GMapSubs;
(globalThis as any).GMapPlist = GMapPlist;
(globalThis as any).GMapFrame = GMapFrame;
(globalThis as any).GUnkowns = GUnkowns;
(globalThis as any).GCfgJson = GCfgJson;
(globalThis as any).GFrameNames = GFrameNames;
