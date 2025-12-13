## 概览：Bundle Manifest 是什么
在 Cocos Creator 2.4.15 的资源系统里，**Bundle Manifest（即每个 bundle 根目录下的 `config.json` / `config.<ver>.json`）**是运行时识别与加载该 bundle 内资源的“权威索引”。  
它解决的问题是：**把构建产物中离散的文件（import/native、压缩 UUID、packs、scene 等）重新组织成可查询的映射与依赖描述**，使运行时能够通过 *uuid/路径/场景名* 精确定位资源文件、做版本缓存、按 pack 复用下载，以及在多 bundle 场景中处理资源重定向（redirect）。

与 **asset-bundle** 的关系：  
- Editor 构建阶段把一个资源目录导出为 bundle；  
- 运行时通过 `cc.assetManager.loadBundle()` 下载该 bundle 的 `config.json`（manifest）与 `index.js`，并实例化 `cc.AssetManager.Bundle`；  
- `Bundle` 内部的 `Config`（manifest 解析结果）是后续资源查找、URL 生成、pack 加载与依赖管理的基础。

---

## Manifest 文件结构与生成来源
**生成来源**：由 Creator 构建管线生成（运行时不生成，只消费）。典型输出结构：
```
assets/<bundleName>/
  config.json                (debug 构建)
  config.<bundleVer>.json    (release 构建，带 bundle 版本号)
  index.js / index.<ver>.js  (bundle 脚本入口)
  import/xx/<uuid>.<ver>.json
  native/xx/<uuid>.<ver>.<ext>
```

**文件读取位置/命名规则（运行时）**：  
`downloadBundle()` 会在 bundle 根路径下并发读取 `config` 与 `index`（`cocos2d/core/asset-manager/downloader.js:102`）：
- config 路径：``${base}/config.${bundleVer? bundleVer+'.':''}json``  
- index 路径：``${base}/index.${bundleVer? bundleVer+'.':''}js``  
其中 `bundleVer` 来源于：
- `loadBundle(nameOrUrl, options.version)` 传入，或  
- `cc.assetManager.downloader.bundleVers[bundleName]`（在 `cc.assetManager.init({bundleVers})` 时注入，`cocos2d/core/asset-manager/CCAssetManager.js:372` / `downloader.js:387`）。

---

## 加载与解析流程（调用链/数据流）
### 步骤链
1. **用户调用** `cc.assetManager.loadBundle(nameOrUrl, options, cb)`  
   - 入口：`cocos2d/core/asset-manager/CCAssetManager.js:694`  
   - 设定 `options.ext='bundle'` 后转 `loadRemote()`。

2. **远程加载管线** `loadRemote()` → `loadAny()`  
   - `loadRemote`：`cocos2d/core/asset-manager/CCAssetManager.js:618`  
   - `loadAny` 走标准加载任务流（预处理 URL、下载、回调数据）。

3. **下载 manifest 与 index.js**  
   - `downloader.download('bundle')` 调用 `downloadBundle()`：`cocos2d/core/asset-manager/downloader.js:102`  
   - 并发：  
     - `downloadJson(config...)` 得到 manifest JSON  
     - `downloadScript(index...)` 加载 bundle 代码  
   - 下载完成后：给 manifest 追加 `base` 字段（运行时字段，不在文件里）：`out.base = url + '/'`（`downloader.js:115`）。

4. **Bundle 实例化与 manifest 解析**  
   - `factory.create(..., type='bundle')` → `createBundle()`：`cocos2d/core/asset-manager/factory.js:92`  
   - `bundle.init(data)`：`cocos2d/core/asset-manager/bundle.js:208`  
   - `Config.init(options)`：`cocos2d/core/asset-manager/config.js:53`  
     1) `processOptions(options)` 统一 debug/release 格式并解压 UUID：`cocos2d/core/asset-manager/utilities.js:34`  
     2) `_initUuid/_initPath/_initScene/_initPackage/_initVersion/_initRedirect` 构建索引缓存（`config.js:70+`）。

5. **解析结果被使用的位置**
   - **UUID/路径/场景查找**：`Bundle.getAssetInfo/getInfoWithPath/getSceneInfo` → `Config` 内部 Cache（`bundle.js`/`config.js`）。  
   - **URL 生成**：请求项带 `config/info` 后由 `urlTransformer.combine` 拼接真实 URL，使用 `base/importBase/nativeBase/versions`（`cocos2d/core/asset-manager/urlTransformer.js:143`）。  
   - **packs 加载与解包**：`packManager.load()` 根据 `assetInfo.packs` 下载 pack 文件并 `unpack()`（`cocos2d/core/asset-manager/pack-manager.js:208`）。  
   - **redirect 重定向**：`urlTransformer.parse()` 在查 info 时若发现 `info.redirect`，要求先加载目标 bundle 并切换 config（`urlTransformer.js:52-60/87-91/108-112`）。

