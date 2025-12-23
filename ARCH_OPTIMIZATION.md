## 现状概览
当前工具定位为 **Cocos Creator 2.x（重点 2.4 系列）构建产物的资源回溯/还原 CLI**。输入为 `input/assets/**`（多 bundle 结构，含 `config.json`、短 uuid 命名资源、packs/scene/prefab/texture/spine/material 等），输出为 `output/**` 的 Creator 可重导入工程资源（真实文件 + `.meta` + `.fire/.prefab/.anim/.plist/.mtl/.effect` 等）。典型场景是对已发布 Cocos 游戏进行资源结构恢复、依赖补全与可视化再导入。

入口在 `src/main.js`，解析 CLI 参数后创建 `Context` 并执行 `runRevert(ctx)`（`src/core/pipeline.js`）。兼容入口 `src/revert.js: revert.start()` 仍保留（用于旧调用方式）。核心模块包括：  
- 运行上下文与状态容器（`src/core/context.js`、`src/core/state.js`）  
- 主流程编排（`src/core/pipeline.js`）  
- bundle manifest 扫描/规范化（`src/core/manifest/*`）与类型/路径绑定（`src/bundle-config.js`）  
- packs/paths 语义分析补全（`src/analyzer.js`）  
- Scene/Prefab 反序列化再序列化（`src/revert-prefab.js`）  
- 自动图集拆分（`src/auto-atlas.js`）  
- 各类资源文件/文本生成（`src/generators.js`）  
- `.meta` 与映射输出（`src/revert-meta.js`）  
- 可选脚本拆分分析插件（`src/core/plugins/script-extractor.js`；CLI: `--scripts`/`--scripts-only`）

### 已落地改造（对齐本优化文档）
- `Context + State`：替代历史全局表/单例，模块统一显式传 `ctx`（不再依赖 `this` 隐式上下文）。  
- `Pipeline`：用 `src/core/pipeline.js: runRevert(ctx)` 串起旧逻辑，入口与流程更清晰。  
- `Manifest`：新增 `BundleManifestLoader/normalizeManifest`（`src/core/manifest/*`），规范化结果落在 `ctx.state.bundleNormalizedManifest` 供后续定位/扩展使用。  
- `ScriptExtractorPlugin`：脚本拆分迁移到 `src/core/plugins/script-extractor.js` 并通过 CLI 启用（输出到 `<dirOut>/scripts`）；支持 `__require(modules)` 与 `define(id,factory)` 两类构建格式，并在检测到 factory 内存在多段 `cc._RF.push/pop` 时按段拆分脚本与 `.meta`（适配 subpackages 的单文件合并脚本）。

---

## 主要问题与证据
从架构、数据一致性、可扩展性/稳定性/性能看，现状主要风险如下（括号内标注文件/函数）：

1. **运行态状态容器曾分散，生命周期不清晰（已阶段性收敛）**  
   - 历史：`GAnalys/GConfig/GMap*` 等散落在全局单例（`src/revert-state.js`），被多阶段随意读写。  
   - 现状：已迁移到 `Context.state`（`src/core/state.js`），各模块显式接受 `ctx`，避免跨模块直接 require 全局表。  
   - 仍待：状态模型仍以 map/结构体为主，尚未升级为文中目标的 `AssetRecord/DependencyGraph`（见 P1/P2）。

2. **模块职责边界模糊、强耦合“this 上下文”（已解决）**  
   - 历史：`src/revert.js` 把 helpers/analyzer/generators/bundle-config 等大量函数 `...spread` 到一个对象上，依赖 `this.correctPath/this.isPicture` 等隐式方法。  
   - 现状：已改为 helpers 纯函数（`src/utils/helpers.js`）+ 显式传 `ctx`；主流程在 `src/core/pipeline.js`，模块可独立复用/测试。

3. **扫描 + manifest 解析双来源导致一致性隐患（仍待优化）**  
   - 现状仍是：先按文件名/扩展扫描建表（`src/core/pipeline.js: scanSourceFiles()`），后按 `config.json` 再绑定 `ttype/fileout`（`bundle-config.parseBundleConfig`）。  
   - 已补齐基础设施：新增 manifest 规范化（`src/core/manifest/normalize-manifest.js`）并缓存到 `ctx.state.bundleNormalizedManifest`，后续可逐步收敛为“manifest 索引优先”。  
   - 风险：对缺失/重名/多态资源的处理仍分散在多处兜底逻辑中，可能产生“同 uuid 多记录/错误类型覆盖”。（`bundle-config.parseBundleConfig`、`analyzer.analystextureSetter`、`generators.copyFiles`）

