const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ASTC_MAGIC = Buffer.from([0x13, 0xab, 0xa1, 0x5c]);

const readAstcHeader = (buffer) => {
    if (!buffer || buffer.length < 16) return null;
    if (!buffer.slice(0, 4).equals(ASTC_MAGIC)) return null;

    const blockX = buffer[4];
    const blockY = buffer[5];
    const blockZ = buffer[6];
    const width = buffer[7] | (buffer[8] << 8) | (buffer[9] << 16);
    const height = buffer[10] | (buffer[11] << 8) | (buffer[12] << 16);
    const depth = buffer[13] | (buffer[14] << 8) | (buffer[15] << 16);

    return {
        blockX,
        blockY,
        blockZ,
        width,
        height,
        depth,
    };
};

const getAstcSize = (buffer) => {
    const header = readAstcHeader(buffer);
    if (!header) return null;
    return { width: header.width, height: header.height };
};

const resolveAstcencCommand = () => {
    if (process.env.ASTCENC_PATH) {
        return { cmd: process.env.ASTCENC_PATH, argsPrefix: [] };
    }

    try {
        const astcenc = require("astcenc");
        if (astcenc && typeof astcenc.executable === "function") {
            return { cmd: astcenc.executable(), argsPrefix: [] };
        }
    } catch {
        // ignore
    }

    try {
        const wrapperPath = require.resolve("astcenc/src/main.js");
        return { cmd: process.execPath, argsPrefix: [wrapperPath] };
    } catch {
        return { cmd: "astcenc", argsPrefix: [] };
    }
};

const isValidOutput = (filePath) => {
    try {
        const stat = fs.statSync(filePath);
        return stat.isFile() && stat.size > 0;
    } catch {
        return false;
    }
};

const resolveDecodeMode = (options = {}) => {
    const raw = options.profile || process.env.ASTCENC_PROFILE || "dl";
    const value = raw.startsWith("-") ? raw.slice(1) : raw;
    if (value === "dH" || value === "DH") return "dH";
    const lower = value.toLowerCase();
    if (lower === "dl" || lower === "ds" || lower === "dh") return lower;
    if (lower === "srgb") return "ds";
    if (lower === "linear") return "dl";
    return "dl";
};

const decodeAstcToPng = (inputPath, outputPath, options = {}) => {
    if (!inputPath || !outputPath) {
        return { ok: false, error: new Error("Missing input or output path") };
    }

    if (!options.force && isValidOutput(outputPath)) {
        return { ok: true, skipped: true };
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const { cmd, argsPrefix } = resolveAstcencCommand();
    const mode = resolveDecodeMode(options);
    const args = [...argsPrefix, `-${mode}`, inputPath, outputPath];
    if (options.silent !== false) {
        args.push("-silent");
    }
    const result = spawnSync(cmd, args, { encoding: "utf8" });

    if (result.error) {
        return { ok: false, error: result.error, stderr: result.stderr };
    }

    if (result.status !== 0) {
        const message = result.stderr || result.stdout || `astcenc exited with code ${result.status}`;
        return { ok: false, error: new Error(message), stderr: result.stderr };
    }

    if (!isValidOutput(outputPath)) {
        return { ok: false, error: new Error(`astcenc did not produce output: ${outputPath}`) };
    }

    return { ok: true };
};

module.exports = {
    getAstcSize,
    decodeAstcToPng,
};
