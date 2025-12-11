let path = require("path"),
    stringRandom = require("string-random"),
    fs = require("fs"),
    decodeUuid = require("./decode"),
    _name = "cocos-2.4",
    id = decodeUuid(stringRandom(22)),
    project = {
        engine: "cocos-creator-js",
        packages: "packages",
        name: _name,
        id: id,
        version: "2.4.11",
        isNew: !1,
    },
    jsconfig = {
        compilerOptions: {
            target: "es6",
            module: "commonjs",
            experimentalDecorators: !0,
        },
        exclude: ["node_modules", ".vscode", "library", "local", "settings", "temp"],
    },
    tsconfig = {
        compilerOptions: {
            module: "commonjs",
            lib: ["es2015", "es2017", "dom"],
            target: "es5",
            experimentalDecorators: !0,
            skipLibCheck: !0,
            outDir: "temp/vscode-dist",
            forceConsistentCasingInFileNames: !0,
        },
        exclude: ["node_modules", "library", "local", "temp", "build", "settings"],
    },
    settings_project = {
        "group-list": "",
        "collision-matrix": "",
        "excluded-modules": ["3D Physics/Builtin"],
        "last-module-event-record-time": 1703784461638,
        "design-resolution-width": 960,
        "design-resolution-height": 640,
        "fit-width": !1,
        "fit-height": !0,
        "use-project-simulator-setting": !1,
        "simulator-orientation": !1,
        "use-customize-simulator": !0,
        "simulator-resolution": { height: 640, width: 960 },
        "assets-sort-type": "name",
        facebook: {
            appID: "",
            audience: { enable: !1 },
            enable: !1,
            live: { enable: !1 },
        },
        "migrate-history": [],
        "start-scene": "current",
    };
async function init() {
    var e = "projects/result/cocos-2.4";
    // (await require("dir").getStat(e)) &&
    //     ((settings_project["group-list"] = global.Settings.groupList),
    //     (settings_project["collision-matrix"] = global.Settings.collisionMatrix),
    //     (settings_project["start-scene"] = path.basename(global.Settings.launchScene).split(".")[0]),
    //     fs.mkdirSync(`./${e}/settings`, { recursive: !0 }),
    //     fs.writeFileSync(`./${e}/settings/project.json`, JSON.stringify(settings_project)),
    //     fs.writeFileSync(`./${e}/project.json`, JSON.stringify(project)),
    //     fs.writeFileSync(`./${e}/jsconfig.json`, JSON.stringify(jsconfig)),
    //     fs.writeFileSync(`./${e}/tsconfig.json`, JSON.stringify(tsconfig)));
}
module.exports = { init: init };
