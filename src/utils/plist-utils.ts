export function plistJSONToXML(e: any): string {
    const ctx: { xml: string } = {
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
\t<dict>
`,
    };
    plistWriteDict(ctx, e, "\t\t");
    ctx.xml += `\t</dict>
</plist>`;
    return ctx.xml;
}

export function plistWriteDict(ctx: { xml: string }, obj: any, indent: string): void {
    for (const [key, val] of Object.entries<any>(obj)) {
        ctx.xml += `${indent}<key>${key}</key>\n`;
        switch (typeof val) {
            case "object":
                ctx.xml += `${indent}<dict>\n`;
                plistWriteDict(ctx, val, indent + "\t");
                ctx.xml += `${indent}</dict>\n`;
                break;
            case "boolean":
                ctx.xml += `${indent}<${val ? "true" : "false"}/>\n`;
                break;
            case "string":
                ctx.xml += `${indent}<string>${plistEscapeXml(val)}</string>\n`;
                break;
            case "number":
                ctx.xml += `${indent}<integer>${val}</integer>\n`;
                break;
        }
    }
}

export function plistEscapeXml(e: string): string {
    return e.replace(/&/g, "&amp;");
}
