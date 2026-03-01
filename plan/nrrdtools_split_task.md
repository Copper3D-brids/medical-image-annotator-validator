# NrrdTools.ts God Class Split — Task List

> **Plan:** [nrrdtools_split_plan.md](nrrdtools_split_plan.md)
> **Status:** ✅ All Phases Complete — Awaiting Phase 4 Full Regression Manual Testing
> **Estimated Duration:** 2-3 weeks (4 phases)

---

## Architecture: Extraction Target

将 NrrdTools.ts (2007 lines) 拆分为 Facade + 3 个功能模块：

```
NrrdTools.ts (1300 lines, Facade — 13 sections)
  ├── layerChannelManager: LayerChannelManager   ← 图层/通道管理 (211 lines)
  │     ├── Active layer/channel/sphereType
  │     ├── Visibility control
  │     └── Channel colors
  │
  ├── sliceRenderPipeline: SliceRenderPipeline   ← 切片渲染管线 (453 lines)
  │     ├── Slice setup & axis config
  │     ├── Canvas rendering & flip
  │     ├── Mask reload from MaskVolume
  │     └── View/canvas helpers
  │
  ├── dataLoader: DataLoader                      ← 数据加载 (222 lines)
  │     ├── setAllSlices (NRRD)
  │     ├── setMasksData (legacy)
  │     └── setMasksFromNIfTI
  │
  └── (Retained in NrrdTools Facade)
        ├── 1. Constructor + Module Initialisation
        ├── 2. GUI Setup
        ├── 3. Public API — Mode/Slider/Color/Action
        ├── 4. Public API — Keyboard & History
        ├── 5. Public API — View Control
        ├── 6. Public API — Data Getters
        ├── 7. Delegated — LayerChannelManager (20 methods)
        ├── 8. Delegated — SliceRenderPipeline (10 methods)
        ├── 9. Delegated — DataLoader (3 methods)
        ├── 10. Sphere Orchestration
        ├── 11. Clear/Reset
        ├── 12. Internal — Input Events
        └── 13. Internal — Utility
```

**提取模式**: 与 tools/ 目录一致 — 通过 `ToolContext` 访问共享状态, 通过 `*Callbacks` 回调宿主方法。

---

## Phase 1: Extract LayerChannelManager (3-5 days, Low Risk) ✅

> 提取 ~530 行 layer/channel 管理代码到独立类

### Task 1.1: 创建 LayerChannelManager 骨架 ✅
- **文件:** 新建 `tools/LayerChannelManager.ts`
- [x] 定义 `LayerChannelCallbacks` 接口 (3 callbacks: reloadMasksFromVolume, getVolumeForLayer, onChannelColorChanged)
- [x] 创建 `class LayerChannelManager extends BaseTool`
- [x] 构造函数接受 `ctx: ToolContext`, `callbacks: LayerChannelCallbacks`
- [x] 在 `tools/index.ts` 添加导出
- [x] TypeScript 编译通过

### Task 1.2: 迁移 Active Layer/Channel 方法 ✅
- **From:** `NrrdTools.ts` → **To:** `LayerChannelManager.ts`
- [x] 迁移 `setActiveLayer(layerId: string): void`
- [x] 迁移 `getActiveLayer(): string`
- [x] 迁移 `setActiveChannel(channel: ChannelValue): void`
- [x] 迁移 `getActiveChannel(): number`
- [x] 迁移 `setActiveSphereType(type: SphereType): void` (包含颜色同步逻辑)
- [x] 迁移 `getActiveSphereType(): SphereType`
- [x] 迁移 `syncBrushColor(): void` (private helper)
- [x] NrrdTools 中保留一行委托方法
- [x] TypeScript 编译通过
- [x] grep 验证: syncBrushColor 仅存在于 LayerChannelManager.ts

### Task 1.3: 迁移 Visibility 方法 ✅
- **From:** `NrrdTools.ts` → **To:** `LayerChannelManager.ts`
- [x] 迁移 `setLayerVisible(layerId, visible): void`
- [x] 迁移 `isLayerVisible(layerId): boolean`
- [x] 迁移 `setChannelVisible(layerId, channel, visible): void`
- [x] 迁移 `isChannelVisible(layerId, channel): boolean`
- [x] 迁移 `getLayerVisibility(): Record<string, boolean>`
- [x] 迁移 `getChannelVisibility(): Record<string, Record<number, boolean>>`
- [x] 迁移 `hasLayerData(layerId): boolean`
- [x] NrrdTools 中保留一行委托方法
- [x] TypeScript 编译通过

