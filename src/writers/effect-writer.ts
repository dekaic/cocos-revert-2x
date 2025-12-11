import fs from "fs";
import { dir } from "../utils/fs-dir";
import { GFrameNames } from "../globals/globals";

export interface EffectContext {
    dirOut: string;
    correctPath(p: string): string;
}

function subsMaterialStr(e: string): string {
    let s = e;
    let i = s.indexOf("uniform CCGlobal");
    let t: string;
    let tail: string;

    if (i !== -1) {
        t = s.substring(0, i);
        tail = s.substring(i);
        const endIdx = tail.indexOf("};");
        s = t + "#include <cc-global>" + tail.substring(endIdx + 2);
    }

    i = s.indexOf("uniform CCLocal");
    if (i !== -1) {
        t = s.substring(0, i);
        tail = s.substring(i);
        const endIdx = tail.indexOf("};");
        s = t + "#include <cc-local>" + tail.substring(endIdx + 2);
    }

    i = s.indexOf("#if USE_ALPHA_TEST");
    if (i !== -1) {
        t = s.substring(0, i);
        i = s.lastIndexOf("#if USE_ALPHA_TEST");
        tail = s.substring(i);
        const endIdx = tail.indexOf("}");
        s = t + "#include <alpha-test>" + tail.substring(endIdx + 1);
    }

    return s;
}

async function newEffectLoops(key: string, node: any, s: string, indent: string, firstItem: boolean = false): Promise<string> {
    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            s = await newEffectLoops("", node[i], s, indent, i === 0);
        }
    } else if (typeof node === "object") {
        if (node.program) {
            const r = node.program.split("|");
            const o: any = { vert: r[1], frag: r[2] };
            for (const [k, v] of Object.entries<any>(node)) {
                if (k !== "program") {
                    o[k] = v;
                }
            }
            node = o;
        }

        for (const [c, f] of Object.entries<any>(node)) {
            let preold = indent;
            if (typeof f === "object") {
                if (c === "properties") {
                    preold += "  ";
                    s += preold + "properties:\n";
                    preold += "  ";
                    for (const [u, p] of Object.entries<any>(f)) {
                        switch (p.type) {
                            case 13:
                                if (Array.isArray(p.value)) {
                                    s += `${preold}${u}: { value: ${p.value[0]} }\n`;
                                } else {
                                    s += `${preold}${u}: { value: ${p.value} }\n`;
                                }
                                break;
                            case 16:
                                s += `${preold}${u}: { value: [${p.value.join(",")}], editor: {type: color}}\n`;
                                break;
                            case 29:
                                s += `${preold}${u}: { value: ${p.value} }\n`;
                                break;
                            default:
                                console.log();
                        }
                    }
                } else {
                    if (firstItem) {
                        firstItem = false;
                        s += `${preold}- ${c}:\n`;
                    } else {
                        s += `${preold}  ${c}:\n`;
                    }
                    s = await newEffectLoops(c, f, s, preold + "  ");
                }
            } else {
                if (firstItem) {
                    firstItem = false;
                    s += `${preold}- ${c}: ${mapBlendValue(f)}\n`;
                } else {
                    s += `${preold}  ${c}: ${mapBlendValue(f)}\n`;
                }
            }
        }
    } else {
        s += `${indent}${key}: ${node}\n`;
    }

    return s;
}

function mapBlendValue(e: any): any {
    return e === 2 ? "src_alpha" : e === 4 ? "one_minus_src_alpha" : e === 0 ? "none" : e;
}

export async function writeEffectFiles(ctx: EffectContext, uuid: string, t: any): Promise<void> {
    const effect = t.material.effect;
    const props = t.material.props;

    let name = "";
    let techniques: any = null;
    let inputJson: any = null;

    for (let i = 0; i < props.length; i++) {
        if (props[i] === "_name") {
            name = effect[i + 1];
            const pos = name.lastIndexOf("/");
            if (pos !== -1) {
                name = name.substring(pos + 1);
            }
        } else if (props[i] === "shaders") {
            // ignore here
        } else if (props[i] === "techniques") {
            techniques = effect[i + 1];
        }
    }

    let result = "CCEffect %{\n";
    if (techniques) {
        result = await newEffectLoops("", { techniques }, result, "");
    }
    result += "}%\n\n\n";

    for (let i = 0; i < t.material.effect[2].length; i++) {
        inputJson = t.material.effect[2][i];
        const cParts = inputJson.name.split("|");
        const o = cParts[1].split(":")[0];
        const fragName = cParts[2].split(":")[0];

        if (inputJson.glsl3) {
            result += `CCProgram ${o} %{`;
            result += subsMaterialStr(inputJson.glsl3.vert);
            result += `
}% 


`;
            result += `CCProgram ${fragName} %{`;
            result += subsMaterialStr(inputJson.glsl3.frag);
            result += `
}% 
`;
        }
    }

    let f = t.pathdir
        ? ctx.dirOut + t.bundle + "/" + t.pathdir + ".effect"
        : GFrameNames[uuid]
        ? ctx.correctPath(GFrameNames[uuid] + ".effect")
        : ctx.dirOut + t.bundle + "/unkown_effect/" + name + ".effect";

    f = f.replace(/\\/g, "/");
    const parts = f.split("/");
    parts.pop();
    await dir.dirExists(parts.join("/"));
    fs.writeFileSync(f, result);

    const metaJson = {
        ver: "1.0.27",
        uuid,
        importer: "effect",
        compiledShaders: [{ glsl1: inputJson.glsl1, glsl3: inputJson.glsl3 }],
        subMetas: {} as any,
    };
    const metaStr = JSON.stringify(metaJson, null, 2);
    fs.writeFileSync(f + ".meta", metaStr);
}
