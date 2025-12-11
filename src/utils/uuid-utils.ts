class UuidUtils {
    // Base64 字符表
    private static readonly Base64KeyChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    // ASCII -> 6bit 索引映射表
    private static readonly AsciiTo64: number[] = (() => {
        const arr = new Array<number>(128);
        for (let i = 0; i < 128; ++i) arr[i] = 0;
        for (let i = 0; i < 64; ++i) {
            arr[UuidUtils.Base64KeyChars.charCodeAt(i)] = i;
        }
        return arr;
    })();

    private static readonly Reg_Dash = /-/g;
    private static readonly Reg_Uuid = /^[0-9a-fA-F-]{36}$/;
    private static readonly Reg_NormalizedUuid = /^[0-9a-fA-F]{32}$/;
    private static readonly Reg_CompressedUuid = /^[0-9a-zA-Z+/]{22,23}$/;

    // 压缩 UUID：支持带“-”和 32 位十六进制
    // useShortPrefix === true 时前缀长度 2，否则 5
    static compressUuid(uuid: string, useShortPrefix?: boolean): string {
        let hex = uuid;

        if (this.Reg_Uuid.test(hex)) {
            hex = hex.replace(this.Reg_Dash, "");
        } else if (!this.Reg_NormalizedUuid.test(hex)) {
            return uuid;
        }

        const headLen = useShortPrefix === true ? 2 : 5;
        return this.compressHex(hex, headLen);
    }

    // 压缩 32 位十六进制串到自定义 Base64 形式
    static compressHex(hex: string, prefixLen?: number): string {
        const len = hex.length;
        let head = prefixLen !== undefined ? prefixLen : len % 3;
        const prefix = hex.slice(0, head);

        const out: string[] = [];
        while (head < len) {
            const h1 = parseInt(hex[head], 16);
            const h2 = parseInt(hex[head + 1], 16);
            const h3 = parseInt(hex[head + 2], 16);

            out.push(this.Base64KeyChars[(h1 << 2) | (h2 >> 2)]);
            out.push(this.Base64KeyChars[((h2 & 0b11) << 4) | h3]);

            head += 3;
        }

        return prefix + out.join("");
    }

    // 解压 22/23 长度压缩 UUID 为标准 8-4-4-4-12
    static decompressUuid(str: string): string {
        if (str.length <= 20) return str;

        let hex = str;

        if (hex.length === 23) {
            const bodyHex: string[] = [];
            for (let i = 5; i < 23; i += 2) {
                const c1 = this.AsciiTo64[hex.charCodeAt(i)];
                const c2 = this.AsciiTo64[hex.charCodeAt(i + 1)];

                bodyHex.push((c1 >> 2).toString(16));
                bodyHex.push((((c1 & 0b11) << 2) | (c2 >> 4)).toString(16));
                bodyHex.push((c2 & 0b1111).toString(16));
            }
            hex = hex.slice(0, 5) + bodyHex.join("");
        } else if (hex.length === 22) {
            const bodyHex: string[] = [];
            for (let i = 2; i < 22; i += 2) {
                const c1 = this.AsciiTo64[hex.charCodeAt(i)];
                const c2 = this.AsciiTo64[hex.charCodeAt(i + 1)];

                bodyHex.push((c1 >> 2).toString(16));
                bodyHex.push((((c1 & 0b11) << 2) | (c2 >> 4)).toString(16));
                bodyHex.push((c2 & 0b1111).toString(16));
            }
            hex = hex.slice(0, 2) + bodyHex.join("");
        }

        if (hex.length < 32) {
            hex = hex.padEnd(32, "0");
        }

        return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
    }

    // 判断是否为 UUID/压缩 UUID
    static isUuid(str: unknown): str is string {
        if (typeof str !== "string") return false;
        return this.Reg_CompressedUuid.test(str) || this.Reg_NormalizedUuid.test(str) || this.Reg_Uuid.test(str);
    }
}

export { UuidUtils };
