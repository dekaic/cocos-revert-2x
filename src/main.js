const revert = require("./revert");

const ensureTrailingSlash = (dirPath) => (dirPath.endsWith(path.sep) ? dirPath : `${dirPath}${path.sep}`);

const parseCliArgs = () => {
    const args = process.argv.slice(2);
    const options = {
        dirIn: revert.dirIn,
        dirOut: revert.dirOut,
        showHelp: false,
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

const applyOptions = (options) => {
    if (options.dirIn) {
        revert.dirIn = options.dirIn;
    }

    if (options.dirOut) {
        revert.dirOut = options.dirOut;
    }
};

const main = () => {
    const options = parseCliArgs();

    applyOptions(options);

    revert.start(() => {
        console.log("Revert process completed.");
    });
};

main();
