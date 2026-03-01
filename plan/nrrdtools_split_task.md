# NrrdTools.ts God Class Split — Task List

> **Plan:** [nrrdtools_split_plan.md](nrrdtools_split_plan.md)
> **Status:** Not Started
> **Estimated Duration:** 2-3 weeks (4 phases)

---

## Architecture: Extraction Target

将 NrrdTools.ts (71KB) 拆分为 Facade + 3 个功能模块：

```
NrrdTools.ts (~22KB, Facade)
  ├── layerChannelManager: LayerChannelManager   ← 图层/通道管理 (~530 lines)
  │     ├── Active layer/channel/sphereType
  │     ├── Visibility control
  │     └── Channel colors
  │
  ├── sliceRenderPipeline: SliceRenderPipeline   ← 切片渲染管线 (~350 lines)
  │     ├── Slice setup & axis config
  │     ├── Canvas rendering & flip
  │     ├── Mask reload from MaskVolume
  │     └── Mouse wheel events
  │
  ├── dataLoader: DataLoader                      ← 数据加载 (~200 lines)
  │     ├── setAllSlices (NRRD)
  │     ├── setMasksData (legacy)
  │     ├── setMasksFromNIfTI
  │     └── setCalculateDistanceSphere
  │
  └── (Retained in NrrdTools)
        ├── Public API: mode/slider/color/action
        ├── Keyboard & history config
        ├── View control (zoom, pan, slice nav)
        ├── Sphere mode enter/exit
        ├── GUI setup
        └── Clear/reset operations
```

**提取模式**: 与 tools/ 目录一致 — 通过 `ToolContext` 访问共享状态, 通过 `*Callbacks` 回调宿主方法。

---

## Phase 1: Extract LayerChannelManager (3-5 days, Low Risk)

> 提取 ~530 行 layer/channel 管理代码到独立类

### Task 1.1: 创建 LayerChannelManager 骨架
- **文件:** 新建 `tools/LayerChannelManager.ts`
- [ ] 定义 `LayerChannelCallbacks` 接口:
  ```
  compositeAllLayers(): void
  reloadMasksFromVolume(): void
  getVolumeForLayer(layer: string): MaskVolume
  syncBrushColor(): void
  ```
- [ ] 创建 `class LayerChannelManager extends BaseTool`
- [ ] 构造函数接受 `ctx: ToolContext`, `callbacks: LayerChannelCallbacks`
- [ ] 在 `tools/index.ts` 添加导出
- [ ] TypeScript 编译通过

### Task 1.2: 迁移 Active Layer/Channel 方法
- **From:** `NrrdTools.ts` L206-245, L520-527
- **To:** `LayerChannelManager.ts`
- [ ] 迁移 `setActiveLayer(layerId: string): void`
- [ ] 迁移 `getActiveLayer(): string`
- [ ] 迁移 `setActiveChannel(channel: ChannelValue): void`
- [ ] 迁移 `getActiveChannel(): number`
- [ ] 迁移 `setActiveSphereType(type: SphereType): void` (包含颜色同步逻辑)
- [ ] 迁移 `getActiveSphereType(): SphereType`
- [ ] 迁移 `syncBrushColor(): void` (private helper, L502)
- [ ] NrrdTools 中保留一行委托方法
- [ ] TypeScript 编译通过
- [ ] grep 验证: NrrdTools 中无残留逻辑

### Task 1.3: 迁移 Visibility 方法
- **From:** `NrrdTools.ts` L534-597
- **To:** `LayerChannelManager.ts`
- [ ] 迁移 `setLayerVisible(layerId, visible): void`
- [ ] 迁移 `isLayerVisible(layerId): boolean`
- [ ] 迁移 `setChannelVisible(layerId, channel, visible): void`
- [ ] 迁移 `isChannelVisible(layerId, channel): boolean`
- [ ] 迁移 `getLayerVisibility(): Record<string, boolean>`
- [ ] 迁移 `getChannelVisibility(): Record<string, Record<number, boolean>>`
- [ ] 迁移 `hasLayerData(layerId): boolean`
- [ ] NrrdTools 中保留一行委托方法
- [ ] TypeScript 编译通过