4. **错误处理与诊断弱，且大量吞异常**  
   - `try/catch { continue; }` 贯穿 analyzer/prefab/generators（`src/analyzer.js`、`src/revert-prefab.js`、`src/generators.js`），无统一日志/错误等级/上下文。  
   - 一旦某类资源解析失败，后续阶段仍继续，输出可能“看似成功但缺资源”。

5. **性能与内存开销偏高**  
   - 全量 `readFileSync` 把所有资源内容读入内存（`src/core/pipeline.js: scanSourceFiles()`），对大工程非常重。  
   - 多轮遍历 `GAnalys/GConfig`（analyzer/generators/meta 多次全表扫描）时间复杂度高。  
   - 图集拆分与生成阶段串行执行，无法利用并发。（`auto-atlas.SplitAutoAtlas`）

6. **路径/命名与 Creator 规则对齐不足**  
   - `correctPath()` 简单过滤非法字符但没做到“与 manifest 同源的规范化策略”，特殊情况（redirect、nativeBase、importBase）未覆盖。（`src/utils/helpers.js`）  
   - `DirUtils.walkSync` 用 `bundleName || entry.name` 推断 bundle，深层结构可能被误判。（`src/utils/dir-utils.js`）

7. **可插拔/版本适配能力不足**  
   - 所有类型分支写死在 analyzer/generators/meta 中，新增资源类型或适配 2.3/2.4/2.4.15 细微差异只能堆 if/else。  
   - `parseclass.js` 复刻引擎反序列化是优点，但缺少“版本 guard / feature flag”。

---

## Cocos 2.4.15 序列化对标要点
结合 Creator 2.4.15 的资源序列化/加载体系，可借鉴的关键机制：

1. **Bundle Manifest（`config.json / config.<bundleVer>.json`）作为唯一权威来源**  
   - 解决的问题：在 build 产物里 **uuid ↔ 路径 ↔ 类型 ↔ pack/scene/deps** 的稳定映射。  
   - 核心结构：`paths/types/uuids/packs/scenes/deps/redirect/importBase/nativeBase/versions/debug`。  
   - 对标点：运行时会先 `processOptions()` 统一 debug/release 结构并解压 UUID，再由 `_initPath/_initPackage/_initVersion/_initRedirect` 建索引缓存。  
   - 可迁移：本工具应先把 manifest **规范化为运行时同构索引**，再决定哪些源文件需要扫描/加载，避免“文件名推断优先”。  

2. **短 UUID 压缩/解压一致性 + 版本约束**  
   - 解决的问题：减小 build 体积，仍可稳定还原。  
   - 本工具已有 `uuid-utils.decompressUuid()`；应增加 **debug/release 格式识别 + versions 表处理** 与短 uuid 统一解压入口，避免各处重复/漏解压。（对标 `cc.assetManager.utils.decodeUuid` 行为）

3. **反序列化是“按需/延迟 + 依赖解析”的**  
   - Creator 通过 `cc.deserialize`/`deserializeAsAsset` 在需要时解析对象，并借 `__uuid__` 收集依赖图。  
   - 可迁移：  
     - 建立 `DependencyGraph`：由 manifest + 反序列化扫描 `__uuid__/__type__` 引用生成；  
     - 避免全量读入内容，改为 **lazy load + 缓存**。

4. **Meta/Importer 模板化**  
   - `.meta` 中 `importer/ver/subMetas/rawTextureUuid/...` 是按资产类型模板生成的。  
   - 可迁移：把 `revert-meta.js` 中的多函数拆为 **类型驱动的 MetaEmitter**，并将版本号/字段差异抽成配置表（便于 2.4.15 精确对齐）。

5. **packs/redirect 的语义**  
   - packs 是“资源组合/预加载单元”；redirect 用于替换 uuid 或路径。  
   - 可迁移：  
     - packs 解析与资源语义补全应先在“索引层”完成；  
     - redirect/scene 兜底逻辑应集中在 manifest 解析阶段，而非分散在 analyzer/prefab。  

---

