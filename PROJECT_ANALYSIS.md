## 整体逻辑框架

### 项目目标与场景
该项目是一个 **Cocos Creator 2.x（尤其 2.4）资源“回溯/还原”工具**：输入打包后游戏的 `assets` 目录（含各 bundle 的 `config.json`、压缩 uuid 命名资源、packs/scene/prefab/json/bin/png 等），自动解析资源依赖与类型、拆分图集、反序列化场景/预制体，并在 `output/` 生成可被 Cocos Creator 重新导入的工程级资源（含 `.meta`、`.fire`、`.prefab`、`.plist`、`.anim`、`.mtl/.effect` 等）。典型用途是对已发布/加壳后的 Cocos 游戏进行资源结构恢复、便于二次分析或迁移。

技术栈为 **Node.js CLI 脚本**，重度依赖文件系统同步读写（`fs`）、Cocos 序列化格式的 JS 版反序列化（`src/libs/parseclass.js`）、图像处理（`sharp` 用于裁切图集）、UUID 解压缩（`src/utils/uuid-utils.js`）、以及少量辅助库（`image-size` 取图片尺寸、`uuid` 生成新 uuid、`js-beautify` 用于可选脚本抽取美化）。`protobufjs/google-protobuf/ws` 等依赖在当前主流程里基本未启用，属于预留/旧代码痕迹。

---

### 目录结构与模块划分
- `src/main.js`  
  CLI 入口：解析 `-i/--input`、`-o/--output` 参数，设置 `revert.dirIn/dirOut`，调用 `revert.start()`。

- `src/revert.js`  
  主控制器与流水线编排：  
  - 扫描输入目录、建立全局资源表  
  - 解析每个 bundle 的 `config.json`  
  - 调用 prefab/scene 反序列化、图集拆分、各类资源与 meta 生成  
  依赖 `src/revert-state.js` 的全局状态。

- `src/revert-state.js`  
  全局状态/数据模型：  
  - `GAnalys`：uuid -> 资源主记录（文件信息、类型、frames、material、sbines 等）  
  - `GConfig`：uuid -> 与主资源同名的 json/config 中间记录  
  - `GMapSubs`：bundle 优先级/依赖统计  
  - `GMapPlist`/`GMapFrame`：SpriteFrame/Atlas/Texture 的映射  
  - `GAnimMp`、`GFrameNames`、`GUnkowns` 等辅助映射  
  - `EXT_MAP`：Cocos 资源类型到输出扩展名映射。

- `src/bundle-config.js`  
  Bundle 配置解析层：`parseBundleConfig(bundleName, cfgJson)`  
  - 解压短 uuid  
  - 绑定 `ttype`、`fileout`、`pathdir`  
  - 为未显式列出的资源补默认类型/输出路径  
  - 调用 `analysFiles` 进一步分析 packs/paths。

- `src/analyzer.js`  
  资源语义分析层（核心“补全信息”逻辑）：  
  - `analysBitmapAndPlist`：从 packs 的序列化 json 中识别 SpriteFrame、BitmapFont、Material/Effect、Json/Text/DragonBones/Atlas 等，并回填到 `GAnalys`。  
  - `analystextureSetter`：解析 `_textureSetter`/SpriteFrame 结构，建立 texture->frames 关系，记录未知 frame。  
  - `analysAnimFrameAtlas`：解析 AnimationClip 的帧引用与属性结构，标记 `spanim`/`spanim_frames`。  
  - `analysPacksPlist`：从 plist/atlas pack 中补齐 frame uuid。  
  - `analysPathsMaterialAndEffect`：反序列化 cc.Material/cc.EffectAsset，确定类型并绑定纹理。  
  依赖 `src/libs/parseclass.js` 的 `deserialize()`。

- `src/revert-prefab.js`  
  Scene/Prefab 还原层：`parseBundleConfig(revertObj, bundleName, configJson)`  
  - 对 packs/paths/scenes 中的 `cc.SceneAsset` 和 `cc.Prefab` 反序列化为对象  
  - 用 `storeScene()` / `storePrefab()` 把对象树重新序列化为 Creator 2.x 标准 `.fire/.prefab` JSON  
  - `checkChildren()` 递归节点、`checkComponents()` 序列化组件字段、`initScriptParams()` 把引用转为 `{__uuid__}` / `{__id__}`。

- `src/auto-atlas.js`  
  自动图集拆分层：`SplitAutoAtlas()`  
  - 对 `GAnalys` 中带 `frames` 的大图（典型 auto-atlas）逐帧裁切  
  - 使用 `sharp` 按 `rect/rotated/originalSize/offset` 还原单帧 png  
  - 为每个帧生成新的 Texture2D 记录（新 uuid）与 `fileout`。

