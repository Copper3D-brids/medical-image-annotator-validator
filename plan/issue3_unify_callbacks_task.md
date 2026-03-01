# Issue 3: 统一 Callback 接口 — Task List

> **Status:** 🔲 TODO
> **Plan:** [issue3_unify_callbacks_plan.md](issue3_unify_callbacks_plan.md)
> **Target:** 10 个 `*Callbacks` 接口 → 1 个 `ToolHost` 接口 + `Pick<>` 缩窄

---

## Phase 1 — 创建 ToolHost 接口

### 1.1 新建 `tools/ToolHost.ts`
- [ ] 定义 `ToolHost` 接口，包含所有 47 个去重后的宿主方法（约 35 个唯一方法）
- [ ] 按语义分组：Canvas/Rendering、Volume、State/Lifecycle、Drawing、Sphere/Crosshair、Data Loading、GUI/Observer
- [ ] 为每个 Tool 定义 `Pick<>` 类型别名：
  - [ ] `ImageStoreHostDeps = Pick<ToolHost, 'setEmptyCanvasSize' | 'drawImageOnEmptyImage'>`
  - [ ] `PanHostDeps = Pick<ToolHost, 'zoomActionAfterDrawSphere'>`
  - [ ] `ContrastHostDeps = Pick<ToolHost, 'setIsDrawFalse' | 'setSyncsliceNum'>`
  - [ ] `ZoomHostDeps = Pick<ToolHost, 'resetPaintAreaUIPosition' | 'resizePaintArea' | 'setIsDrawFalse'>`
  - [ ] `SphereHostDeps = Pick<ToolHost, 'setEmptyCanvasSize' | 'drawImageOnEmptyImage' | 'enableCrosshair' | 'setUpSphereOrigins'>`
  - [ ] `DrawingHostDeps = Pick<ToolHost, 'setCurrentLayer' | 'compositeAllLayers' | 'syncLayerSliceData' | 'filterDrawedImage' | 'getVolumeForLayer' | 'pushUndoDelta' | 'getEraserUrls'>`
  - [ ] `DragSliceHostDeps = Pick<ToolHost, 'setSyncsliceNum' | 'setIsDrawFalse' | 'flipDisplayImageByAxis' | 'setEmptyCanvasSize' | 'getOrCreateSliceBuffer' | 'renderSliceToCanvas' | 'refreshSphereOverlay'>`
  - [ ] `LayerChannelHostDeps = Pick<ToolHost, 'reloadMasksFromVolume' | 'getVolumeForLayer' | 'onChannelColorChanged'>`
  - [ ] `SliceRenderHostDeps = Pick<ToolHost, 'compositeAllLayers' | 'getOrCreateSliceBuffer' | 'renderSliceToCanvas' | 'getVolumeForLayer' | 'refreshSphereOverlay' | 'syncGuiParameterSettings' | 'repraintCurrentContrastSlice' | 'clearUndoHistory' | 'updateShowNumDiv' | 'updateCurrentContrastSlice'>`
  - [ ] `DataLoaderHostDeps = Pick<ToolHost, 'invalidateSliceBuffer' | 'setDisplaySlicesBaseOnAxis' | 'afterLoadSlice' | 'setEmptyCanvasSize' | 'syncLayerSliceData' | 'reloadMasksFromVolume' | 'resetZoom'>`

### 1.2 更新 `tools/index.ts`
- [ ] 导出 `ToolHost` 及所有 `*HostDeps` 类型别名

### 1.3 编译检查
- [ ] `npx tsc --noEmit` — 无新增错误

---

## Phase 2 — 迁移 DrawToolCore 层工具（6 个）

### 2.1 ImageStoreHelper
- [ ] 删除 `ImageStoreCallbacks` 接口
- [ ] 构造函数 `callbacks` 参数类型改为 `ImageStoreHostDeps`
- [ ] DrawToolCore `initTools()` 中传 `this` 替代手动 callback 对象
- [ ] 编译检查