## Manifest 规范化与文件定位（与运行时同源）
> 参考 `BUNDLE_MANIFEST.md` 对 `processOptions/_init*` 的梳理：先把“debug/release 差异、短 UUID、packs、versions、redirect”一次性收敛成稳定索引，再做按需扫描与还原。

### 规范化目标（NormalizedManifest）
- **统一结构**：把 release 的“数字索引格式”与 debug 的“直写 uuid/classId 格式”归一为同一种内存结构。  
- **统一主键**：内部主键统一使用“解压后的标准 uuid”（带 `-` 的 36 位字符串）。  
- **保留原始信息**：保留 `rawUuidIndex/rawTypeIndex/rawPackId` 等，用于回溯与定位问题（diagnostics）。

### 规范化规则（对齐 Creator runtime）
1. **识别格式**：`manifest.debug === false` 视为 release，否则视为 debug。  
2. **解压 UUID**：对 `manifest.uuids[]` 逐项做 `decodeUuid`（本项目已有 `uuid-utils.decompressUuid()`），得到 `uuidByIndex[]`。  
3. **展开 paths**：将 `paths` 转为 `assetInfoByUuid`（运行时同构的最小字段集合）：
   - `uuid`：release 用 `uuidByIndex[uuidIndex]`；debug 直接取 key（必要时也做 decode）。  
   - `path`：`paths[*][0]`。  
   - `type`：release 用 `types[typeIndex]`；debug 直接取 `paths[*][1]`。  
   - `isSubAsset`：`paths[*][2] === 1`（同路径多条 entry：主资源在前，sub-asset 在后）。  
4. **展开 packs**：构建 `packById`（`packId -> {assetUuids[]}`）并把 `packId` 反向挂到 `assetInfo.packs[]`；注意 **packId 不 decode**，文件名同源。  
5. **展开 versions**：把 `versions.import/native` 的“成对数组”转换为 map：  
   - `import`: key 为 `string` 时表示 `packId`；key 为 `number` 时表示 `uuidIndex`。  
   - `native`: key 始终为 `uuidIndex`。  
6. **展开 redirect**：`redirect` 是 `[uuidIndex|uuidString, depIndex]` 对；将其转成 `assetInfo.redirect = deps[depIndex]`（redirect 指向 `deps[]` 的索引）。  
7. **展开 scenes**：`scenes[path] -> uuid`，作为 SceneAsset 的稳定入口集合（驱动 restore 输出范围）。

### 文件定位规则（本地 build 产物：`assets/<bundle>/...`）
以“bundle 根目录”作为 `bundleRoot`（存在 `config*.json`、`import/`、`native/` 的目录）：
- **config/index**：同时支持 `config.json` 与 `config.<bundleVer>.json`；`index.js` 同理支持 `index.<bundleVer>.js`（bundleVer 可从文件名推断，仅用于定位文件，不参与资源 UUID 映射）。  
- **pack 文件**（release）：`{bundleRoot}/{importBase}/{packId[0..2]}/{packId}.{packVer}.json`（debug 则通常没有 `.packVer`）。  
- **import 单体文件**（release）：`{bundleRoot}/{importBase}/{uuid[0..2]}/{uuid}.{importVer}.json`（debug 通常为 `{uuid}.json`）。  
- **native 文件**（release）：`{bundleRoot}/{nativeBase}/{uuid[0..2]}/{uuid}.{nativeVer}.{ext}`；`ext` 依赖资产类型与构建管线，无法仅靠 manifest 100% 推断时可用 `{uuid}.{nativeVer}.*` 进行受限查找。  
- **Base 目录兜底**：`importBase/nativeBase` 缺省时回退到 `import/native`（与运行时的 generalImportBase/generalNativeBase 同一语义）。

### redirect / pack 的处理策略（索引层一次性收敛）
- **redirect**：在 `AssetIndexBuilder` 阶段把“source bundle 的 uuid”解析为“target bundle 的 canonical 记录”（或建立 alias 记录），后续 Analyzer/Restorer/Emitter 只处理 canonical。  
- **pack**：把 pack 视为一种“import 数据载体”；`SourceScanner` 以 packId 为粒度加载/缓存 pack 文件，避免对同一 pack 反复读盘与反序列化。

---

## 优化后的整体逻辑框架（目标架构）

