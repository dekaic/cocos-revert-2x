const path = require("path");
const { createContext } = require("./core/context");
const { runRevert } = require("./core/pipeline");
const { runScriptExtraction } = require("./core/plugins/script-extractor");

const ensureTrailingSlash = (dirPath) => (dirPath.endsWith(path.sep) ? dirPath : `${dirPath}${path.sep}`);

const parseCliArgs = () => {
    const args = process.argv.slice(2);
    const options = {
        dirIn: path.resolve("./input/assets"),
        dirOut: ensureTrailingSlash(path.resolve("./output")),
        showHelp: false,
        scripts: false,
        scriptsOnly: false,
        scriptsNeedJsPath: null,
        scriptsEntries: [],
        scriptsBeautify: true,
    };

    const readValue = (label, currentIndex) => {
        const value = args[currentIndex + 1];
        if (!value || value.startsWith("-")) {
            console.error(`Missing value for ${label}`);
            process.exit(1);
        }
        return value;
    };

    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        switch (arg) {
            case "-i":
            case "--input":
            case "--dir-in":
                options.dirIn = path.resolve(readValue("input directory", index));
                index += 1;
                break;
            case "-o":
            case "--output":
            case "--dir-out":
                options.dirOut = ensureTrailingSlash(path.resolve(readValue("output directory", index)));
                index += 1;
                break;
            case "--scripts":
                options.scripts = true;
                break;
            case "--scripts-only":
            case "--only-scripts":
                options.scripts = true;
                options.scriptsOnly = true;
                break;
            case "--scripts-needjs":
                options.scriptsNeedJsPath = path.resolve(readValue("needjs.json path", index));
                index += 1;
                break;
            case "--scripts-entry":
                options.scriptsEntries.push(path.resolve(readValue("scripts entry file", index)));
                index += 1;
                break;
            case "--no-scripts-beautify":
                options.scriptsBeautify = false;
                break;
            case "-h":
            case "--help":
                options.showHelp = true;
                break;
            default:
                console.warn(`Unknown argument: ${arg}`);
                break;
        }
    }

    return options;
};

const printHelp = () => {
    const lines = [
        "Usage: node src/main.js [options]",
        "",
        "Options:",
        "  -i, --input, --dir-in <dir>     Input assets directory (default: ./input/assets)",
        "  -o, --output, --dir-out <dir>   Output directory (default: ./output)",
        "  --scripts                       Enable bundle script extraction into <output>/scripts",
        "  --scripts-only, --only-scripts   Only run script extraction (skip revert pipeline)",
        "  --scripts-needjs <file>         needjs.json path (default: ./needjs.json)",
        "  --scripts-entry <file>          Analyze a specific entry js (repeatable, overrides auto bundle scan)",
        "  --no-scripts-beautify           Skip js-beautify for extracted scripts",
        "  -h, --help                      Show help",
    ];
    console.log(lines.join("\n"));
};

const main = async () => {
    const options = parseCliArgs();

    if (process.env.DEBUG_CLI_OPTIONS === "1") {
        console.log("CLI argv:", process.argv.slice(2));
        console.log("Parsed options:", options);
    }

    if (options.showHelp) {
        printHelp();
        return;
    }

    const ctx = createContext({ dirIn: options.dirIn, dirOut: options.dirOut, log: console });

    try {
        if (!options.scriptsOnly) {
            await runRevert(ctx);
            ctx.log.log("Revert process completed.");
        }

        if (options.scripts) {
            const result = await runScriptExtraction(ctx, {
                needJsPath: options.scriptsNeedJsPath || undefined,
                entries: options.scriptsEntries,
                beautify: options.scriptsBeautify,
            });
            ctx.log.log("Script extraction completed:", result.outputRoot);
        }
    } catch (err) {
        ctx.log.error("Process failed:", err);
        process.exitCode = 1;
    }
};

main();
