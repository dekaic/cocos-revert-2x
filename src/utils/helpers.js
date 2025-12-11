// 基础工具函数集合
function isPicture(ext) {
    return ext === ".png" || ext === ".jpg" || ext === ".jpeg";
}

// 修正路径（过滤非法字符）
function correctPath(p) {
    let str = p.replace(/db:\/[^\/]+\//, "");
    const last = str.lastIndexOf("/");
    let dirStr = str.substring(0, last);
    const file = str.substring(last + 1);
    dirStr = dirStr.replace(/\\/g, "/").replace(/[^a-zA-Z0-9._:/-]/g, "");
    return `${dirStr}/${file}`;
}

// 简单判断是否 sprite frame 结构
function isAFrame(node) {
    return typeof node === "object" && node.name && node.rect && node.offset && true;
}

// 替换 Effect 源码里的 CCGlobal / CCLocal / alpha-test 宏
function subsMaterialStr(code) {
    let before;
    let after;
    let idx = code.indexOf("uniform CCGlobal");
    if (idx !== -1) {
        before = code.substring(0, idx);
        after = code.substring(idx);
        idx = after.indexOf("};");
        code = before + "#include <cc-global>" + after.substring(idx + 2);
    }

    idx = code.indexOf("uniform CCLocal");
    if (idx !== -1) {
        before = code.substring(0, idx);
        after = code.substring(idx);
        idx = after.indexOf("};");
        code = before + "#include <cc-local>" + after.substring(idx + 2);
    }

    idx = code.indexOf("#if USE_ALPHA_TEST");
    if (idx !== -1) {
        before = code.substring(0, idx);
        idx = code.lastIndexOf("#if USE_ALPHA_TEST");
        after = code.substring(idx);
        idx = after.indexOf("}");
        code = before + "#include <alpha-test>" + after.substring(idx + 1);
    }

    return code;
}

// 递归生成 Effect 的 YAML 结构（techniques / properties 等）
async function newEffectLoops(key, node, outStr, indent, isFirst) {
    if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            outStr = await this.newEffectLoops("", node[i], outStr, indent, i === 0);
        }
    } else if (typeof node === "object") {
        if (node.program) {
            const result = node.program.split("|");
            const obj = { vert: result[1], frag: result[2] };
            for (const [name, value] of Object.entries(node)) {
                if (name !== "program") obj[name] = value;
            }
            node = obj;
        }

        for (const [k, v] of Object.entries(node)) {
            let preIndent = indent;
            if (typeof v === "object") {
                if (k === "properties") {
                    outStr += (preIndent += "  ") + "properties:\n";
                    preIndent += "  ";
                    for (const [propName, propInfo] of Object.entries(v)) {
                        switch (propInfo.type) {
                            case 13:
                                if (Array.isArray(propInfo.value)) {
                                    outStr += `${preIndent}${propName}: { value: ${propInfo.value[0]} }\n`;
                                } else {
                                    outStr += `${preIndent}${propName}: { value: ${propInfo.value} }\n`;
                                }
                                break;
                            case 16:
                                outStr += `${preIndent}${propName}: { value: [${propInfo.value.join(",")}], editor: {type: color}}\n`;
                                break;
                            case 29:
                                outStr += `${preIndent}${propName}: { value: ${propInfo.value} }\n`;
                                break;
                            default:
                                console.log();
                        }
                    }
                } else {
                    if (isFirst) {
                        isFirst = false;
                        outStr += `${preIndent}- ${k}:\n`;
                    } else {
                        outStr += `${preIndent}  ${k}:\n`;
                    }
                    outStr = await this.newEffectLoops(k, v, outStr, `${preIndent}  `);
                }
            } else {
                if (isFirst) {
                    isFirst = false;
                    outStr += `${preIndent}- ${k}: ${this.mapBlendValue(v)}\n`;
                } else {
                    outStr += `${preIndent}  ${k}: ${this.mapBlendValue(v)}\n`;
                }
            }
        }
    } else {
        outStr += `${indent}${key}: ${node}\n`;
    }
    return outStr;
}

// blend 模式的数值到字符串映射
function mapBlendValue(val) {
    if (val === 2) return "src_alpha";
    if (val === 4) return "one_minus_src_alpha";
    if (val === 0) return "none";
    return val;
}

// plist JSON 转 XML
function plistJSONToXML(json) {
    const ctx = {
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
\t<dict>
`,
    };
    this.plistWriteDict(ctx, json, "\t\t");
    ctx.xml += `\t</dict>
</plist>`;
    return ctx.xml;
}

// 递归写 plist dict
function plistWriteDict(ctx, obj, indent) {
    for (const [key, val] of Object.entries(obj)) {
        ctx.xml +=
            indent +
            `<key>${key}</key>
`;

        switch (typeof val) {
            case "object":
                ctx.xml +=
                    indent +
                    `<dict>
`;
                this.plistWriteDict(ctx, val, indent + "\t");
                ctx.xml +=
                    indent +
                    `</dict>
`;
                break;
            case "boolean":
                ctx.xml +=
                    indent +
                    `<${val ? "true" : "false"}/>
`;
                break;
            case "string":
                ctx.xml += `${indent}<string>${this.plistEscapeXml(val)}</string>\n`;
                break;
            case "number":
                ctx.xml +=
                    indent +
                    `<integer>${val}</integer>
`;
                break;
        }
    }
}

// 转义 plist string
function plistEscapeXml(str) {
    return str.replace(/&/g, "&amp;");
}

module.exports = {
    isPicture,
    correctPath,
    isAFrame,
    subsMaterialStr,
    newEffectLoops,
    mapBlendValue,
    plistJSONToXML,
    plistWriteDict,
    plistEscapeXml,
};