### 当前实现映射（已落地部分）
- CLI：`src/main.js`（资源还原 `runRevert` + 可选 `--scripts/--scripts-only`）  
- Context/State：`src/core/context.js`、`src/core/state.js`  
- PipelineRunner：`src/core/pipeline.js`  
- BundleManifestLoader：`src/core/manifest/bundle-manifest-loader.js`  
- ManifestNormalizer：`src/core/manifest/normalize-manifest.js`  
- ScriptExtractorPlugin：`src/core/plugins/script-extractor.js`（`src/analysis/session.js` 已降级为兼容入口）

### 分层与职责
1. **CLI & 配置层**
   - `cli/main`：参数解析、运行模式（仅资源/含脚本/仅索引/增量等）  
   - `config/VersionGuard`：检测 manifest 版本、目标 Creator 版本（2.4.15）特性开关

2. **索引/上下文层**
   - `Context`：一次运行的唯一状态容器  
   - `BundleManifestLoader`：读取每个 bundle `config*.json` → `BundleManifest`（raw）  
   - `ManifestNormalizer`：按 `processOptions/_init*` 规则规范化成 `NormalizedManifest`（见上节）  
   - `AssetIndexBuilder`：基于规范化 manifest 构建 `AssetRecord`/`PackRecord`/`BundleRecord` 与 `DependencyGraph(初始)`  
   - `SourceLocator`：把 `AssetRecord/PackRecord` 映射到磁盘路径（pack/import/native），并提供“按规则定位 + 受限查找”兜底  
   - `SourceScanner`：按索引定向读取 pack/import/native（不再全目录盲扫）

3. **分析/补全层（可插拔 Analyzer）**
   - `AnalyzerPipeline`：按顺序执行分析器，每个分析器只读写 `Context` 中明确字段  
   - 内置 analyzers：  
     - `TextureFrameAnalyzer`（frames/_textureSetter/plist/atlas）  
     - `SpineDragonBonesAnalyzer`（sbines/png 绑定）  
     - `MaterialEffectAnalyzer`（effect/mtl/纹理回链）  
     - `AnimationClipAnalyzer`（spanim/frames refs）  
     - `BitmapFontAnalyzer`  
   - 每个 analyzer 输出 `Diagnostics`（warning/error + uuid + 来源）

4. **还原/转换层**
   - `PrefabSceneRestorer`：基于反序列化对象与依赖图生成 `.fire/.prefab`  
   - `AutoAtlasSplitter`：对确定为 auto-atlas 的纹理做裁切，生成新 `AssetRecord`

5. **输出层（Emitter）**
   - `FileEmitter`：copy / text/json / anim / plist / fnt / mtl / effect 统一落盘  
   - `MetaEmitter`：按类型模板生成 meta（与 2.4.15 字段对齐）  
   - `ReportEmitter`：输出 `mapsubs/mapplist/mapframe/diagnostics.json`

6. **扩展层（Plugin）**
   - `ScriptExtractorPlugin`（`src/core/plugins/script-extractor.js`；`src/analysis/*` 为历史实现/兼容入口）  
   - `CustomTypePlugin`：新增资源类型/特定游戏结构适配

### 依赖方向图
```mermaid
flowchart LR
  CLI --> Context
  CLI --> BundleManifestLoader
  BundleManifestLoader --> ManifestNormalizer
  ManifestNormalizer --> AssetIndexBuilder
  AssetIndexBuilder --> SourceLocator
  AssetIndexBuilder --> Context
  SourceLocator --> SourceScanner
  SourceScanner --> Context

  Context --> AnalyzerPipeline
  AnalyzerPipeline --> PrefabSceneRestorer
  AnalyzerPipeline --> AutoAtlasSplitter

  PrefabSceneRestorer --> FileEmitter
  AutoAtlasSplitter --> FileEmitter

  Context --> FileEmitter
  Context --> MetaEmitter
  Context --> ReportEmitter

  AnalyzerPipeline <-- PluginAnalyzer
  CLI <-- PluginMode
```
依赖只允许“上层 → 下层”，禁止输出层回写分析层；所有阶段只通过 `Context` 交互。

### 关键数据模型与生命周期
- `BundleManifest`（raw）  
  - 字段：`name, debug, deps, importBase, nativeBase, paths, types, uuids, packs, scenes, redirect, versions`  
  - 额外：`bundleRoot, bundleVer?`（从文件路径推断，仅用于定位 `config/index`）  
  - 生命周期：启动加载 → 全程只读

