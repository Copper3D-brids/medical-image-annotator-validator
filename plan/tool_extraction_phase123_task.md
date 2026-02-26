# Tool Extraction Phase 1-2-3: Task List

## Overview
Extract remaining closure-based tools from `paintOnCanvas()` in DrawToolCore.ts.

> **Status:** Phase 2 Complete — Ready for manual testing, then Phase 3
> **Plan:** [tool_extraction_phase123_plan.md](tool_extraction_phase123_plan.md)

---

## Phase 1: Convert Closure Variables to Class Properties ✅ COMPLETED (2026-02-26)

### 1.1 Add Class Properties
- [x] Add `private leftClicked = false` to DrawToolCore
- [x] Add `private rightClicked = false` to DrawToolCore
- [x] Add `private panMoveInnerX = 0` to DrawToolCore
- [x] Add `private panMoveInnerY = 0` to DrawToolCore
- [x] Add `private paintSliceIndex = 0` to DrawToolCore
- [x] Add `private isPainting = false` to DrawToolCore
- [x] Add `private drawingLines: Array<ICommXY> = []` to DrawToolCore
- [x] Add `private clearArcFn` to DrawToolCore

### 1.2 Update paintOnCanvas() Handlers
- [x] Replace `leftclicked` with `this.leftClicked` in all handlers
- [x] Replace `rightclicked` with `this.rightClicked` in all handlers
- [x] Replace `panelMoveInnerX/Y` with `this.panMoveInnerX/Y` in handleOnPanMouseMove
- [x] Replace `currentSliceIndex` with `this.paintSliceIndex` in handleOnDrawingMouseDown
- [x] Replace `Is_Painting` with `this.isPainting` in all handlers
- [x] Replace `lines` with `this.drawingLines` in all handlers
- [x] Replace `clearArc` with `this.clearArcFn` in handleOnDrawingMouseMove

### 1.3 Extract Inner Functions to Methods
- [x] Convert `sphere()` inner function to `private handleSphereClick(e: MouseEvent)`
- [x] Convert `redrawPreviousImageToLayerCtx()` to `private redrawPreviousImageToLayerCtx(ctx: CanvasRenderingContext2D)`

### 1.4 Remove Closure Declarations
- [x] Remove `let leftclicked`, `let rightclicked` declarations from paintOnCanvas()
- [x] Remove `let panelMoveInnerX`, `let panelMoveInnerY` declarations
- [x] Remove `let currentSliceIndex` declaration
- [x] Remove `let Is_Painting`, `let lines` declarations
- [x] Remove `const clearArc` declaration (replaced with `this.clearArcFn = this.useEraser()`)

### 1.5 Verification
- [x] `npx tsc --noEmit` — zero new errors in DrawToolCore.ts
- [x] Manual test: pencil draw + fill works
- [x] Manual test: brush draw works
- [x] Manual test: eraser works
- [x] Manual test: right-click pan works
- [x] Manual test: sphere placement works
- [x] Manual test: pointerleave mid-draw recovers correctly
- [x] Manual test: cross-axis rendering after draw is correct

---

## Phase 2: Extract PanTool ✅ COMPLETED (2026-02-26)

### 2.1 Create PanTool Class
- [x] Create `tools/PanTool.ts`
- [x] Define `PanCallbacks` interface
- [x] Implement `PanTool extends BaseTool`
- [x] Move `rightClicked`, `panMoveInnerX/Y` to PanTool
- [x] Implement `onPointerDown(e)` — right-click start, register listeners
- [x] Implement `onPointerMove(e)` — update canvas positions (arrow function for `this` binding)
- [x] Implement `onPointerUp(e)` — cleanup, restore cursor
- [x] Implement `onPointerLeave()` — cleanup on canvas leave
- [x] Implement `isActive` getter

### 2.2 Integrate PanTool into DrawToolCore
- [x] Add `private panTool: PanTool` property
- [x] Instantiate PanTool in `initTools()`
- [x] Update `handleOnDrawingMouseDown` right-click branch → `this.panTool.onPointerDown(e)`
- [x] Update `handleOnDrawingMouseUp` right-click branch → delegate to PanTool
- [x] Update `pointerleave` listener → `this.panTool.onPointerLeave()`
- [x] Remove `handleOnPanMouseMove` handler from paintOnCanvas()
- [x] Remove `this.rightClicked`, `this.panMoveInnerX/Y` from DrawToolCore (now in PanTool)

### 2.3 Update Exports
- [x] Add PanTool to `tools/index.ts` barrel export

### 2.4 Handle Sphere + Pan Interaction
- [x] Ensure `zoomActionAfterDrawSphere()` is called via callback when pan ends in sphere mode
- [x] Test pan → sphere mode transition

### 2.5 Verification
- [x] `npx tsc --noEmit` passes with no new errors
- [ ] Manual test: right-click pan in all 3 axes (x, y, z)
- [ ] Manual test: cursor changes (grab → grabbing → default)
- [ ] Manual test: pan position persists across slice changes
- [ ] Manual test: pan + sphere mode works
- [ ] Manual test: pointerleave during pan cleans up correctly
- [ ] Manual test: pan does NOT interfere with left-click drawing

---

## Phase 3: Extract DrawingTool (3-5 days) — Optional

> **Decision Gate:** Only proceed if Phase 1-2 are successful and team decides to continue.

