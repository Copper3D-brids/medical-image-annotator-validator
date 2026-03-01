# NrrdTools.ts God Class Split Plan

> **Status:** Planning
> **Prerequisites:** State Management Refactor (COMPLETED), Tool Extraction Phase 1-2-3 (COMPLETED)
> **Scope:** 将 NrrdTools.ts (71KB, ~2007 行, 70+ 方法) 拆分为 4-5 个模块，每个 ≤ 20KB
> **Estimated Duration:** 2-3 weeks (4 phases)
> **Risk:** Phase 1-2 Low, Phase 3 Medium, Phase 4 Low

---

## 1. Problem Statement

### 1.1 Current State

`NrrdTools.ts` 是整个 segmentation 模块的公共入口类。经过 6 个阶段的重构（Tool Extraction → State Management → Undo System），工具逻辑和状态管理已经成功拆分。但 NrrdTools 本身仍然承担了过多职责：

```
NrrdTools.ts (71KB, ~2007 lines, 70+ methods)
├── Public API 门面 (mode/slider/color/action)       ~400 lines
├── Layer/Channel 管理 (visibility, colors, active)   ~530 lines
├── 数据加载 (slices, masks, NIfTI)                   ~200 lines
├── 切片渲染管线 (display, setup, axis)               ~300 lines
├── Canvas 渲染 (reload, redraw, flip, resize)        ~200 lines
├── Sphere 模式编排 (enter/exit)                       ~60 lines
├── Keyboard/History (undo, redo, config)              ~150 lines
├── View 控制 (zoom, pan area, slice nav)              ~120 lines
└── GUI 初始化 + 杂项                                  ~50 lines
```

### 1.2 问题

1. **认知负担**: 开发者修改任何功能都要在 2007 行中定位相关代码
2. **合并冲突风险**: 多人同时修改不同功能区域时，都在同一文件操作
3. **测试困难**: 无法独立测试渲染管线、图层管理等子系统
4. **继承链加剧**: `NrrdTools → DrawToolCore → CommToolsData` 三层继承，方法分布在 3 个大文件中

### 1.3 方法清单 (按功能区域)

#### A. Public API — GUI Control (~400 lines, L98-496)
| 方法 | 行号 | 说明 |
|------|------|------|
| `setMode()` | L258 | 工具模式切换 |
| `getMode()` | L310 | 获取当前模式 |
| `isCalculatorActive()` | L321 | 计算器模式检测 |
| `setOpacity()` / `getOpacity()` | L331/338 | Mask 透明度 |
| `setBrushSize()` / `getBrushSize()` | L346/354 | 笔刷大小 |
| `setWindowHigh()` / `setWindowLow()` | L362/371 | 窗宽窗位 |
| `finishWindowAdjustment()` | L379 | 完成对比度调整 |
| `adjustContrast()` | L388 | Delta 调整对比度 |
| `getSliderMeta()` | L411 | UI slider 元数据 |
| `setPencilColor()` / `getPencilColor()` | L438/445 | 画笔颜色 |
| `executeAction()` | L457 | 操作分发 (undo/redo/clear/...) |

#### B. Layer & Channel Management (~530 lines, L201-735)
| 方法 | 行号 | 说明 |
|------|------|------|
| `setActiveLayer()` | L206 | 设置活动图层 |
| `setActiveChannel()` | L214 | 设置活动通道 |
| `setActiveSphereType()` | L228 | 设置球体类型 + 颜色同步 |
| `getActiveLayer()` / `getActiveChannel()` | L520/527 | 获取活动图层/通道 |
| `getActiveSphereType()` | L245 | 获取球体类型 |
| `setLayerVisible()` / `isLayerVisible()` | L534/542 | 图层可见性 |
| `setChannelVisible()` / `isChannelVisible()` | L549/559 | 通道可见性 |
| `getLayerVisibility()` / `getChannelVisibility()` | L566/573 | 批量获取可见性 |
| `hasLayerData()` | L597 | 检查图层是否有数据 |
| `setChannelColor()` / `getChannelColor()` | L621/642 | 通道颜色 |
| `getChannelHexColor()` / `getChannelCssColor()` | L653/660 | 颜色格式转换 |
| `setChannelColors()` | L678 | 批量设置颜色 |
| `setAllLayersChannelColor()` | L699 | 全局通道颜色 |
| `resetChannelColors()` | L725 | 重置颜色 |