- `NormalizedManifest`  
  - 字段：`uuidByIndex[]`, `assetInfoByUuid`, `packById`, `importVerByUuid/packVerById/nativeVerByUuid`, `redirectByUuid`, `scenes`  
  - 生命周期：`BundleManifest` 规范化后 → 全程只读（作为索引权威源）

- `AssetRecord`（替代 `GAnalys/GConfig` 的统一模型）  
  - 核心字段：  
    - `uuid, bundle, type, path, isSubAsset, packs[], redirect?`  
    - `importVer?, nativeVer?, ext?, sourcePath?, outPath`  
    - `kind: {import,native,virtual}`  
    - `contentRef`（lazy 读取的句柄/缓存 key）  
    - `features: {frames, plist, bitmap, sbine, material, anim}`  
    - `deps: uuid[]`（来自 manifest + 反序列化扫描）  
    - `status: {indexed, analyzed, restored, emitted}`  
  - 生命周期：`indexed` → analyzers 逐步补全 → restorer/splitter 产生派生记录 → emitters 落盘

- `PackRecord`  
  - 字段：`id, bundle, ver?, assetUuids[], sourcePath`  
  - 生命周期：索引阶段建立 → `SourceScanner` 按需加载/缓存 → 为多资产提供 import 数据

- `DependencyGraph`  
  - `nodes(uuid)->AssetRecord`  
  - `edges(uuid)->deps[]`  
  - 用途：恢复 prefab/scene、确定输出顺序、检测循环依赖

- `Diagnostics`  
  - `{level, uuid, bundle, phase, message, stack?}`  
  - 生命周期：各阶段累积 → 最终报告

- `RestoreSnapshot`（可选）  
  - 保存 `Context` 的阶段性快照，支持断点续跑/回滚。

---

## 优化后的执行流程

### 步骤
1. **CLI 启动**（`cli/main`）  
   - 解析参数：输入根、输出根、目标版本（默认 2.4.15）、运行模式（全量/增量/含脚本）。  
   - 初始化 `Context`、`Diagnostics`、输出目录策略。

2. **加载 Manifest 并建索引**  
   - `BundleManifestLoader` 扫描 `**/config*.json` → `BundleManifest[]`（同时记录 bundleRoot 与 bundleVer?）。  
   - `ManifestNormalizer`：解压 uuid、展开 `paths/packs/versions/redirect/scenes`，生成运行时同构索引。  
   - `AssetIndexBuilder` 基于规范化索引生成 `AssetRecord/PackRecord`：  
     - 绑定 `type/path/isSubAsset/packs/importVer/nativeVer/redirect`；  
     - 计算 `outPath`（按 EXT_MAP + 2.4.15 规则）；  
     - 初步填 `deps`（manifest deps + packs/scenes 引用）。  
   - `DependencyGraph` 建初始边（manifest 层）。

3. **按需扫描源文件**  
   - `SourceScanner` 只读取索引指向的 pack/import/native：  
     - pack：按 `PackRecord` 粒度读盘、`unpackJSONs()` 并缓存；  
     - import 单体：按 `{uuid}.{importVer}.json` 读取并挂到 `contentRef`（lazy）；  
     - native：按 `{uuid}.{nativeVer}.*` 定位文件，取 size/headers 但不立即全读入内存。  
   - 缺失文件写 `Diagnostics error`，标记为 `status=missing`。

4. **AnalyzerPipeline（多阶段、可插拔）**  
   依次执行：TextureFrame → BitmapFont → Spine/DragonBones → Material/Effect → AnimationClip → Others  
   - 每个 analyzer：  
     - 只关注自己的字段（如 frames/material/sbine/spanim）  
     - 通过 `deserialize(contentRef)` 解析时自动收集 `__uuid__` 依赖回填到 `DependencyGraph`  
     - 产出结构化 diagnostics  
   - 结束后 `DependencyGraph` 完整。

5. **Prefab/Scene 还原**  
   - `PrefabSceneRestorer` 遍历图中 `cc.SceneAsset/cc.Prefab`：  
     - 反序列化 → 再序列化 `.fire/.prefab`  
     - 引用统一转 `{__uuid__}`，按图补齐缺失子资源  
   - 循环依赖检测：若图中存在环，按 Creator 规则断开非强引用边并提示。

6. **AutoAtlasSplitter**  
   - 根据 frames+manifest 规则识别 auto-atlas；  
   - 并发裁切（按 atlas 粒度限流），生成新 `AssetRecord(kind=virtual)`；  
   - 更新图与索引。