- `src/generators.js`  
  物理文件生成层：  
  - `copyFiles()`：按 `fileout` 复制/落盘原始文件，处理未知图片、spine/dragonBones 二进制、避免重名。  
  - `newPlistFiles()`：由 frames 生成 TexturePacker 风格 `.plist`。  
  - `newFontsFiles()`：生成 BitmapFont `.fnt`。  
  - `newAnimsFiles()` / `aniAnimsObjs()` / `aniAnimsArray()`：输出 `.anim` 并处理动画内的复杂数组/对象结构。  
  - `newJsonFiles()` / `newDragonJsonFiles()` / `newTextFiles()`：输出 JsonAsset、DragonBones、TextAsset 内容。  
  - `newEffectFiles()` / `newMaterialFiles()`：从 EffectAsset/Material 生成 `.effect` 与 `.mtl`。  
  - `newTTFFiles()`：生成 TTF 占位与 meta。

- `src/revert-meta.js`  
  Meta 生成层：`newMetaFiles(revertObj)`  
  按资源类型遍历 `GAnalys` 生成 Creator 可识别的 `.meta`：  
  - `newMetaPng()`（Texture + subMetas）  
  - `newMetaPlist()`（sprite-atlas + sprite-frame subMetas）  
  - `newMetaFnt()`、`newMetaAnims()`、`newMetaSbine()`、`newMetaAsset()`、`newMetaVideo()`、`newMetaParticle()`、`newMetaAtlas()`  
  同时输出统计映射：`output/mapplist.json`、`output/mapframe.json`、`output/mapsubs.json`。

- `src/utils/*`  
  工具层：  
  - `dir-utils.js` 目录遍历/清理/递归 mkdir。  
  - `helpers.js` 资源通用判断与 plist/effect 拼装工具。  
  - `uuid-utils.js` Cocos 短 uuid 解压缩。

- `src/libs/*`  
  Cocos 引擎序列化兼容层：  
  - `parseclass.js` 实现 Creator pack JSON 的 `deserialize()` / `unpackJSONs()`。  
  - 依赖 `js.js`、`parsertool.js`、`value-types/*` 等引擎内建类型。

- `src/analysis/*`（可选/默认未启用）  
  脚本拆分分析层：  
  - `analysis/session.js` 读取 `input/src/settings.js`、`output/mapsubs.json`、`needjs.json`，逐 bundle 分析 `input/assets/<bundle>/index.js`。  
  - `analysis/analysis.js` 的 `splitCompile()`/`generatorCode()` 从 webpack 打包块中拆出单独脚本写到 `output/scripts/` 并生成 `.meta`。  
  `main.js` 中调用被注释，属于手动开启的辅助功能。

---

### 核心数据模型（全局状态如何协作）
- `GAnalys[uuid]` 主记录（在 `src/revert.js` 扫描阶段创建，后续被各分析器不断补全）：  
  关键字段包括  
  - 文件维度：`filein`, `ext`, `content`, `bundle`, `width/height`  
  - 语义维度：`ttype`（Cocos 类型），`pathdir`（config paths 中的相对路径），`fileout`（最终输出路径）  
  - 复合资源：`frames`（Texture2D 的 SpriteFrame 列表），`plists`（atlas 对应 plist 信息），`bitmap`（BitmapFont 信息），`material`（Effect/Material 结构），`sbines`（spine/dragonBones 信息），`spanim`（AnimationClip 结构）  
- `GConfig[uuid]`：当同 uuid 同时存在 `.json/.bin/.png` 时，先作为“配置/序列化中间件”保存，供 analyzer/prefab 反序列化使用。  
- 各 `GMap*`：在 analyzer/meta/prefab 阶段被写入，用来回填 atlas、frame、bundle 优先级关系。

这些表的协作模式是：**扫描建表 → config 绑定类型/路径 → packs 深度解析补语义 → 生成文件 → 生成 meta 与映射**。

---

## 执行流程

### 启动到完成的调用链（主流程）
```mermaid
flowchart TD
  A[src/main.js: main()] --> B[src/revert.js: start()]
  B --> C[清理 output: DirUtils.clearDir]
  C --> D[扫描 input/assets<br/>收集 config.json]
  D --> E[二次扫描所有资源<br/>填充 GAnalys/GConfig]
  E --> F[逐 bundle 解析 config.json<br/>bundle-config.parseBundleConfig]
  F --> G[分析 packs/paths<br/>analyzer.* 回填 frames/material/anim/sbine]
  G --> H[反序列化 Scene/Prefab<br/>revert-prefab.parseBundleConfig]
  H --> I[拆分 auto-atlas<br/>auto-atlas.SplitAutoAtlas]
  I --> J[生成/拷贝资源文件<br/>generators.*]
  J --> K[生成各类 .meta 与映射<br/>revert-meta.newMetaFiles]
  K --> L[结束回调 done]
```