#### C. Slice Rendering Pipeline (~300 lines, L1463-1600, L1825-1961)
| 方法 | 行号 | 说明 |
|------|------|------|
| `setDisplaySlicesBaseOnAxis()` | L1463 | 按轴设置 display slices |
| `loadDisplaySlicesArray()` | L1476 | 加载 display slices 数组 |
| `resetDisplaySlicesStatus()` | L1503 | 重置 display slices 状态 |
| `setupConfigs()` | L1510 | 主 setup 编排 |
| `setMainPreSlice()` | L1531 | 设置 main pre slice |
| `setOriginCanvasAndPre()` | L1538 | 设置 origin canvas |
| `afterLoadSlice()` | L1562 | 加载后处理 |
| `updateMaxIndex()` | L1579 | 更新最大索引 |
| `reloadMasksFromVolume()` | L1825 | 从 MaskVolume 重新渲染所有图层 |
| `redrawDisplayCanvas()` | L1936 | 重绘 contrast image |
| `redrawMianPreOnDisplayCanvas()` | L1743 | 完整重绘 main + pre |
| `flipDisplayImageByAxis()` | L1873 | 3D→2D 坐标翻转 |
| `setEmptyCanvasSize()` | L1907 | 临时 canvas 尺寸 |
| `resetLayerCanvas()` | L1674 | 清空所有图层 masks |
| `configMouseSliceWheel()` | L1967 | 滚轮切片事件 |
| `updateMouseWheelEvent()` | L1985 | 绑定/重绑滚轮 |

#### D. Data Loading (~200 lines, L889-1084)
| 方法 | 行号 | 说明 |
|------|------|------|
| `init()` | L889 | 容器初始化 |
| `setAllSlices()` | L911 | 加载 NRRD slices + 初始化 MaskVolume |
| `loadingMaskByLayer()` | L974 | 旧格式 mask 加载辅助 |
| `setMasksData()` | L992 | 加载 legacy mask 数据 |
| `setMasksFromNIfTI()` | L1043 | 加载 NIfTI 体素数据 |
| `setCalculateDistanceSphere()` | L1115 | 编程式球体放置 |

#### E. View Control (~120 lines)
| 方法 | 行号 | 说明 |
|------|------|------|
| `setMainAreaSize()` | L1397 | 缩放 [1-8] |
| `setBaseDrawDisplayCanvasesSize()` | L110 | 基础 canvas 尺寸 |
| `resetPaintAreaUIPosition()` | L1654 | 居中 canvas |
| `setSliceMoving()` | L1376 | RAF 节流切片导航 |
| `setSyncsliceNum()` | L1606 | 同步 contrast slices |
| `resizePaintArea()` | L1771 | 重设大小 + 重载 masks |
| `updateOriginAndChangedWH()` | L1589 | 更新 canvas 尺寸 |
| `getCurrentImageDimension()` | L1090 | 获取图像尺寸 |
| `getVoxelSpacing()` | L1094 | 获取体素间距 |
| `getSpaceOrigin()` | L1097 | 获取空间原点 |
| `getMaxSliceNum()` | L1420 | 最大切片数 |
| `getCurrentSlicesNumAndContrastNum()` | L1430 | 当前切片和对比度 |
| `getCurrentSliceIndex()` | L1437 | 当前切片索引 |

#### F. Sphere Mode Orchestration (~60 lines, L1683-1741)
| 方法 | 行号 | 说明 |
|------|------|------|
| `enterSphereMode()` | L1691 | 清除图层, 禁用拖拽, 显示球体 overlay |
| `exitSphereMode()` | L1722 | 清除球体 canvas, 恢复图层数据 |

#### G. Mask Clear & Reset (~55 lines, L1320-1375)
| 方法 | 行号 | 说明 |
|------|------|------|
| `clearActiveLayer()` | L1625 | 清除活动图层 3D 体积 |
| `reset()` | L1327 | 完整重置 |
| `clearDictionary()` | L1896 | 辅助方法 |