7. **输出阶段（Emitters）**  
   - `FileEmitter` 按资源类型顺序落盘：copy native/import、生成 json/text/anim/plist/fnt/mtl/effect 等。  
   - `MetaEmitter` 按模板生成 `.meta`（含 subMetas），版本号与字段对齐 2.4.15。  
   - `ReportEmitter` 输出 `mapsubs/mapplist/mapframe/diagnostics.json` 与可选 snapshot。

8. **收尾与退出**  
   - 若存在 `error` diagnostics：返回非 0 退出码，附简要汇总；  
   - 否则提示成功与统计。

### 流程图
```mermaid
flowchart TD
  A[CLI] --> B[Load Manifests]
  B --> C[Build AssetIndex + Graph]
  C --> D[Scan Sources Lazy]
  D --> E[AnalyzerPipeline]
  E --> F[Restore Prefab/Scene]
  E --> G[Split AutoAtlas]
  F --> H[Emit Files]
  G --> H
  H --> I[Emit Meta]
  I --> J[Emit Reports/Snapshot]
  J --> K[Exit]
```

### 异步/错误/回滚策略
- **异步点**：源文件扫描、图集裁切、批量 emit 可并发；使用队列限流（按 bundle/atlas 维度）。  
- **错误策略**：  
  - `missing/parse error` 不直接终止，但会阻断依赖链的还原输出；  
  - 对关键入口资源（scene/prefab）失败可配置 `fail-fast`。  
- **回滚**：  
  - 以阶段快照为界（索引/分析/拆图/输出），支持重新跑后段；  
  - 输出层先写临时目录，阶段成功再原子替换到 `output/`。
- **边界条件处理**：  
  - 缺失资源：保留引用但输出 diagnostics，meta 中标记 MissingScript/Null asset；  
  - 版本不一致：VersionGuard 根据 manifest 格式（debug/release）与目标 2.4.15 差异切换模板/解析器；  
  - 循环依赖：图上检测 SCC，按 Creator 的弱引用规则降级为延迟解析或断边。

---

## 重构落地计划（分阶段/优先级）

**P0（稳定性/可维护性优先）**  
1. 引入 `Context + State`（已完成）：把历史全局表迁入 `Context.state`，禁止跨模块直接 require 全局单例。  
2. 把 `revert` 大对象拆成 `PipelineRunner`（已完成）：用 `runRevert(ctx)` 串起阶段函数，并移除 `this` 隐式依赖（改为显式传 `ctx`）。  
收益：职责清晰、可测试、降低隐式耦合风险。  
回退点：保留 `src/revert.js: start()` 兼容入口，支持旧调用方式与对比输出。

**P1（流程对齐 manifest + 性能）**  
3. 引入 `ManifestNormalizer + SourceLocator`（部分完成）：已落地 `BundleManifestLoader/normalizeManifest`，`SourceLocator/SourceScanner` 与“按 manifest 定位、按需扫描”仍待实现。  
4. 把 analyzer 拆成独立模块并通过 `AnalyzerPipeline` 注册执行顺序（待实现）。  
收益：一致性与性能提升，新增类型更容易。  
风险：顺序依赖变化需严格回归样本。

**P2（输出模板化 + 2.4.15 精准对齐）**  
5. Meta/File 输出改为 `Emitter` 模式，按类型模板表驱动（集中版本字段）。  
6. 依赖图驱动输出顺序与兜底策略。  
收益：跨版本适配、减少散落 if/else。  
风险：模板字段对齐需用真实工程验证。

**P3（能力增强）**  
7. 引入并发限流、增量/断点 snapshot、diagnostics 报告（待实现）。  
8. 把脚本拆分改为插件（已完成）：`src/core/plugins/script-extractor.js` + `--scripts/--scripts-only`。  
收益：大工程处理时间降低、可扩展。  
风险：并发带来 I/O 竞争，需要压测。

---

## 需要你补充的信息
1. 你希望重点适配的 build 产物形态：仅 `assets` 还是 `assets+src/settings.js` 全量？  
2. 真实样本中是否存在大量 `redirect/nativeBase/importBase` 非默认情况？（这会影响索引与输出路径规则）  
3. 目标输出是“可在 Creator 2.4.15 直接打开工程”，还是“资源结构尽量还原即可”？不同目标会影响 Prefab/Scene 的容错与补全策略。