### 流程图
```mermaid
flowchart TD
  A[cc.assetManager.loadBundle] --> B[loadRemote/loadAny]
  B --> C[downloader.downloadBundle]
  C --> C1[download config(.ver).json]
  C --> C2[download index(.ver).js]
  C1 --> D[factory.create type=bundle]
  C2 --> D
  D --> E[Bundle.init]
  E --> F[Config.init]
  F --> G[processOptions: decode uuids & normalize]
  G --> H[build caches: paths/scenes/packs/versions/redirect]
```

---

## bundle config 字段说明
> 下表基于 2.4.15 运行时消费逻辑（`utilities.js`/`config.js`/`urlTransformer.js`/`pack-manager.js`）与你提供的真实 `config.json` 样本统计。

| 字段名 | 类型 | 含义 | 影响的运行时行为 | 示例 |
|---|---|---|---|---|
| `name` | `string` | bundle 名称 | `createBundle` 用于注册到 `cc.assetManager.bundles`；`bundle.name` | `"resources"` |
| `deps` | `string[]` | 该 bundle 依赖的其它 bundle 名称列表 | raw `redirect` 的第二项会引用 `deps` 的索引；对外暴露 `bundle.deps` | `["internal"]` |
| `importBase` | `string` | import 资源根目录（相对 bundle 根） | `urlTransformer.combine` 中用于拼 import URL；空/缺省则回退到 `cc.assetManager.generalImportBase` | `"import"` |
| `nativeBase` | `string` | native 资源根目录（相对 bundle 根） | 拼 native URL；空/缺省则回退到 `generalNativeBase` | `"native"` |
| `debug` | `boolean` | manifest 是否为 debug 格式 | `processOptions`：`false` 走 release 压缩格式解码；非 `false` 走 debug 直读格式 | `false` |
| `uuids` | `string[]` | 资源 UUID 列表（release 下多为短 UUID） | release 模式下为所有索引字段的“字典表”；`processOptions` 会逐项 `decodeUuid` | `["21ZdnFEH...","78xVKKi..."]` |
| `types` | `string[]` | 资源类型表（classId） | release 模式下 `paths[*][1]` 是类型索引，需要用此表展开成 classId（`processOptions`） | `["cc.AudioClip","cc.Texture2D"]` |
| `paths` | `Record<string, [string, number\|string, 1?]>` | 资源相对路径 → UUID/类型映射 | 通过 `Config._initPath` 建立 path→assetInfo；第三位存在表示 sub-asset，排序靠后（`config.js:87-99`） | `"75":["foo/bar",2,1]` |
| `scenes` | `Record<string, number\|string>` | 场景 URL/路径 → UUID 索引 | `Config._initScene` 建 scene 名→assetInfo；`Bundle.getSceneInfo` 用于 `loadScene` | `{"db://assets/A.fire":0}` |
| `packs` | `Record<string, Array<number\|string>>` | pack 文件 ID → 其包含的资源 UUID 索引数组 | `Config._initPackage` 为每个资源挂 `packs[]`；`packManager.load` 走 pack 下载/解包 | `{"0beabfc5b":[0,1,2]}` |
| `versions` | `{import?: Array<(number\|string), string>, native?: Array<number, string>}` | import/native 文件版本号表（用于缓存控制） | `Config._initVersion` 写入 `assetInfo.ver/nativeVer`；`urlTransformer.combine` 追加 `.ver` 后缀 | `"import":[0,"f3527"]` |
| `redirect` | `Array<number\|string, number>` | 资源 UUID 索引 → 目标 bundle 索引的成对数组 | `processOptions` 将其展开为 `[uuid, bundleName]`，`urlTransformer.parse` 遇到 redirect 会切换 config 并要求先加载目标 bundle | `[1,0,2,1]` |
| `isZip` | `boolean` | **未在 2.4.15 runtime 中发现直接使用** | 运行时未引用；可能与特定平台/子包 zip 流程相关，需验证 | `false` |
| `encrypted` | `boolean` | **未在 2.4.15 runtime 中发现直接使用** | 运行时未引用；可能与资源加密插件相关，需验证 | `false` |