### Task 1.4: 迁移 Channel Colors 方法 ✅
- **From:** `NrrdTools.ts` → **To:** `LayerChannelManager.ts`
- [x] 迁移 `setChannelColor(layerId, channel, color): void`
- [x] 迁移 `getChannelColor(layerId, channel): RGBAColor`
- [x] 迁移 `getChannelHexColor(layerId, channel): string`
- [x] 迁移 `getChannelCssColor(layerId, channel): string`
- [x] 迁移 `setChannelColors(layerId, colorMap): void`
- [x] 迁移 `setAllLayersChannelColor(channel, color): void`
- [x] 迁移 `resetChannelColors(layerId?, channel?): void`
- [x] NrrdTools 中保留一行委托方法
- [x] TypeScript 编译通过

### Task 1.5: 在 NrrdTools 中初始化 LayerChannelManager ✅
- **文件:** `NrrdTools.ts`
- [x] 添加 `private layerChannelManager!: LayerChannelManager` 字段
- [x] 在构造函数末尾通过 `initNrrdToolsModules()` 初始化, 传入 3 个 callbacks
- [x] 清理未使用导入: 移除 `rgbaToHex`, `rgbaToCss`, `CHANNEL_HEX_COLORS`
- [x] TypeScript 编译通过

### Task 1.6: Phase 1 综合验证 ✅
- [x] `yarn build` — 零新增错误 (built in 13.62s)
- [x] NrrdTools 中 Layer/Channel 相关方法体均为一行委托 (20 个方法)
- [x] grep 验证: syncBrushColor 仅存在于 LayerChannelManager.ts
- [x] NrrdTools: 2007 → 1774 行 (减少 233 行)
- [x] LayerChannelManager: 211 行
- [x] 手动测试: 切换活动图层 → 笔刷颜色同步
- [x] 手动测试: 切换活动通道 → 绘图通道正确
- [x] 手动测试: 图层可见性切换 → canvas 正确显隐
- [x] 手动测试: 通道可见性切换 → 颜色渲染正确
- [x] 手动测试: 自定义通道颜色 → 显示更新
- [x] 手动测试: 重置颜色 → 恢复默认
- [x] 手动测试: hasLayerData 检测正确
- [x] 手动测试: Sphere type 切换 → 颜色变化

---

## Phase 2: Extract SliceRenderPipeline (3-5 days, Low Risk) ✅

> 提取 ~350 行切片渲染管线到独立类

### Task 2.1: 创建 SliceRenderPipeline 骨架 ✅
- **文件:** 新建 `tools/SliceRenderPipeline.ts`
- [x] 定义 `SliceRenderCallbacks` 接口 (10 callbacks: compositeAllLayers, getOrCreateSliceBuffer, renderSliceToCanvas, getVolumeForLayer, refreshSphereOverlay, syncGuiParameterSettings, repraintCurrentContrastSlice, clearUndoHistory, updateShowNumDiv, updateCurrentContrastSlice)
- [x] 创建 `class SliceRenderPipeline extends BaseTool`
- [x] 构造函数接受 `ctx: ToolContext`, `callbacks: SliceRenderCallbacks`
- [x] 在 `tools/index.ts` 添加导出
- [x] TypeScript 编译通过

### Task 2.2: 迁移 Slice Setup 方法 ✅
- **From:** `NrrdTools.ts` → **To:** `SliceRenderPipeline.ts`
- [x] 迁移 `setDisplaySlicesBaseOnAxis(): void` (public)
- [x] 迁移 `loadDisplaySlicesArray(): void` (private)
- [x] 迁移 `resetDisplaySlicesStatus(): void` (public)
- [x] 迁移 `setupConfigs(): void` (private)
- [x] 迁移 `setMainPreSlice(): void` (private)
- [x] 迁移 `setOriginCanvasAndPre(): void` (private)
- [x] 迁移 `afterLoadSlice(): void` (public)
- [x] 迁移 `updateMaxIndex(): void` (private)
- [x] 迁移 `initState` 字段到 SliceRenderPipeline, 添加 `resetInitState()` 公开方法
- [x] NrrdTools 中内部调用改为 `this.sliceRenderPipeline.*`
- [x] TypeScript 编译通过