### 2.2 PanTool
- [ ] 删除 `PanCallbacks` 接口
- [ ] 构造函数 `callbacks` 参数类型改为 `PanHostDeps`
- [ ] DrawToolCore `initTools()` 中传 `this` 替代手动 callback 对象
- [ ] 编译检查

### 2.3 ContrastTool
- [ ] 删除 `ContrastCallbacks` 接口
- [ ] 构造函数 `callbacks` 参数类型改为 `ContrastHostDeps`
- [ ] DrawToolCore `initTools()` 中传 `this` 替代手动 callback 对象
- [ ] 编译检查

### 2.4 ZoomTool
- [ ] 删除 `ZoomCallbacks` 接口
- [ ] 构造函数 `callbacks` 参数类型改为 `ZoomHostDeps`
- [ ] DrawToolCore `initTools()` 中传 `this` 替代手动 callback 对象
- [ ] 编译检查

### 2.5 SphereTool
- [ ] 删除 `SphereCallbacks` 接口
- [ ] 构造函数 `callbacks` 参数类型改为 `SphereHostDeps`
- [ ] DrawToolCore `initTools()` 中传 `this` 替代手动 callback 对象
- [ ] 编译检查

### 2.6 DrawingTool
- [ ] 删除 `DrawingCallbacks` 接口
- [ ] 构造函数 `callbacks` 参数类型改为 `DrawingHostDeps`
- [ ] DrawToolCore `initTools()` 中传 `this` 替代手动 callback 对象
- [ ] 编译检查

---

## Phase 3 — 迁移 NrrdTools 层模块（3 个）

### 3.1 LayerChannelManager
- [ ] 删除 `LayerChannelCallbacks` 接口
- [ ] 构造函数 `callbacks` 参数类型改为 `LayerChannelHostDeps`
- [ ] NrrdTools `initNrrdToolsModules()` 中传 `this` 替代手动 callback 对象
- [ ] 编译检查

### 3.2 SliceRenderPipeline
- [ ] 删除 `SliceRenderCallbacks` 接口
- [ ] 构造函数 `callbacks` 参数类型改为 `SliceRenderHostDeps`
- [ ] NrrdTools `initNrrdToolsModules()` 中传 `this` 替代手动 callback 对象
- [ ] 编译检查

### 3.3 DataLoader
- [ ] 删除 `DataLoaderCallbacks` 接口
- [ ] 构造函数 `callbacks` 参数类型改为 `DataLoaderHostDeps`
- [ ] NrrdTools `initNrrdToolsModules()` 中传 `this` 替代手动 callback 对象
- [ ] 编译检查

---

## Phase 4 — 迁移 DragSliceTool

### 4.1 DragSliceTool
- [ ] 删除 `DragSliceCallbacks` 接口
- [ ] 构造函数 `callbacks` 参数类型改为 `DragSliceHostDeps`

### 4.2 DragOperator 调整
- [ ] 更新 DragOperator 将 host 方法转发到 DragSliceTool
- [ ] 编译检查

---

## Phase 5 — 清理 + 验证

### 5.1 引用清理
- [ ] 确认 `grep -rn "interface.*Callbacks" src/ts/Utils/segmentation/tools/` — tools/ 下无残留 `*Callbacks` 接口（`IAnnotationCallbacks` 在 core/types.ts 中，不受影响）
- [ ] 确认所有旧 Callbacks 接口已删除

### 5.2 全量编译
- [ ] `npx tsc --noEmit` — 零错误，零警告新增

### 5.3 运行时验证（用户手动）
- [ ] `npm run dev` — 项目正常启动
- [ ] Pencil 绘制：正常
- [ ] Brush 绘制：正常
- [ ] Eraser 擦除：正常
- [ ] Sphere 放置：正常
- [ ] 右键 Pan：正常
- [ ] Wheel Zoom：正常
- [ ] Contrast 调节：正常
- [ ] Crosshair 点击：正常
- [ ] 切片拖拽：正常
- [ ] Layer/Channel 切换：正常