**debug vs release 结构差异（`cocos2d/core/asset-manager/utilities.js:42-60`）**
- **release（`debug:false`）**：  
  - `uuids` 为数组，`paths/scenes/packs/versions/redirect` 等使用 **数字索引**；  
  - `paths[*][1]` 为 `types` 的索引；  
  - `uuids` 多为短 UUID，需要 `decodeUuid`。  
- **debug（`debug` 非 false 或缺省）**：  
  - `uuids` 仍为数组但同时构建 `uuidMap`；  
  - `paths/scenes/packs/versions/redirect` 直接使用 **uuid 字符串**；  
  - `paths[*][1]` 已是 classId 字符串，无需 types 展开。

---

## 示例 Manifest（带注释）
> 结构来自你提供的实际 config 形态（适度缩减字段规模便于阅读）。

```jsonc
{
  "paths": {
    "0": ["textures/hero", 1],        // uuids[0] 的主资源路径，类型索引=1
    "1": ["textures/hero", 2, 1],     // 同一路径的 sub-asset（如 SpriteFrame），末尾 1 表示子资源
    "2": ["prefabs/Hero", 3]          // uuids[2] 对应的 Prefab
  },
  "types": [
    "cc.AudioClip",
    "cc.Texture2D",
    "cc.SpriteFrame",
    "cc.Prefab"
  ],
  "uuids": [
    "fcmR3XADNLgJ1ByKhqcC5Z",         // 可能是短 UUID，运行时 decodeUuid
    "ecpdLyjvZBwrvm+cedCcQy",
    "78xVKKie5OE4Xg0lokf43I"
  ],
  "scenes": {
    "db://assets/Start.fire": 2       // 场景路径 -> uuids 索引
  },
  "deps": ["internal"],              // bundle 依赖列表（redirect 的 bundle 索引指向此数组）
  "redirect": [1, 0],                // uuids[1] 被重定向到 deps[0]（即 internal）
  "packs": {
    "0beabfc5b": [0, 1, 2]            // pack 文件 ID -> 包含的 uuids 索引
  },
  "versions": {
    "import": ["0beabfc5b", "f3495", 0, "80dcb"],  // pack/import 资源版本
    "native": [0, "3426f"]                         // native 资源版本
  },
  "name": "resources",
  "importBase": "import",
  "nativeBase": "native",
  "debug": false,
  "isZip": false,                     // 未确认运行时用途
  "encrypted": false                  // 未确认运行时用途
}
```

---

## 常见问题与注意事项
1. **为什么有些路径重复（同 path 多条 entry）？**  
   `paths` 允许同一路径对应多个资源（主资源 + sub-asset）。第三位标记 sub-asset，`Config._initPath` 会把主资源放在列表前（`config.js:92-99`）。

2. **packs 的 key 为啥不是 UUID？**  
   release 构建下 pack key 常为短 ID（例如 `0beabfc5b`），对应实际 pack 文件名 `import/0b/0beabfc5b.<ver>.json`；运行时不会 decode 它（`processOptions` 保留 key 原样）。

3. **redirect 什么时候生效？**  
   当通过 uuid/path/scene 查询到的 `assetInfo.redirect` 存在时，加载会切换到目标 bundle 的 config；若目标 bundle 未加载会抛错（`urlTransformer.js:55-60`）。

4. **versions 的作用是什么？**  
   用于 URL 版本后缀（`.` + ver），控制缓存；同时 pack 文件也可在 `versions.import` 中单独列版本（`utilities.js:81-89` + `config.js:146-165`）。

---

## 未确认点/需要补充的信息
- `isZip`、`encrypted`：在 2.4.15 开源 runtime 中未发现直接读取/分支逻辑；可能仅由 Editor/平台适配层使用。若你有对应平台（如小游戏/原生加密）样本，可提供以便进一步对照。  
- 如果你的构建链对 config 有二次加工（自定义字段/加密），也需要你补充说明。

---

## 2）简要优化说明
对本项目的“资源回溯/还原工具”而言，**manifest 应作为索引权威源**：  
- 先按 `config.json` 解压 `uuids/types/paths/packs/scenes/versions/redirect` 建 `AssetIndex`，再按索引定向扫描文件；  
- pack key、versions 中的混合 key（数字索引 + packId）要按 `processOptions` 的同源规则处理，避免误判类型/路径或漏掉 pack 文件的版本信息。

