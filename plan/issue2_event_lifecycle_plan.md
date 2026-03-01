# Issue 2: DrawToolCore Event Lifecycle Refactor — Plan

> **Status:** Planning
> **Priority:** MEDIUM
> **Source:** segmentation_architecture_review.md — Issue 2
> **Scope:** `DrawToolCore.ts` (paintOnCanvas) + `EventRouter.ts`

---

## Problem Statement

`paintOnCanvas()` 在回调闭包内部手动 add/remove DOM 事件监听器，形成散乱的"配对"关系：

| 位置 | 手动操作 | 风险 |
|------|---------|------|
| `handleOnDrawingMouseDown` L357-413 | 手动 add `pointerup` × 3处, add `pointermove` | 重复 add，取决于分支覆盖 |
| `handleOnDrawingMouseUp` L429-494 | 手动 remove `pointermove`，add/remove `wheel` × 多处 | 多 if/else 分支，遗漏 cleanup 风险 |
| `pointerleave` L496-518 | 直接 add 到 canvas（绕过 EventRouter），remove `pointermove` + sphere wheel | 与 EventRouter 并行，潜在双发 |
| `handleSphereClick` L583-602 | remove zoom wheel, add sphere wheel, add `pointerup` | 与 mouseUp 中的 cleanup 配对不直观 |
| `zoomActionAfterDrawSphere` L293-298 | add zoom wheel 回来 | 依赖 SphereTool 回调调用时机 |

**根本矛盾：** EventRouter 在 `bindAll()` 时已永久注册了 `pointermove / pointerup / pointerleave / wheel`，但 DrawToolCore 从未调用 `setPointerMoveHandler` / `setPointerUpHandler` / `setPointerLeaveHandler` / `setWheelHandler`。导致：
- pointermove / pointerup 被手动 add/remove，完全绕开 EventRouter
- 双重注册风险（EventRouter + 手动）
- wheel 在多个分支被反复 add/remove，配对逻辑难以追踪

---

## Solution Design

### 核心思路

1. **将所有 handler 注册到 EventRouter**（在 `initDrawToolCore()` 中一次性完成）
2. **引入 `activeWheelMode` 派发模式**替代 wheel 的反复 add/remove
3. **从 `paintOnCanvas()` 中移除所有手动 addEventListener/removeEventListener**
4. **删除 Legacy Fallback**（L421-427，不通过 EventRouter 的旧路径）

### 方案：Wheel 派发器

```typescript
// DrawToolCore 新增私有字段
private activeWheelMode: 'zoom' | 'sphere' | 'none' = 'zoom';

// initDrawToolCore 中注册
this.eventRouter.setWheelHandler((e: WheelEvent) => {
  if (this.activeWheelMode === 'zoom') {
    this.drawingPrameters.handleMouseZoomSliceWheel(e);
  } else if (this.activeWheelMode === 'sphere') {
    this.drawingPrameters.handleSphereWheel(e);
  }
  // 'none' = 绘制中，抑制 wheel
});
```

原先的 wheel add/remove 调用点替换为：
- `this.activeWheelMode = 'none'` （开始绘制时）
- `this.activeWheelMode = 'zoom'` （结束绘制时）
- `this.activeWheelMode = 'sphere'` （sphere click 时）

### 方案：pointermove / pointerup 去重

EventRouter 永久路由这两个事件。在 `initDrawToolCore()` 中注册一次：

```typescript
this.eventRouter.setPointerMoveHandler((e: PointerEvent) => {
  this.drawingPrameters.handleOnDrawingMouseMove(e);
});
this.eventRouter.setPointerUpHandler((e: PointerEvent) => {
  this.drawingPrameters.handleOnDrawingMouseUp(e);
});
```

`handleOnDrawingMouseMove` / `handleOnDrawingMouseUp` 内部已有状态守卫（`drawingTool.isActive`、`panTool.isActive` 等），永久路由不影响行为。

### 方案：pointerleave 移入 EventRouter

当前 pointerleave 是直接 add 到 canvas 的闭包（L496-518），与 EventRouter 的 `boundPointerLeave` 并行触发。
将其提取为 `initDrawToolCore()` 中的 `setPointerLeaveHandler` 调用。