### Task 1.4: 迁移 Channel Colors 方法
- **From:** `NrrdTools.ts` L621-735
- **To:** `LayerChannelManager.ts`
- [ ] 迁移 `setChannelColor(layerId, channel, color): void`
- [ ] 迁移 `getChannelColor(layerId, channel): RGBAColor`
- [ ] 迁移 `getChannelHexColor(layerId, channel): string`
- [ ] 迁移 `getChannelCssColor(layerId, channel): string`
- [ ] 迁移 `setChannelColors(layerId, colorMap): void`
- [ ] 迁移 `setAllLayersChannelColor(channel, color): void`
- [ ] 迁移 `resetChannelColors(layerId?, channel?): void`
- [ ] NrrdTools 中保留一行委托方法
- [ ] TypeScript 编译通过

### Task 1.5: 在 NrrdTools 中初始化 LayerChannelManager
- **文件:** `NrrdTools.ts`
- [ ] 添加 `private layerChannelManager!: LayerChannelManager` 字段
- [ ] 在构造函数或 `initTools()` 扩展中初始化, 传入 callbacks:
  ```typescript
  this.layerChannelManager = new LayerChannelManager(toolCtx, {
    compositeAllLayers: () => this.compositeAllLayers(),
    reloadMasksFromVolume: () => this.reloadMasksFromVolume(),
    getVolumeForLayer: (layer) => this.getVolumeForLayer(layer),
    syncBrushColor: () => this.syncBrushColor(),
  });
  ```
- [ ] TypeScript 编译通过

### Task 1.6: Phase 1 综合验证
- [ ] `yarn build` — 零新增错误
- [ ] NrrdTools 中 Layer/Channel 相关方法体均为一行委托
- [ ] grep 验证: 无遗漏引用
- [ ] 手动测试: 切换活动图层 → 笔刷颜色同步
- [ ] 手动测试: 切换活动通道 → 绘图通道正确
- [ ] 手动测试: 图层可见性切换 → canvas 正确显隐
- [ ] 手动测试: 通道可见性切换 → 颜色渲染正确
- [ ] 手动测试: 自定义通道颜色 → 显示更新
- [ ] 手动测试: 重置颜色 → 恢复默认
- [ ] 手动测试: hasLayerData 检测正确
- [ ] 手动测试: Sphere type 切换 → 颜色变化

---

## Phase 2: Extract SliceRenderPipeline (3-5 days, Low Risk)

> 提取 ~350 行切片渲染管线到独立类

### Task 2.1: 创建 SliceRenderPipeline 骨架
- **文件:** 新建 `tools/SliceRenderPipeline.ts`
- [ ] 定义 `SliceRenderCallbacks` 接口:
  ```
  compositeAllLayers(): void
  refreshSphereOverlay(): void
  syncGuiParameterSettings(): void
  filterDrawedImage(axis: string, index: number): void
  getVolumeForLayer(layer: string): MaskVolume
  getOrCreateSliceBuffer(axis: string): ImageData | null
  renderSliceToCanvas(layerId, axis, index, buffer, ctx, w, h): void
  ```
- [ ] 创建 `class SliceRenderPipeline extends BaseTool`
- [ ] 构造函数接受 `ctx: ToolContext`, `callbacks: SliceRenderCallbacks`
- [ ] 在 `tools/index.ts` 添加导出
- [ ] TypeScript 编译通过

### Task 2.2: 迁移 Slice Setup 方法
- **From:** `NrrdTools.ts` L1463-1579
- **To:** `SliceRenderPipeline.ts`
- [ ] 迁移 `setDisplaySlicesBaseOnAxis(): void`
- [ ] 迁移 `loadDisplaySlicesArray(): void`
- [ ] 迁移 `resetDisplaySlicesStatus(): void`
- [ ] 迁移 `setupConfigs(): void`
- [ ] 迁移 `setMainPreSlice(): void`
- [ ] 迁移 `setOriginCanvasAndPre(): void`
- [ ] 迁移 `afterLoadSlice(): void`
- [ ] 迁移 `updateMaxIndex(): void`
- [ ] NrrdTools 中保留委托方法
- [ ] TypeScript 编译通过

### Task 2.3: 迁移 Rendering 方法
- **From:** `NrrdTools.ts` L1674, L1743, L1825-1961
- **To:** `SliceRenderPipeline.ts`
- [ ] 迁移 `reloadMasksFromVolume(): void`
- [ ] 迁移 `redrawDisplayCanvas(): void`
- [ ] 迁移 `redrawMianPreOnDisplayCanvas(): void`
- [ ] 迁移 `flipDisplayImageByAxis(): void`
- [ ] 迁移 `setEmptyCanvasSize(axis?): void`
- [ ] 迁移 `resetLayerCanvas(): void`
- [ ] NrrdTools 中保留委托方法
- [ ] TypeScript 编译通过