#### H. Keyboard & History (~150 lines, L737-884)
| 方法 | 行号 | 说明 |
|------|------|------|
| `undo()` / `redo()` | L751/767 | 撤销/重做 |
| `enterKeyboardConfig()` / `exitKeyboardConfig()` | L785/797 | 键盘配置模式 |
| `setKeyboardSettings()` / `getKeyboardSettings()` | L856/882 | 键盘快捷键 |
| `setContrastShortcutEnabled()` / `isContrastShortcutEnabled()` | L822/829 | 对比度快捷键 |

---

## 2. Extraction Strategy

### 2.1 核心挑战

NrrdTools 通过三层继承链 (`NrrdTools → DrawToolCore → CommToolsData`) 访问所有共享状态：

```typescript
// NrrdTools 内部大量使用继承来的 protected 成员
this.nrrd_states.view.changedWidth        // 来自 CommToolsData
this.gui_states.mode.sphere               // 来自 CommToolsData
this.protectedData.canvases.drawingCanvas  // 来自 CommToolsData
this.annotationCallbacks.onMaskChanged()   // 来自 DrawToolCore
```

不能简单 "提取方法到新类" — 需要为提取出的模块提供访问共享状态的机制。

### 2.2 方案: Host 接口 + 组合模式

沿用已成功实践的 `ToolContext + *Callbacks` 模式（与 tools/ 目录一致）：

```typescript
// 提取的模块通过 ToolContext 访问共享状态
// 通过 Callbacks 接口回调宿主方法
class SliceRenderPipeline {
  constructor(
    private ctx: ToolContext,
    private callbacks: SliceRenderCallbacks
  ) {}
}

interface SliceRenderCallbacks {
  compositeAllLayers(): void;
  refreshSphereOverlay(): void;
  // ... 只暴露必需的宿主方法
}
```

### 2.3 提取优先级

| 模块 | 代码量 | 自包含度 | 优先级 | 理由 |
|------|--------|---------|--------|------|
| **SliceRenderPipeline** | ~300 lines | 高 | P1 | 最大独立功能块, 渲染管线逻辑清晰 |
| **LayerChannelManager** | ~530 lines | 高 | P1 | 纯 API 层, getter/setter 为主, 低耦合 |
| **DataLoader** | ~200 lines | 中 | P2 | init 时逻辑, 与渲染管线有依赖 |
| **SphereOrchestrator** | ~60 lines | 中 | P3 | 较小, 可合并到 SphereTool 或保留 |

---

## 3. Phased Refactor Strategy

```
Phase 1 (3-5 days)  → Extract LayerChannelManager     [Low Risk]
Phase 2 (3-5 days)  → Extract SliceRenderPipeline      [Low Risk]
Phase 3 (3-5 days)  → Extract DataLoader               [Medium Risk]
Phase 4 (1-2 days)  → Clean up NrrdTools Facade        [Low Risk]
```

每个阶段可独立部署和测试。

---

## 4. Phase 1: Extract LayerChannelManager (3-5 days)

### Goal
将 Layer/Channel 管理的 ~530 行代码提取到独立的 `LayerChannelManager` 类。

### Why First
- 方法几乎全是 getter/setter，对外部依赖最少
- 占代码量最大 (~530 行)
- 逻辑高内聚：active layer/channel 管理、可见性控制、通道颜色

### Design

```typescript
// tools/LayerChannelManager.ts
export interface LayerChannelCallbacks {
  compositeAllLayers(): void;
  reloadMasksFromVolume(): void;
  getVolumeForLayer(layer: string): MaskVolume;
  syncBrushColor(): void;
}

export class LayerChannelManager extends BaseTool {
  constructor(ctx: ToolContext, callbacks: LayerChannelCallbacks) { ... }

  // Active layer/channel
  setActiveLayer(layerId: string): void;
  getActiveLayer(): string;
  setActiveChannel(channel: ChannelValue): void;
  getActiveChannel(): number;
  setActiveSphereType(type: SphereType): void;
  getActiveSphereType(): SphereType;

  // Visibility
  setLayerVisible(layerId: string, visible: boolean): void;
  isLayerVisible(layerId: string): boolean;
  setChannelVisible(layerId: string, channel: number, visible: boolean): void;
  isChannelVisible(layerId: string, channel: number): boolean;
  getLayerVisibility(): Record<string, boolean>;
  getChannelVisibility(): Record<string, Record<number, boolean>>;
  hasLayerData(layerId: string): boolean;

  // Colors
  setChannelColor(layerId: string, channel: number, color: RGBAColor): void;
  getChannelColor(layerId: string, channel: number): RGBAColor;
  getChannelHexColor(layerId: string, channel: number): string;
  getChannelCssColor(layerId: string, channel: number): string;
  setChannelColors(layerId: string, colorMap: ChannelColorMap): void;
  setAllLayersChannelColor(channel: number, color: RGBAColor): void;
  resetChannelColors(layerId?: string, channel?: number): void;
}
```