---

## Files to Modify

| 文件 | 改动 |
|------|------|
| `DrawToolCore.ts` | 新增 `activeWheelMode`；`initDrawToolCore()` 注册全部 handler；`paintOnCanvas()` 删除所有手动 add/remove；删除 Legacy Fallback |
| `EventRouter.ts` | 无结构改动。确认 `boundWheel` 注册为 `{ passive: false }`（已是）|

> **不改动任何 tool 文件**（这是 Issue 3 的范围）

---

## Phase Breakdown

### Phase 1 — 注册 pointerMove / pointerUp / pointerLeave handler

**目标：** 在 `initDrawToolCore()` 末尾（`bindAll()` 调用之前）注册这三个 handler。

**改动点：**
- `initDrawToolCore()` 末尾（约 L246 `this.eventRouter.bindAll()` 之前）添加：
  ```typescript
  this.eventRouter.setPointerMoveHandler((e: PointerEvent) => {
    this.drawingPrameters.handleOnDrawingMouseMove(e);
  });
  this.eventRouter.setPointerUpHandler((e: PointerEvent) => {
    this.drawingPrameters.handleOnDrawingMouseUp(e);
  });
  this.eventRouter.setPointerLeaveHandler((e: PointerEvent) => {
    // 从 paintOnCanvas 中提取的 pointerleave 逻辑（见 Phase 3）
    this.handlePointerLeave();
  });
  ```
- 在 DrawToolCore 中新增 `private handlePointerLeave()` 方法，内容从 `paintOnCanvas()` L496-518 中提取。

**注意：** 此阶段 `paintOnCanvas()` 中的旧 pointerleave 直接 add 尚未删除 → 暂时双注册，Phase 3 再清理。

---

### Phase 2 — 引入 Wheel 派发器

**目标：** 用 `activeWheelMode` 替代所有手动 wheel add/remove。

**改动点：**

1. **新增字段**（DrawToolCore 类顶部）：
   ```typescript
   private activeWheelMode: 'zoom' | 'sphere' | 'none' = 'zoom';
   ```

2. **在 `initDrawToolCore()` 注册 wheel handler**（与 Phase 1 同位置）：
   ```typescript
   this.eventRouter.setWheelHandler((e: WheelEvent) => {
     if (this.activeWheelMode === 'zoom') {
       this.drawingPrameters.handleMouseZoomSliceWheel(e);
     } else if (this.activeWheelMode === 'sphere') {
       this.drawingPrameters.handleSphereWheel(e);
     }
   });
   ```

3. **`zoomActionAfterDrawSphere()`** (L293-298)：
   - 将 `canvas.addEventListener("wheel", ...)` 替换为 `this.activeWheelMode = 'zoom'`
   - 删除该方法的 DOM 操作，只保留状态设置

---

### Phase 3 — 清理 paintOnCanvas() 中的手动 add/remove

**目标：** 删除 `paintOnCanvas()` 内所有手动 addEventListener/removeEventListener，替换为 `activeWheelMode` 状态变更。

**具体删除 / 替换清单：**

**L324-343（初始 wheel 注册）：**
- 删除 `canvas.removeEventListener("wheel", handleMouseZoomSliceWheel)`（L325-328）
- 保留 `handleMouseZoomSliceWheel` 的赋值逻辑（L330-334，赋值给 `drawingPrameters` 字段）
- 删除 `canvas.addEventListener("wheel", ..., { passive: false })`（L337-343）
- 添加：`this.eventRouter.setWheelHandler(...)` 在此处更新 handler 引用，或在 `paintOnCanvas()` 开头更新 `drawingPrameters.handleMouseZoomSliceWheel`（保持已有模式）

**handleOnDrawingMouseDown（L357-413）内：**
- 删除 L380-387：手动 add `pointerup` + `pointermove`（draw 模式分支）
- 删除 L395-399：手动 add `pointerup`（crosshair 分支）
- 删除 L406-409：手动 add `pointerup`（右键 pan 分支）
- 替换 L372-375（remove zoom wheel）为 `this.activeWheelMode = 'none'`