### Task 2.4: 迁移 Wheel 方法
- **From:** `NrrdTools.ts` L1967-1999
- **To:** `SliceRenderPipeline.ts`
- [ ] 迁移 `configMouseSliceWheel(): (e: WheelEvent) => void`
- [ ] 迁移 `updateMouseWheelEvent(): void`
- [ ] NrrdTools 中保留委托方法
- [ ] TypeScript 编译通过

### Task 2.5: 迁移 View/Canvas 辅助方法
- **From:** `NrrdTools.ts` L1589-1606, L1654, L1771
- **To:** `SliceRenderPipeline.ts`
- [ ] 迁移 `updateOriginAndChangedWH(): void`
- [ ] 迁移 `resizePaintArea(factor): void`
- [ ] 迁移 `setSyncsliceNum(): void`
- [ ] 迁移 `resetPaintAreaUIPosition(l?, t?): void`
- [ ] NrrdTools 中保留委托方法
- [ ] TypeScript 编译通过

### Task 2.6: 在 NrrdTools 中初始化 SliceRenderPipeline
- **文件:** `NrrdTools.ts`
- [ ] 添加 `private sliceRenderPipeline!: SliceRenderPipeline` 字段
- [ ] 初始化, 传入 callbacks
- [ ] 更新 NrrdTools 内部调用: 原来 `this.someMethod()` → `this.sliceRenderPipeline.someMethod()`
- [ ] TypeScript 编译通过

### Task 2.7: 处理 CommToolsData/DrawToolCore 中的渲染方法
- **注意:** 部分渲染方法定义在继承链中 (CommToolsData: `compositeAllLayers`, `renderSliceToCanvas`, `getOrCreateSliceBuffer`)
- [ ] 审计: 哪些方法需要通过 callbacks 暴露给 SliceRenderPipeline
- [ ] 确认: 继承链中的方法通过 callbacks 传递，不直接引用
- [ ] TypeScript 编译通过

### Task 2.8: Phase 2 综合验证
- [ ] `yarn build` — 零新增错误
- [ ] NrrdTools 中渲染相关方法体均为委托
- [ ] grep 验证: 无遗漏引用
- [ ] 手动测试: 三轴切片切换正常
- [ ] 手动测试: 滚轮切片导航正常
- [ ] 手动测试: 缩放 + 画面重绘正常
- [ ] 手动测试: 对比度调整 → 重绘正常
- [ ] 手动测试: Mask 加载后渲染正确
- [ ] 手动测试: 图层切换 → canvas 重绘正确
- [ ] 手动测试: Sphere 模式 → overlay 正常

---

## Phase 3: Extract DataLoader (3-5 days, Medium Risk)

> 提取 ~200 行数据加载逻辑到独立类

### Task 3.1: 创建 DataLoader 骨架
- **文件:** 新建 `tools/DataLoader.ts`
- [ ] 定义 `DataLoaderCallbacks` 接口:
  ```
  setupConfigs(): void
  reloadMasksFromVolume(): void
  compositeAllLayers(): void
  getVolumeForLayer(layer: string): MaskVolume
  initMaskVolume(layerId: string, dims: number[]): MaskVolume
  setDisplaySlicesBaseOnAxis(): void
  ```
- [ ] 创建 `class DataLoader extends BaseTool`
- [ ] 在 `tools/index.ts` 添加导出
- [ ] TypeScript 编译通过

### Task 3.2: 迁移数据加载方法
- **From:** `NrrdTools.ts` L911-1084
- **To:** `DataLoader.ts`
- [ ] 迁移 `setAllSlices(allSlices): void` — 注意: 涉及 MaskVolume 初始化 + protectedData.mainSlices 赋值
- [ ] 迁移 `loadingMaskByLayer(masks, index, imageData): ImageData` (private helper)
- [ ] 迁移 `setMasksData(masksData, loadingBar?): void`
- [ ] 迁移 `setMasksFromNIfTI(layerVoxels, loadingBar?): void`
- [ ] NrrdTools 中保留委托方法
- [ ] TypeScript 编译通过