### Task 2.3: 迁移 Rendering 方法 ✅
- **From:** `NrrdTools.ts` → **To:** `SliceRenderPipeline.ts`
- [x] 迁移 `reloadMasksFromVolume(): void`
- [x] 迁移 `redrawDisplayCanvas(): void`
- [x] 迁移 `redrawMianPreOnDisplayCanvas(): void`
- [x] 迁移 `flipDisplayImageByAxis(): void`
- [x] 迁移 `setEmptyCanvasSize(axis?): void`
- [x] 迁移 `resetLayerCanvas(): void`
- [x] NrrdTools 中保留一行委托方法
- [x] TypeScript 编译通过

### Task 2.4: Wheel 方法 — 保留在 NrrdTools ✅
- **决定:** `configMouseSliceWheel()` 和 `updateMouseWheelEvent()` 不提取
- **原因:** 依赖 `drawingPrameters` 和 `_keyboardSettings` (不在 ToolContext 中), 属于输入处理非渲染
- [x] 确认保留在 NrrdTools

### Task 2.5: 迁移 View/Canvas 辅助方法 ✅
- **From:** `NrrdTools.ts` → **To:** `SliceRenderPipeline.ts`
- [x] 迁移 `updateOriginAndChangedWH(): void`
- [x] 迁移 `resizePaintArea(factor): void`
- [x] 迁移 `setSyncsliceNum(): void`
- [x] 迁移 `resetPaintAreaUIPosition(l?, t?): void`
- [x] NrrdTools 中保留一行委托方法
- [x] TypeScript 编译通过

### Task 2.6: 在 NrrdTools 中初始化 SliceRenderPipeline ✅
- **文件:** `NrrdTools.ts`
- [x] 添加 `private sliceRenderPipeline!: SliceRenderPipeline` 字段
- [x] 在 `initNrrdToolsModules()` 初始化, 传入 10 个 callbacks
- [x] 更新 NrrdTools 内部调用: `this.someMethod()` → `this.sliceRenderPipeline.someMethod()`
- [x] 绑定 7 个 setupGUI delegate 方法 (`.bind(this)`) 确保 this 上下文正确
- [x] TypeScript 编译通过

### Task 2.7: 处理 CommToolsData/DrawToolCore 中的渲染方法 ✅
- **注意:** 部分渲染方法定义在继承链中
- [x] 审计: compositeAllLayers, getOrCreateSliceBuffer, renderSliceToCanvas, getVolumeForLayer (CommToolsData), refreshSphereOverlay, repraintCurrentContrastSlice (DrawToolCore)
- [x] 确认: 继承链中的方法通过 callbacks 传递，不直接引用
- [x] TypeScript 编译通过

### Task 2.8: Phase 2 综合验证 ✅
- [x] `yarn build` — 零新增错误 (built in 13.41s)
- [x] NrrdTools 中渲染相关方法体均为一行委托 (10 个公开方法)
- [x] grep 验证: 私有方法 (setupConfigs, setMainPreSlice, setOriginCanvasAndPre, loadDisplaySlicesArray, updateMaxIndex) 已从 NrrdTools 移除
- [x] grep 验证: initState 已从 NrrdTools 移除 (迁移到 SliceRenderPipeline)
- [x] NrrdTools: 1774 → 1418 行 (减少 356 行)
- [x] SliceRenderPipeline: 453 行
- [x] 手动测试: 三轴切片切换正常
- [x] 手动测试: 滚轮切片导航正常
- [x] 手动测试: 缩放 + 画面重绘正常
- [x] 手动测试: 对比度调整 → 重绘正常
- [x] 手动测试: Mask 加载后渲染正确
- [x] 手动测试: 图层切换 → canvas 重绘正确
- [x] 手动测试: Sphere 模式 → overlay 正常

---

## Phase 3: Extract DataLoader (3-5 days, Medium Risk) ✅

