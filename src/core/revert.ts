import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { HelloWorld } from "../testpb";
import { dir } from "../utils/fs-dir";
import { Meta } from "../writers/meta-writer";
import { DIR_PATH } from "../config/constants";
import { parseBundleConfig } from "../analyzers/bundle-analyzer";
import "../utils/string-format";
import { correctPath, isAFrame, isPicture, walkSync } from "../utils/resource-utils";
import { splitAutoAtlas } from "../processors/auto-atlas";
import { copyFiles } from "../processors/file-copier";
import { writeJsonAssets, writeDragonJson, writeTextAssets } from "../writers/json-writer";
import { writeMaterialFiles } from "../writers/material-writer";
import { writeTTFFiles } from "../writers/ttf-writer";
import { writeAnimFiles } from "../writers/anim-writer";
import { writeBitmapFonts } from "../writers/font-writer";
import { writePlists } from "../writers/plist-writer";
import { GAnalys, GCfgJson, GConfig, GMapSubs } from "../globals/globals";

const meta = new Meta();

export class Revert {
    dirIn: string = DIR_PATH + "/input/assets";
    dirOut: string = DIR_PATH + "/output/";
    correctPath = correctPath;
    isPicture = isPicture;
    isAFrame = isAFrame;
    walkSync = walkSync;

    async start(cb?: () => void): Promise<void> {
        console.log("revert dirIn:", this.dirIn);

        await this.ensureInputDir();
        const analyzerCtx = this.createAnalyzerContext();
        const configFiles = this.collectConfigFiles();
        this.scanAllAssets();
        this.parseBundles(configFiles, analyzerCtx);
        this.writeBundleFolderMetas(configFiles);
        await this.parsePrefabs(configFiles);
        await this.runOutputPipeline();
        await meta.newMetaFiles(this as any);

        cb && cb();
    }

    private createAnalyzerContext() {
        return {
            dirOut: this.dirOut,
            correctPath: this.correctPath,
            isPicture: this.isPicture,
            isAFrame: this.isAFrame,
        };
    }

    private async ensureInputDir(): Promise<void> {
        if (!(await dir.getStat(this.dirIn))) {
            console.log("none dirIn path:", this.dirIn);
            process.exit(0);
        }
    }

    private collectConfigFiles(): string[] {
        const configFiles: string[] = [];
        this.walkSync(
            this.dirIn,
            (e) => e.name === "config.json",
            (_name, fullPath) => {
                configFiles.push(fullPath);
            }
        );
        return configFiles;
    }

    private scanAllAssets(): void {
        this.walkSync(
            this.dirIn,
            (_e) => true,
            (name, fullPath, bundle) => {
                const parts = name.split(".");
                if (parts.length === 2 && name !== "config.json" && name !== "index.js") {
                    const item: any = {
                        filein: fullPath,
                        ext: "." + parts[1],
                        plists: null,
                        bitmap: null,
                        bundle: bundle,
                        sbines: null,
                        content: null,
                    };

                    let ext = "." + parts[1];
                    let content = fs.readFileSync(fullPath);
                    item.content = content;

                    // 同名 json / bin / png 等归并到 GAnalys / GConfig
                    if (GAnalys[parts[0]]) {
                        if (GAnalys[parts[0]].ext === ".json") {
                            GConfig[parts[0]] = GAnalys[parts[0]];
                            GAnalys[parts[0]] = item;
                        } else {
                            GConfig[parts[0]] = item;
                        }

                        // sbines 临时挂在 config 上，这里再转移回来
                        if (GConfig[parts[0]].sbines) {
                            GAnalys[parts[0]].sbines = GConfig[parts[0]].sbines;
                            GConfig[parts[0]].sbines = null;
                        }
                    } else {
                        GAnalys[parts[0]] = item;
                    }

                    // 记录图片尺寸
                    if (ext === ".png" || ext === ".jpg") {
                        try {
                            var sizeInfo = require("image-size")(content);
                            item.width = sizeInfo.width;
                            item.height = sizeInfo.height;
                        } catch (e) {
                            // ignore
                        }
                    } else if (ext === ".json") {
                        // 检测 sp.SkeletonData
                        try {
                            if (name !== "config.json" && content.includes("sp.SkeletonData")) {
                                console.log(name + " is a sp.SkeletonData");
                                item.sbines = { datas: JSON.parse(content.toString()) };
                            }
                        } catch (e) {
                            console.log("GAnalys err:", e);
                        }
                    }
                }
            }
        );
    }

    private parseBundles(configFiles: string[], analyzerCtx: ReturnType<Revert["createAnalyzerContext"]>): void {
        for (let i = 0; i < configFiles.length; i++) {
            let file = configFiles[i];
            const content = fs.readFileSync(file, "utf-8");
            file = file.replace(/\\/g, "/");
            const parts = file.split("/");
            const bundleName = parts[parts.length - 2];
            parseBundleConfig(analyzerCtx, bundleName, JSON.parse(content));
        }
    }

    private writeBundleFolderMetas(configFiles: string[]): void {
        for (let i = 0; i < configFiles.length; i++) {
            let file = configFiles[i];
            file = file.replace(/\\/g, "/");
            const parts = file.split("/");
            const bundleName = parts[parts.length - 2];

            if (bundleName !== "main" && bundleName !== "third" && bundleName !== "resources" && bundleName !== "internal") {
                const metaJson: any = {
                    ver: "1.1.3",
                    uuid: uuidv4(),
                    importer: "folder",
                    isBundle: true,
                    bundleName: "",
                    priority: GMapSubs[bundleName],
                    compressionType: {},
                    optimizeHotUpdate: {},
                    inlineSpriteFrames: {},
                    isRemoteBundle: {},
                    subMetas: {},
                };
                const metaStr = JSON.stringify(metaJson, null, 2);
                fs.writeFileSync(this.dirOut + bundleName + ".meta", metaStr);
            }
        }
    }

    private async parsePrefabs(configFiles: string[]): Promise<void> {
        for (let i = 0; i < configFiles.length; i++) {
            let file = configFiles[i];
            const content = fs.readFileSync(file, "utf-8");
            file = file.replace(/\\/g, "/");
            const parts = file.split("/");
            const bundleName = parts[parts.length - 2];
            await HelloWorld.parseBundleConfig(this, bundleName, JSON.parse(content));
        }
    }

    private async runOutputPipeline(): Promise<void> {
        await splitAutoAtlas({ dirOut: this.dirOut, correctPath: this.correctPath });
        await copyFiles({ dirOut: this.dirOut, correctPath: this.correctPath, isPicture: this.isPicture });
        await writePlists({ correctPath: this.correctPath });
        await writeBitmapFonts({ dirOut: this.dirOut, correctPath: this.correctPath });
        await writeAnimFiles({ dirOut: this.dirOut, correctPath: this.correctPath });
        await writeTTFFiles({ dirOut: this.dirOut, correctPath: this.correctPath });
        await writeJsonAssets({ dirOut: this.dirOut, correctPath: this.correctPath });
        await writeDragonJson({ dirOut: this.dirOut, correctPath: this.correctPath });
        await writeTextAssets({ dirOut: this.dirOut, correctPath: this.correctPath });
        await writeMaterialFiles({ dirOut: this.dirOut, correctPath: this.correctPath });
    }
}

const revert = new Revert();
export default revert;