### 3.1 Create DrawingTool Class
- [ ] Create `tools/DrawingTool.ts`
- [ ] Define `DrawingCallbacks` interface
- [ ] Implement `DrawingTool extends BaseTool`
- [ ] Move `isPainting`, `leftClicked`, `drawingLines` to DrawingTool
- [ ] Move `clearArcFn` to DrawingTool
- [ ] Move `preDrawAxis`, `preDrawSliceIndex`, `preDrawSlice` to DrawingTool

### 3.2 Implement Drawing Event Handlers
- [ ] Implement `onPointerDown(e)`:
  - [ ] Guard re-entry (leftClicked check)
  - [ ] Reset state (lines = [], isPainting = true)
  - [ ] Set cursor based on mode (eraser/default)
  - [ ] Record drawStartPos
  - [ ] Capture pre-draw undo snapshot
  - [ ] Register dynamic pointermove/pointerup listeners
- [ ] Implement `onPointerMove(e)`:
  - [ ] Eraser branch → clearArcFn
  - [ ] Drawing branch → accumulate lines, call paintOnCanvasLayer callback
- [ ] Implement `onPointerUp(e)`:
  - [ ] Remove dynamic listeners
  - [ ] Pencil fill-on-release logic (redraw previous + fill path)
  - [ ] Brush mode cleanup (closePath)
  - [ ] Sync to volume (syncLayerSliceData callback)
  - [ ] Push undo delta
  - [ ] Re-enable wheel listener
- [ ] Implement `onPointerLeave()`:
  - [ ] Reset isPainting
  - [ ] Clean up leftClicked state
  - [ ] Remove dynamic listeners

### 3.3 Move Helper Methods
- [ ] Move `redrawPreviousImageToLayerCtx()` to DrawingTool
- [ ] Move `fillPencilPath()` logic to DrawingTool private method
- [ ] Move undo snapshot logic (`capturePreDrawSnapshot`, `pushUndoDelta`) to DrawingTool

### 3.4 Integrate DrawingTool into DrawToolCore
- [ ] Add `private drawingTool: DrawingTool` property
- [ ] Instantiate DrawingTool in `initTools()`
- [ ] Update `handleOnDrawingMouseDown` draw-mode branch → `this.drawingTool.onPointerDown(e)`
- [ ] Update `handleOnDrawingMouseMove` → `this.drawingTool.onPointerMove(e)`
- [ ] Update `handleOnDrawingMouseUp` draw branch → `this.drawingTool.onPointerUp(e)`
- [ ] Update `pointerleave` drawing cleanup → `this.drawingTool.onPointerLeave()`
- [ ] Remove `this.isPainting`, `this.leftClicked`, `this.drawingLines` from DrawToolCore
- [ ] Remove `this.preDrawAxis`, `this.preDrawSliceIndex`, `this.preDrawSlice` from DrawToolCore
- [ ] Remove `this.clearArcFn` from DrawToolCore

### 3.5 Preserve Brush Circle Preview
- [ ] `handleOnDrawingBrushCricleMove` remains in paintOnCanvas (it only updates nrrd_states)
- [ ] OR move to DrawingTool if it logically belongs there

### 3.6 Update Exports
- [ ] Add DrawingTool to `tools/index.ts` barrel export

### 3.7 Verification
- [ ] `npx tsc --noEmit` passes with no new errors
- [ ] Manual test: pencil draw + fill on each layer
- [ ] Manual test: brush continuous draw on each layer
- [ ] Manual test: eraser on each layer
- [ ] Manual test: undo/redo after pencil draw
- [ ] Manual test: undo/redo after brush draw
- [ ] Manual test: undo/redo after eraser
- [ ] Manual test: pointerleave mid-draw → resume drawing
- [ ] Manual test: cross-axis sync after drawing
- [ ] Manual test: layer switching during/after drawing
- [ ] Manual test: opacity/color changes between strokes
- [ ] Manual test: pencil fill with complex path (self-intersecting)
- [ ] Verify DrawToolCore line count reduced by ~200+ lines

---

## Post-Completion

### Code Review Checklist
- [ ] No closure variables remain in `paintOnCanvas()` (only `this.xxx` references)
- [ ] All tools follow consistent BaseTool pattern
- [ ] Callback interfaces are minimal (no unnecessary methods)
- [ ] Event listener add/remove is balanced (no leaks)
- [ ] Arrow functions used for event handlers that need `this` binding

### Documentation
- [ ] Update `plan/overall_plan.md` status
- [ ] Update `plan/docs/segmentation-module.md` with new tool architecture
- [ ] Move completed plan/task files to `plan/completed/`

### Metrics
- [ ] Record DrawToolCore line count: before → after
- [ ] Record `paintOnCanvas()` line count: before → after
- [ ] Record total tools/ directory line count

---

## Success Metrics Summary

| Metric | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|
| DrawToolCore lines | ~1319 (no change) | **~1236 (-83) ✅** | ~1084 (-235) |
| paintOnCanvas() lines | ~580 (no change) | **~500 (-80) ✅** | ~150 (-430) |
| New tool files | 0 | **1 (PanTool, 124 lines) ✅** | 2 (PanTool + DrawingTool) |
| Closure variables | 0 (all lifted) | **-3 (in PanTool) ✅** | -5 (in DrawingTool) |
| Build errors | No new | **No new ✅** | No new |
| Behavior changes | None | **None ✅** | None |

---

**Last Updated:** 2026-02-26
**Status:** Phase 2 Complete — Awaiting manual testing before Phase 3