> 提取 ~200 行数据加载逻辑到独立类

### Task 3.1: 创建 DataLoader 骨架 ✅
- **文件:** 新建 `tools/DataLoader.ts`
- [x] 定义 `DataLoaderCallbacks` 接口 (7 callbacks: invalidateSliceBuffer, setDisplaySlicesBaseOnAxis, afterLoadSlice, setEmptyCanvasSize, syncLayerSliceData, reloadMasksFromVolume, resetZoom)
- [x] 创建 `class DataLoader extends BaseTool`
- [x] 在 `tools/index.ts` 添加导出
- [x] TypeScript 编译通过

### Task 3.2: 迁移数据加载方法 ✅
- **From:** `NrrdTools.ts` → **To:** `DataLoader.ts`
- [x] 迁移 `setAllSlices(allSlices): void` — MaskVolume 初始化通过 ToolContext 直接访问 (protectedData 在 ToolContext 中可用)
- [x] 迁移 `loadingMaskByLayer(masks, index, imageData): ImageData` (private helper, 无需委托)
- [x] 迁移 `setMasksData(masksData, loadingBar?): void`
- [x] 迁移 `setMasksFromNIfTI(layerVoxels, loadingBar?): void`
- [x] NrrdTools 中保留一行委托方法
- [x] TypeScript 编译通过

### Task 3.3: 编程式球体放置评估 ✅
- **决定:** `setCalculateDistanceSphere()` 保留在 `NrrdTools.ts`
- **原因:** 依赖 `this.drawCalculatorSphere()`, `this.sphereTool.*`, `this.crosshairTool.*` — 这些是 DrawToolCore protected 成员，不在 ToolContext 中。属于 Sphere 模式编排，非数据加载职责。

### Task 3.4: protectedData 直接赋值处理 ✅
- **决定:** 通过 ToolContext 直接访问 (已确认 protectedData 在 ToolContext 中可用)
- [x] setAllSlices 中的 MaskVolume 初始化均通过 `this.ctx.protectedData.*` 和 `this.ctx.nrrd_states.*` 访问

### Task 3.5: 在 NrrdTools 中初始化 DataLoader ✅
- **文件:** `NrrdTools.ts`
- [x] 添加 `private dataLoader!: DataLoader` 字段
- [x] 在 `initNrrdToolsModules()` 初始化, 传入 7 个 callbacks
- [x] 移除未使用导入: `exportPaintImageType`, `MASK_CHANNEL_COLORS`, `SPHERE_CHANNEL_MAP`, `SPHERE_LABELS`
- [x] TypeScript 编译通过

### Task 3.6: Phase 3 综合验证 ✅
- [x] `yarn build` — 零新增错误 (built in 13.60s)
- [x] grep 验证: `loadingMaskByLayer`, `SPHERE_CHANNEL_MAP`, `SPHERE_LABELS`, `MASK_CHANNEL_COLORS`, `exportPaintImageType` 均已从 NrrdTools 移除
- [x] NrrdTools: 1418 → 1270 行 (减少 148 行)
- [x] DataLoader: 222 行
- [x] 手动测试: 加载 NRRD slices → 显示正常
- [x] 手动测试: 加载 mask data → 图层渲染正确
- [x] 手动测试: 加载 NIfTI voxels → 体积数据正确
- [x] 手动测试: 编程式球体放置 → 正常
- [x] 手动测试: 加载后切换轴 → 渲染正确

---

## Phase 4: Clean up NrrdTools Facade (1-2 days, Low Risk) ✅

> 整理 NrrdTools 为干净的 Facade 类

### Task 4.1: 审计 NrrdTools 剩余代码 ✅
- [x] 列出所有仍留在 NrrdTools 中的方法 (~92 个方法/委托)
- [x] 确认每个方法的归属合理性:
  - Public API (mode/slider/action) → 保留 (thin orchestration) ✅
  - Keyboard & history → 保留 ✅
  - Sphere enter/exit → 保留 (编排层, 依赖 DrawToolCore protected 成员) ✅
  - Clear/reset → 保留 ✅
  - GUI setup → 保留 ✅
  - View getters → 保留 ✅
- [x] 标记可清理项: 移除未使用 `paintedImage` 字段, `IPaintImage`/`IPaintImages` 导入