**handleOnDrawingMouseUp（L429-494）内：**
- 删除 L435-438：手动 remove `pointermove`
- 替换 L441-447（add zoom wheel）为 `this.activeWheelMode = 'zoom'`
- 删除 L456-469 中的：remove sphere wheel、add zoom wheel、remove `pointerup`
- 添加替换：`this.activeWheelMode = 'zoom'`（sphere 结束时）
- 删除 L475-483 中的：add zoom wheel、remove `pointerup`
- 添加替换：`this.activeWheelMode = 'zoom'`

**pointerleave 直接 add（L496-518）：**
- 删除整个 `canvas.addEventListener("pointerleave", () => { ... })` 块
- 内容已提取到 `handlePointerLeave()` 方法（Phase 1）

**handleSphereClick（L583-602）内：**
- 替换 L584-587（remove zoom wheel）为 `this.activeWheelMode = 'sphere'`
- 删除 L593-601：手动 add sphere wheel + add `pointerup`（pointerup 已由 EventRouter 永久路由）

---

### Phase 4 — 删除 Legacy Fallback

**目标：** 删除 `paintOnCanvas()` L416-427 中的 `else` 分支（当 `eventRouter` 为 null 时的旧 pointerdown 注册路径）。

```typescript
// 删除：
} else {
  // Fallback for legacy mode without EventRouter
  this.protectedData.canvases.drawingCanvas.addEventListener(
    "pointerdown",
    this.drawingPrameters.handleOnDrawingMouseDown,
    true
  );
}
```

EventRouter 在构造函数中必须存在（`initDrawToolCore()` 中初始化）。
同时将 `if (this.eventRouter)` 守卫去掉，改为直接调用。

---

### Phase 5 — 验证

#### 编译验证
- `npx tsc --noEmit` — 零新增错误

#### 行为验证清单

| 场景 | 预期行为 |
|------|---------|
| Pencil / Brush / Eraser 绘制 | 正常绘制，pointerUp 结束 |
| 绘制中 wheel | 不触发 zoom 或 slice scroll |
| 绘制结束后 wheel | 触发 zoom 或 slice scroll（取决于 mouseWheel 设置）|
| 右键 Pan | 正常拖拽，pointerUp 结束 |
| Crosshair 点击 | 十字准线更新，不触发绘制 |
| Sphere 点击 | sphere wheel 激活，zoom wheel 抑制 |
| Sphere mouseUp | zoom wheel 恢复，sphere wheel 停止 |
| Pointer 离开 canvas | 绘制中断，cursor 恢复 |
| 快速连续点击 | 无重复 pointerup 触发，无 pointermove 残留 |
| Ctrl+Z / Ctrl+Y | Undo / Redo 正常 |

#### 内存泄漏验证
- Chrome DevTools → Performance → Event Listeners 面板
- 确认 `pointermove` / `pointerup` 监听器数量在交互前后保持恒定（各 1 个，来自 EventRouter）
- 确认 `wheel` 监听器数量恒定（1 个，来自 EventRouter）

---

## Non-Goals（本次不做）

- 不修改任何 tool 文件（DrawingTool, SphereTool, PanTool...）
- 不重构 callback interface（Issue 3 范围）
- 不修改 EventRouter 的状态机逻辑
- 不改变 `drawingPrameters` 字段的现有结构（保持兼容性）

---

## Risk Assessment

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| `drawingPrameters.handleMouseZoomSliceWheel` 在 `paintOnCanvas` 重新赋值后未同步到 EventRouter wheel handler | 中 | 中（wheel 行为错误）| Phase 3 中在赋值后更新 EventRouter wheel handler 引用 |
| 删除手动 add pointerup 后，某 edge case 下 pointerup 未触达 handler | 低 | 高（绘制无法结束）| Phase 5 快速连续点击测试 |
| pointerleave 双注册过渡期（Phase 1 完成，Phase 3 未完成）| 高（过渡期内）| 低（handler 重复执行但幂等）| 两个 Phase 在同一 PR/commit 完成 |