### 逐步描述（含数据流/状态变化/外部 I/O）
1. **入口与参数处理**  
   - `src/main.js: parseCliArgs()` 读取命令行，默认输入 `./input/assets`、输出 `./output/`。  
   - `applyOptions()` 写回到 `revert.dirIn/dirOut`。  
   - 之后调用 `src/revert.js: revert.start(done)`。

2. **初始化输出目录**  
   - `DirUtils.clearDir(this.dirOut)` 递归删除旧输出。  
   - `DirUtils.getStat(this.dirIn)` 校验输入存在且为目录，否则退出。  
   外部 I/O：大量 fs 删除与 stat。

3. **收集 bundle 的 `config.json`**  
   - `DirUtils.walkSync(this.dirIn, entry.name==="config.json")` 扫描所有子目录，把每个 bundle 的 `config.json` 路径塞入 `bundleConfigs[]`。  
   数据流：得到 bundle 列表与配置入口。

4. **扫描全部资源文件，建立主表 `GAnalys/GConfig`**  
   - 第二次 `walkSync` 逐文件读取（跳过 `config.json/index.js`）。  
   - 用文件名（去扩展、按 `.` 分割）得到 `uuid`；读 `content`。  
   - 构造 `item` 并写入 `GAnalys[uuid]`：  
     - 若该 uuid 已存在且旧项是 `.json`，旧项转入 `GConfig`，新项成为主资源；否则新项进 `GConfig`。  
     - 若 `.png/.jpg` 用 `image-size` 取 `width/height`。  
     - 若 `.json` 内容包含 `sp.SkeletonData`，解析为 `item.sbines.datas`。  
   外部 I/O：fs.readFileSync 扫描全量资源。  
   状态变化：`GAnalys/GConfig` 从空到包含所有 uuid 的“粗粒度档案”。

5. **解析每个 bundle 配置并补全类型/输出路径**  
   - 对 `bundleConfigs` 逐个执行 `bundle-config.parseBundleConfig(bundleName, cfgJson)`：  
     - 解压 `cfgJson.uuids`（短 uuid -> 标准 uuid），更新数组。  
     - 统计依赖：写 `GMapSubs[bundleName]` 及其 `deps`。  
     - 遍历 `cfgJson.paths`：  
       - 绑定 `GAnalys[uuid].ttype`，按 `EXT_MAP` 计算 `fileout`，特殊处理 `.atlas/.bin->.skel/cc.SpriteFrame/cc.AnimationClip/JsonAsset/DragonBones` 等。  
       - 对没有真实文件的 AnimationClip 也会在 `GAnalys` 中创建虚拟记录。  
     - 对未在 paths/packs 中出现的资源做兜底：粒子 `.plist`、孤立 `.mp3`、含 AnimationClip 的 json 等。  
     - `analysFiles()` 调用 analyzer 做深度语义解析（见下一步）。  
   状态变化：`GAnalys` 由“有文件但无类型/路径”升级为“可输出的资源清单”。

6. **packs/paths 深度分析补语义**（`src/analyzer.js`）  
   - `analysBitmapAndPlist()`：  
     - 对每个 pack 的序列化 json 反序列化预扫描，识别 SpriteFrame 结构并把 frame 信息挂到对应 Texture2D 的 `frames` 下；  
     - 识别 BitmapFont（`fontDefDictionary`）并写 `bitmap`；  
     - 识别 Material/EffectAsset/Json/Text/DragonBones/SpriteAtlas 等，设置 `ttype`、`material`、`content` 或写入 `GMapPlist`。  
   - `analystextureSetter()`：  
     - 解析 `_textureSetter` / frame 数组，补齐 `frames[frameName].uuid`，并把无法落盘的 frame 写入 `GUnkowns`。  
   - `analysAnimFrameAtlas()`：  
     - 找 AnimationClip 的内部结构，把 clip 数据写入 `item.spanim` 与 `item.props`，供后续 `.anim` 生成。  
   - `analysPacksPlist()`：  
     - 从 `.plist` pack 中同步 frame uuid 到 `frames`。  
   - `analysPathsMaterialAndEffect()`：  
     - `deserialize()` 解析 Material/EffectAsset，确定 `ttype` 并回链到纹理的 `material.mtls/effect`。  
   状态变化：`GAnalys` 的 `frames/material/spanim/sbines` 等关键字段被补齐。