### Task 4.2: 组织方法顺序 ✅
- **文件:** `NrrdTools.ts`
- [x] 按功能区域重排方法 (13 个分区):
  ```
  1. Constructor + Module Initialisation
  2. GUI Setup
  3. Public API — Mode/Slider/Color/Action
  4. Public API — Keyboard & History
  5. Public API — View Control (drag, zoom, pan, slice nav)
  6. Public API — Data Getters
  7. Delegated — LayerChannelManager
  8. Delegated — SliceRenderPipeline
  9. Delegated — DataLoader
  10. Sphere Orchestration
  11. Clear/Reset
  12. Internal — Input Events
  13. Internal — Utility
  ```
- [x] 添加分区注释 (═══ 风格, 与 DrawToolCore 一致)
- [x] TypeScript 编译通过

### Task 4.3: 验证代码量 ✅
- [x] NrrdTools.ts: 1300 行 (原计划 ≤700, 实际因 setSliceOrientation 143行、Mode API 150行等无法提取的 facade 逻辑，1300 行是合理最小值)
- [x] LayerChannelManager.ts: 211 行 ≤ 600 ✅
- [x] SliceRenderPipeline.ts: 453 行 (略超 ≤400 计划, +53 行来自 view/canvas helpers)
- [x] DataLoader.ts: 222 行 ≤ 250 ✅
- [x] 总代码量: 2186 行 ≈ 原 2007 行 +9% (在 ±10% 容差内, callback 接口定义开销) ✅

### Task 4.4: 清理未使用导入 ✅
- **文件:** `NrrdTools.ts`
- [x] 移除未使用字段: `paintedImage: IPaintImage | undefined`
- [x] 移除未使用导入: `IPaintImage`, `IPaintImages`
- [x] 修复 JSDoc typo: `@param aixs` → `@param axisTo`
- [x] TypeScript 编译通过

### Task 4.5: Phase 4 综合验证 (Full Regression)
- [x] `yarn build` — 零错误 (built in 13.73s)
- [ ] 手动测试: 画图 (pencil, brush, eraser) — 三个轴
- [ ] 手动测试: 平移 (右键拖动)
- [ ] 手动测试: 缩放 (滚轮 / slider)
- [ ] 手动测试: 切片导航 (拖动, 滚轮)
- [ ] 手动测试: Sphere 放置 (4 种类型)
- [ ] 手动测试: Calculator 模式
- [ ] 手动测试: Crosshair
- [ ] 手动测试: 对比度调整 (slider + drag)
- [ ] 手动测试: Undo/redo
- [ ] 手动测试: Mask save/load
- [ ] 手动测试: Layer/channel 切换 + 可见性
- [ ] 手动测试: 通道颜色自定义 + 重置
- [ ] 手动测试: Clear slice / clear all
- [ ] 手动测试: NRRD 加载 + NIfTI mask 加载
- [ ] 手动测试: dat.gui 面板正常工作

---

## Summary

| Phase | Status | Lines | Key Metric |
|-------|--------|-------|------------|
| **1: LayerChannelManager** | ✅ Complete | 211 lines | 20 delegated methods, 3 callbacks |
| **2: SliceRenderPipeline** | ✅ Complete | 453 lines | 10 delegated methods, 10 callbacks |
| **3: DataLoader** | ✅ Complete | 222 lines | 3 delegated methods, 7 callbacks |
| **4: Facade Cleanup** | ✅ Code Complete | 1300 lines | 13 sections, 3 unused imports removed |
| **Total** | **Code Complete** | **2186 lines** | **Original: 2007 (+9% overhead)** |

### Reduction Progression
```
Phase 0 (original):  2007 lines
Phase 1 (−233):      1774 lines  → LayerChannelManager extracted
Phase 2 (−356):      1418 lines  → SliceRenderPipeline extracted
Phase 3 (−148):      1270 lines  → DataLoader extracted
Phase 4 (reorg):     1300 lines  → Facade cleaned & organized (+30 section headers)
```

Decision gate after each phase — 可在任何阶段暂停, 不影响已完成部分。

---

**Last Updated:** 2026-03-01 (All phases code complete, awaiting Phase 4 full regression manual testing)