### Task 3.3: 迁移编程式球体放置
- **From:** `NrrdTools.ts` L1115
- **To:** `DataLoader.ts` 或保留在 `NrrdTools.ts`
- [ ] 评估: `setCalculateDistanceSphere()` 是否属于 DataLoader 职责
  - 如果依赖过多 NrrdTools 内部方法 → 保留在 NrrdTools
  - 如果可独立 → 迁移到 DataLoader
- [ ] TypeScript 编译通过

### Task 3.4: 处理 protectedData 直接赋值
- **注意:** `setAllSlices()` 直接设置 `this.protectedData.mainSlices`, `this.protectedData.mainPreSlices` 等
- [ ] 评估: 通过 callback 传递赋值操作，或通过 ToolContext 直接访问
- [ ] 如果使用 callback: 定义 `setMainSlices(slices)`, `setMainPreSlices(pre)` 回调
- [ ] 如果使用 ToolContext 直接访问: 记录设计决定，确认 protectedData 在 ToolContext 中可用
- [ ] TypeScript 编译通过

### Task 3.5: 在 NrrdTools 中初始化 DataLoader
- **文件:** `NrrdTools.ts`
- [ ] 添加 `private dataLoader!: DataLoader` 字段
- [ ] 初始化, 传入 callbacks
- [ ] TypeScript 编译通过

### Task 3.6: Phase 3 综合验证
- [ ] `yarn build` — 零新增错误
- [ ] grep 验证: 无遗漏引用
- [ ] 手动测试: 加载 NRRD slices → 显示正常
- [ ] 手动测试: 加载 mask data → 图层渲染正确
- [ ] 手动测试: 加载 NIfTI voxels → 体积数据正确
- [ ] 手动测试: 编程式球体放置 → 正常
- [ ] 手动测试: 加载后切换轴 → 渲染正确

---

## Phase 4: Clean up NrrdTools Facade (1-2 days, Low Risk)

> 整理 NrrdTools 为干净的 Facade 类

### Task 4.1: 审计 NrrdTools 剩余代码
- [ ] 列出所有仍留在 NrrdTools 中的方法
- [ ] 确认每个方法的归属合理性:
  - Public API (mode/slider/action) → 保留 (thin orchestration)
  - Keyboard & history → 保留
  - Sphere enter/exit → 保留 (编排层)
  - Clear/reset → 保留
  - GUI setup → 保留
  - View getters → 保留
- [ ] 标记任何还可进一步提取的方法

### Task 4.2: 组织方法顺序
- **文件:** `NrrdTools.ts`
- [ ] 按功能区域重排方法:
  ```
  1. Constructor + initModules
  2. Public API — Mode/Slider/Color/Action
  3. Public API — Keyboard & History
  4. Public API — View/Data getters
  5. Delegated — LayerChannelManager
  6. Delegated — SliceRenderPipeline
  7. Delegated — DataLoader
  8. Internal — Sphere orchestration
  9. Internal — Clear/reset
  10. Internal — GUI setup
  ```
- [ ] 添加分区注释 (与 DrawToolCore 风格一致)
- [ ] TypeScript 编译通过

### Task 4.3: 验证代码量
- [ ] NrrdTools.ts ≤ 700 行
- [ ] LayerChannelManager.ts ≤ 600 行
- [ ] SliceRenderPipeline.ts ≤ 400 行
- [ ] DataLoader.ts ≤ 250 行
- [ ] 总代码量 ≈ 原 NrrdTools.ts (±10%, 允许少量 callback 接口定义开销)

### Task 4.4: 清理未使用导入
- **文件:** `NrrdTools.ts`
- [ ] 移除迁移后不再需要的 import
- [ ] TypeScript 编译通过

### Task 4.5: Phase 4 综合验证 (Full Regression)
- [ ] `yarn build` — 零错误
- [ ] `vue-tsc --noEmit` — 无新 TS 错误
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

| Phase | Tasks | Checkboxes | Lines Moved | Risk | Duration |
|-------|-------|------------|-------------|------|----------|
| **1: LayerChannelManager** | 6 | 42 | ~530 | Low | 3-5 days |
| **2: SliceRenderPipeline** | 8 | 42 | ~350 | Low | 3-5 days |
| **3: DataLoader** | 6 | 22 | ~200 | Medium | 3-5 days |
| **4: Facade Cleanup** | 5 | 24 | 0 (reorg) | Low | 1-2 days |
| **Total** | **25** | **130** | **~1080** | | **2-3 weeks** |

Decision gate after each phase — 可在任何阶段暂停, 不影响已完成部分。

---

**Last Updated:** 2026-03-01
