/**
 * Initialize globals expected by the Cocos runtime when running under Node.
 * This should be imported before any engine modules to avoid ReferenceError.
 */

// Provide a browser-like window.
(globalThis as any).window = (globalThis as any).window || {} as any;

// Engine environment flags.
(globalThis as any).CC_EDITOR = false;
(globalThis as any).CC_PREVIEW = false;
(globalThis as any).CC_DEV = false;
(globalThis as any).CC_DEBUG = false;
(globalThis as any).CC_BUILD = true;
(globalThis as any).CC_JSB = false;
(globalThis as any).CC_RUNTIME = true;
(globalThis as any).CC_TEST = false;
(globalThis as any).CC_WECHATGAME = false;
(globalThis as any).CC_NATIVERENDERER = false;

// Core namespace.
const ccGlobal = (globalThis as any).cc || {};
(globalThis as any).cc = ccGlobal;
ccGlobal.errorID = ccGlobal.errorID || console.error.bind(console);
ccGlobal.warnID = ccGlobal.warnID || console.warn.bind(console);

export {};