7. **Scene/Prefab 还原**（`src/revert-prefab.js`）  
   - `RevertPrefab.parseBundleConfig(revertObj, bundleName, configJson)`：  
     - 对 packs 中非 Texture2D 的条目 `unpackJSONs()` 后逐个 `deserialize()`，遇到  
       - `cc.SceneAsset`：`storeScene()` 重新序列化为 `.fire`，写文件并 `writeSceneMeta()`。  
       - `cc.Prefab`：`storePrefab()` 重新序列化为 `.prefab`，写文件并 `writePrefabMeta()`。  
     - 再遍历 paths/scenes 作兜底生成。  
     - 扫 `GConfig/GAnalys` 中遗漏的 Prefab 再补一次。  
   - `storeScene/storePrefab` 通过 `checkChildren/checkComponents` 遍历节点与组件，把引用转成 `{__uuid__}` / `{__id__}`，保证 Creator 可读。  
   外部 I/O：写 `.fire/.prefab` 与 `.meta`。

8. **拆分自动图集**（`src/auto-atlas.js: SplitAutoAtlas()`）  
   - 对 `GAnalys` 中存在 `frames` 且 key 长度较短（典型 auto-atlas uuid）的 Texture2D：  
     - 根据 frames 的 uuid 在 bundle paths 中推断 basePath；  
     - 用 `sharp.extract()` 裁切每个 frame，处理 rotated 和 originalSize+offset 回填；  
     - 为每个 frame 生成新的 Texture2D 记录（新 uuid），赋值 `fileout` 并落盘 png；  
     - 从原 atlas 的 `frames` 中移除已拆出的帧。  
   外部 I/O：读 atlas png、写多张小 png。  
   异步点：sharp 的裁切/合成 `await`。

9. **生成/拷贝各类资源文件**（`src/generators.js`）  
   以 `GAnalys` 为输入，分阶段落盘：  
   - `copyFiles()`：有 `fileout` 的资源直接复制（prefab 不在这里 copy）；未知图片根据 frame 数量决定输出位置；spine/dragonBones 的 `.bin/.json/.atlas` 根据 `sbines` 修正路径并写出。  
   - `newPlistFiles()`：对带 frames 的纹理生成 `.plist`（TexturePacker 格式）。  
   - `newFontsFiles()`：对 bitmapfont 写 `.fnt`。  
   - `newAnimsFiles()`：对 `spanim` 输出 `.anim`。  
   - `newTTFFiles()`：补 TTF 模板文件。  
   - `newJsonFiles()/newDragonJsonFiles()/newTextFiles()`：从 packs 序列化内容还原 Json/Text/DragonBones 的真实文本。  
   - `newMaterialFiles()`：先 `newEffectFiles()` 生成 `.effect`，再生成 `.mtl` 与 meta。  
   外部 I/O：大量 fs.writeFileSync/copyFileSync。

10. **生成 `.meta` 与统计映射**（`src/revert-meta.js`）  
    - `newMetaPng()`：对纹理写 `texture.meta`，若未归入 atlas 则把 frames 写入 subMetas。  
    - `newMetaPlist()`：对 `.plist` 写 `sprite-atlas.meta`，并为每个 frame 写 subMetas，同时更新 `GMapPlist/GMapFrame`。  
    - `newMetaFnt()/newMetaAnims()/newMetaSbine()/newMetaAsset()/newMetaVideo()/newMetaParticle()/newMetaAtlas()`：按类型写对应 importer meta。  
    - 最后写 `output/mapplist.json`、`output/mapframe.json`、`output/mapsubs.json`。  
    外部 I/O：写大量 `.meta` 与映射 json。

11. **结束回调**  
    - `revert.start` 调用 `done()`，`main.js` 打印完成日志。

---

### 可选子生命周期：脚本拆分分析（默认关闭）
- 入口在 `src/main.js` 中被注释：`NewSession.NewSession(1).analysisCode()`。  
- `src/analysis/session.js: analysisCode()` 生命周期：  
  1. 解析 `input/src/settings.js`，构造 `global.Settings`。  
  2. 读取 `output/mapsubs.json` 得到 bundles。  
  3. 读取 `needjs.json` 作为脚本白名单（`allcodes:1` 表示全导出）。  
  4. 对每个 bundle 的 `input/assets/<bundle>/index.js` 调用 `src/analysis/analysis.js: splitCompile()` 拆 webpack 模块并写 `output/scripts/**.js(+.meta)`。  
  5. 若有结果，用 `js-beautify` 递归格式化 `output/scripts`。  
- 触发条件：手动取消注释/调用后运行。

---

## 需要你补充/确认的问题
1. 当前仓库里 `protobufjs/google-protobuf/ws` 依赖与 `src/server.js` 为注释状态：是否有你期望分析的 **protobuf/网络交互子流程**（可能在别的分支或未提交文件里）？  
2. 输入目录默认是 `input/assets`，但 `analysis/session.js` 还使用 `input/src/settings.js`：你的真实使用场景里输入会包含 **完整 build 输出（assets+src）** 还是仅 assets？这会影响脚本分析是否需要纳入主流程。

