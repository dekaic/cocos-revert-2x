const fs = require("fs");
const path = require("path");
const util = require("util");

const DEFAULT_PATTERNS = [
    /\berr(or)?\b/i,
    /\bundefined\b/i,
    /\bunkown\b/i,
    /\bfail(ed)?\b/i,
    /not found/i,
];

let hooked = false;
let originalConsole = null;

const formatMessage = (args) => util.format(...args);

const initErrorLog = (options = {}) => {
    if (hooked) {
        return options.logFilePath || null;
    }

    const logFilePath = options.logFilePath || path.resolve("error.log");
    const patterns = Array.isArray(options.patterns) && options.patterns.length ? options.patterns : DEFAULT_PATTERNS;

    const shouldCapture = (level, message) => {
        if (level === "error" || level === "warn") return true;
        return patterns.some((regex) => regex.test(message));
    };

    const appendLine = (line) => {
        try {
            fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
            fs.appendFileSync(logFilePath, `${line}\n`, "utf8");
        } catch {
            // ignore logging failures
        }
    };

    const wrap = (level) => (...args) => {
        originalConsole[level](...args);

        const message = formatMessage(args);
        if (!shouldCapture(level, message)) return;

        const timestamp = new Date().toISOString();
        appendLine(`[${timestamp}] [${level}] ${message}`);
    };

    originalConsole = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
    };

    console.log = wrap("log");
    console.warn = wrap("warn");
    console.error = wrap("error");

    hooked = true;
    return logFilePath;
};

module.exports = {
    initErrorLog,
};
