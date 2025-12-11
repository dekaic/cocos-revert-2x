// String.format 简单实现，保持与旧版本兼容
declare global {
    interface String {
        format(...args: any[]): string;
    }
}

String.prototype.format = function (...args: any[]): string {
    const s = args;
    let e = this.slice();
    if (!e) return "";
    return e.replace(/\{(\d+)\}/g, (_m, idx) => {
        const i = parseInt(idx, 10);
        return s[i];
    });
};

export {};