### NrrdTools 变更

```typescript
// NrrdTools.ts — 委托到 layerChannelManager
class NrrdTools extends DrawToolCore {
  private layerChannelManager!: LayerChannelManager;

  // 一行委托
  setActiveLayer(layerId: string) { this.layerChannelManager.setActiveLayer(layerId); }
  getActiveLayer() { return this.layerChannelManager.getActiveLayer(); }
  // ... 其余同理
}
```

### Files Changed

| File | Changes | Impact |
|------|---------|--------|
| `tools/LayerChannelManager.ts` | 新建 | +~530 lines |
| `tools/index.ts` | 添加导出 | +1 line |
| `NrrdTools.ts` | 方法体 → 一行委托 | −~500 lines |

### Risk: LOW
纯 getter/setter 提取，公共 API 签名不变。

---

## 5. Phase 2: Extract SliceRenderPipeline (3-5 days)

### Goal
将切片渲染管线 ~300 行提取到 `SliceRenderPipeline` 类。

### Design

```typescript
// tools/SliceRenderPipeline.ts
export interface SliceRenderCallbacks {
  compositeAllLayers(): void;
  refreshSphereOverlay(): void;
  syncGuiParameterSettings(): void;
  filterDrawedImage(axis: string, index: number): void;
  getVolumeForLayer(layer: string): MaskVolume;
  getOrCreateSliceBuffer(axis: string): ImageData | null;
  renderSliceToCanvas(...): void;
}

export class SliceRenderPipeline extends BaseTool {
  constructor(
    ctx: ToolContext,
    private mainPreSlices: any,  // pre-slices reference
    callbacks: SliceRenderCallbacks
  ) { ... }

  // Slice setup
  setDisplaySlicesBaseOnAxis(): void;
  loadDisplaySlicesArray(): void;
  resetDisplaySlicesStatus(): void;
  setupConfigs(): void;
  setMainPreSlice(): void;
  setOriginCanvasAndPre(): void;
  afterLoadSlice(): void;
  updateMaxIndex(): void;

  // Rendering
  reloadMasksFromVolume(): void;
  redrawDisplayCanvas(): void;
  redrawMianPreOnDisplayCanvas(): void;
  flipDisplayImageByAxis(): void;
  setEmptyCanvasSize(axis?: string): void;
  resetLayerCanvas(): void;

  // Wheel
  configMouseSliceWheel(): (e: WheelEvent) => void;
  updateMouseWheelEvent(): void;
}
```

### Files Changed

| File | Changes | Impact |
|------|---------|--------|
| `tools/SliceRenderPipeline.ts` | 新建 | +~350 lines |
| `tools/index.ts` | 添加导出 | +1 line |
| `NrrdTools.ts` | 方法体 → 委托 | −~300 lines |

### Risk: LOW
渲染管线方法之间耦合紧密但对外是自包含的，提取后内部调用关系保持不变。

---

## 6. Phase 3: Extract DataLoader (3-5 days)

### Goal
将数据加载 ~200 行提取到 `DataLoader` 类。

### Design

```typescript
// tools/DataLoader.ts
export interface DataLoaderCallbacks {
  setupConfigs(): void;
  reloadMasksFromVolume(): void;
  compositeAllLayers(): void;
  getVolumeForLayer(layer: string): MaskVolume;
  initMaskVolume(layer: string, dims: number[]): MaskVolume;
}

export class DataLoader extends BaseTool {
  constructor(ctx: ToolContext, callbacks: DataLoaderCallbacks) { ... }

  setAllSlices(allSlices: Array<nrrdSliceType>): void;
  setMasksData(masksData: any, loadingBar?: any): void;
  setMasksFromNIfTI(layerVoxels: Map<string, any>, loadingBar?: any): void;
  setCalculateDistanceSphere(x: number, y: number, sliceIndex: number, cal_position: string): void;
}
```

