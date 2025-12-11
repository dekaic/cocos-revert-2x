import * as fs from "fs";
import * as path from "path";

// Dir 类版本
export class Dir {
    // 获取文件/目录信息，失败返回 false
    getStat(p: string): fs.Stats | false {
        try {
            return fs.statSync(p);
        } catch {
            return false;
        }
    }

    // 创建目录，成功返回 true，失败返回 false
    mkdir(p: string): boolean {
        try {
            fs.mkdirSync(p);
            return true;
        } catch {
            return false;
        }
    }

    // 递归确保目录存在，不存在则逐级创建
    async dirExists(p: string): Promise<boolean> {
        const stat = this.getStat(p);

        // 已存在且为目录
        if (stat && stat.isDirectory()) {
            return true;
        }

        // 不存在：递归创建上级目录，再创建当前目录
        if (!stat) {
            const parent = path.parse(p).dir;
            const parentOk = parent ? await this.dirExists(parent) : true;
            return !!parentOk && this.mkdir(p);
        }

        // 存在但不是目录
        return false;
    }
}


export const dir = new Dir();