### Risk: MEDIUM
数据加载涉及 MaskVolume 初始化、protectedData 中的 slice 数组赋值，与初始化流程耦合较紧。需要仔细确定回调边界。

---

## 7. Phase 4: Clean up NrrdTools Facade (1-2 days)

### Goal
NrrdTools 成为纯粹的 Facade：构造器组装模块，公共方法一行委托。

### Expected Result

```typescript
class NrrdTools extends DrawToolCore {
  // Composed modules
  private layerChannelManager!: LayerChannelManager;
  private sliceRenderPipeline!: SliceRenderPipeline;
  private dataLoader!: DataLoader;

  constructor(container: HTMLElement, options?: { layers?: string[] }) {
    super(container, options);
    this.initModules();
    this.init();
  }

  // === Public API (直接方法, 较少) ===
  setMode(mode: ToolMode): void { /* 模式切换逻辑 */ }
  getMode(): ToolMode { /* ... */ }
  executeAction(action: string): void { /* 分发 */ }
  // ... slider/keyboard methods stay here (thin, orchestration)

  // === Delegated to LayerChannelManager ===
  setActiveLayer(id: string) { this.layerChannelManager.setActiveLayer(id); }
  // ...

  // === Delegated to SliceRenderPipeline ===
  redrawDisplayCanvas() { this.sliceRenderPipeline.redrawDisplayCanvas(); }
  // ...

  // === Delegated to DataLoader ===
  setAllSlices(slices: nrrdSliceType[]) { this.dataLoader.setAllSlices(slices); }
  // ...
}
```

### Expected Size Reduction

| 文件 | Before | After | 削减 |
|------|--------|-------|------|
| `NrrdTools.ts` | ~2007 lines (71KB) | ~600-700 lines (~22KB) | **~65%** |
| `LayerChannelManager.ts` | — | ~530 lines | 新 |
| `SliceRenderPipeline.ts` | — | ~350 lines | 新 |
| `DataLoader.ts` | — | ~200 lines | 新 |

### Risk: LOW
仅清理和重组，不改变公共 API。

---

## 8. Out of Scope (Future)

以下问题在本次重构中 **不处理**：

1. **继承链 → 组合**: `NrrdTools → DrawToolCore → CommToolsData` 继承链保留。改为组合是更大的重构，建议后续独立进行
2. **Callback 接口合并**: `*Callbacks` 碎片化问题保留，待本次拆分稳定后统一
3. **双轨类型系统**: `coreTools/coreType.ts` vs `core/types.ts` 合并另行处理
4. **CommToolsData 重命名/拆分**: 依赖继承链重构

---

## 9. Success Criteria

### Each Phase
- [ ] `yarn build` — 零新增 TypeScript 错误
- [ ] 公共 API 签名完全不变 (NrrdTools 所有 public 方法保留)
- [ ] 手动测试: 绘图 (pencil/brush/eraser) 三轴正常
- [ ] 手动测试: Sphere 放置 + Calculator 正常
- [ ] 手动测试: Layer/Channel 切换 + 可见性 + 颜色正常
- [ ] 手动测试: 切片导航 + 对比度调整正常
- [ ] 手动测试: Undo/redo 正常
- [ ] 手动测试: Mask save/load 正常

### Final
- [ ] NrrdTools.ts ≤ 700 行 (从 2007 行)
- [ ] 每个提取模块 ≤ 600 行
- [ ] 无循环依赖

---

## 10. Timeline

```
Week 1:  Phase 1 (LayerChannelManager) + Phase 2 begins (SliceRenderPipeline)
Week 2:  Phase 2 completes + Phase 3 (DataLoader)
Week 3:  Phase 4 (Facade cleanup) + 综合测试
```

Decision gates after each phase — 可在任何阶段暂停。

---

## 11. Risk Management

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| 提取时遗漏 protected 成员依赖 | Medium | Low | 每阶段编译 + grep 验证 |
| 回调接口边界划分不清 | Low | Medium | 先在 NrrdTools 中标记分组，再提取 |
| DataLoader 与渲染管线耦合 | Medium | Medium | Phase 3 可选择跳过或推迟 |
| 性能回退 (额外间接调用) | Low | Low | 一行委托几乎零开销 |

---

**Last Updated:** 2026-03-01
**Owner:** Development Team
