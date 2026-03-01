# Segmentation Module Architecture Review

> Review Date: 2026-03-01
> Score: **72 / 100**

## Module Structure

```
segmentation/
├── CommToolsData.ts           (19.8 KB) - Base state management container
├── DrawToolCore.ts            (34.4 KB) - Drawing system orchestrator
├── DragOperator.ts            (9.3 KB)  - Slice navigation via drag
├── NrrdTools.ts               (71.4 KB) - Main public API entry point
├── core/                      (48.2 KB total)
│   ├── index.ts               - Public API barrel export
│   ├── MaskVolume.ts          (42.9 KB) - 3D volumetric mask storage
│   ├── UndoManager.ts         (3.2 KB)  - Per-layer undo/redo
│   ├── types.ts               (5.8 KB)  - Shared type definitions
│   └── __tests__/             - Unit tests & benchmarks
├── coreTools/                 (33.2 KB total)
│   ├── coreType.ts            (12.2 KB) - Legacy monolithic type definitions
│   ├── gui.ts                 (14.4 KB) - dat.GUI configuration
│   ├── GuiState.ts            (1.9 KB)  - GUI state container (Phase 4+)
│   ├── NrrdState.ts           (3.0 KB)  - NRRD state container (Phase 4+)
│   └── divControlTools.ts     (1.8 KB)  - DOM manipulation utilities
├── eventRouter/               (18.0 KB total)
│   ├── EventRouter.ts         (15.1 KB) - Centralized event router
│   ├── types.ts               (2.5 KB)  - Event type definitions
│   └── index.ts               - Barrel export
└── tools/                     (112 KB total)
    ├── BaseTool.ts            (1.2 KB)  - Abstract base class
    ├── DrawingTool.ts         (12.7 KB) - Pencil/brush/eraser drawing
    ├── EraserTool.ts          (3.9 KB)  - Channel-aware circular eraser
    ├── PanTool.ts             (3.9 KB)  - Right-click pan navigation
    ├── ZoomTool.ts            (2.8 KB)  - Mouse wheel zoom
    ├── SphereTool.ts          (29.2 KB) - Sphere placement & calculator
    ├── CrosshairTool.ts       (8.1 KB)  - Crosshair positioning
    ├── ContrastTool.ts        (5.9 KB)  - Window/level adjustment
    ├── DragSliceTool.ts       (8.5 KB)  - Drag-based slice navigation
    ├── ImageStoreHelper.ts    (5.8 KB)  - Volume data storage helpers
    └── index.ts               - Barrel export
```

**Total: 30 TypeScript files, ~359 KB of code**

---

## Class Hierarchy

```
BaseTool (Abstract)
├── EraserTool
├── DrawingTool
├── PanTool
├── ZoomTool
├── SphereTool
├── CrosshairTool
├── ContrastTool
├── DragSliceTool
└── ImageStoreHelper

Orchestration:
CommToolsData (Base state container)
  └── DrawToolCore extends CommToolsData
        └── NrrdTools extends DrawToolCore (Main public API)

Standalone:
├── MaskVolume (3D volumetric mask storage)
├── UndoManager (Per-layer undo/redo)
├── EventRouter (Centralized event routing)
├── DragOperator (Slice navigation orchestrator)
├── GuiState (GUI state container)
└── NrrdState (NRRD state container)
```

---

## Strengths

### 1. Tool Decoupling (+15)
9 tools are fully independent, inherit from `BaseTool`, injected with `ToolContext`. Zero inter-tool coupling. This is the biggest win.

### 2. No Circular Dependencies (+10)
Dependency direction is strictly unidirectional: `Types -> Core -> Tools -> DrawToolCore -> NrrdTools`. Very clean.

### 3. MaskVolume Design (+12)
Contiguous `Uint8Array` storage, memory reduced from 4.4GB to 25MB. Multi-channel rendering support. Complete unit tests and benchmarks. Highest engineering quality module.

### 4. EventRouter Centralized Event Management (+8)
Mutually exclusive modes, keyboard state tracking, unified event bind/unbind. Solved the previous scattered event listener problem.

### 5. Layered State Management (+7)
`GuiState` / `NrrdState` split flat interfaces into semantic sub-groups (mode, drawing, view, etc.). Good readability.

---

## Issues & Optimization Opportunities

### Issue 1: NrrdTools.ts is still a God Class (71KB) — Priority: HIGH

**Problem**: NrrdTools.ts handles too many responsibilities: public API entry, slice rendering, canvas pipeline, layer compositing, sphere mode switching, etc.

**Suggested Refactor**:
```
NrrdTools (71KB) ->
  ├── NrrdTools.ts (~20KB, pure public API facade)
  ├── SliceRenderer.ts (~15KB, slice rendering pipeline)
  ├── LayerCompositor.ts (~10KB, layer compositing)
  └── SphereOrchestrator.ts (~10KB, sphere mode orchestration)
```

### Issue 2: DrawToolCore mixes orchestration with event glue code — Priority: MEDIUM

**Problem**: `paintOnCanvas()` (L300-580) delegates logic to tools, but event listener add/remove is scattered across callback closures (add in mouseDown, remove in mouseUp, also remove in pointerLeave). Easy to miss pairings.

**Suggestion**: Let `EventRouter` fully take over event lifecycle management.

### Issue 3: Callback interfaces are too fragmented — Priority: MEDIUM

**Problem**: Each tool defines its own `*Callbacks` interface (`DrawingCallbacks`, `SphereCallbacks`, `PanCallbacks`...). DrawToolCore manually assembles 8 callback groups in `initTools()`. Most callbacks are one-line forwards to DrawToolCore/CommToolsData methods.

**Suggestion**: Consider a unified `Host` interface that tools can reference directly.

### Issue 4: Dual type systems coexist — Priority: MEDIUM

**Problem**: Two type definition modules coexist:
- `coreTools/coreType.ts` — Old flat interfaces (12KB)
- `core/types.ts` — New volumetric rendering types (6KB)

New code is unsure which to import.

**Suggestion**: Unify into `core/types.ts`.

### Issue 5: CommToolsData unclear responsibilities — Priority: LOW

**Problem**: It is both a "state holder" and contains canvas utility methods (`setEmptyCanvasSize`, `flipDisplayImageByAxis`, `renderSliceToCanvas`, etc.). The name "CommToolsData" does not reflect its actual scope.

**Suggestion**: Rename and split into a pure state container + rendering utility class.

### Issue 6: Three-level inheritance chain — Priority: LOW

**Problem**: `NrrdTools -> DrawToolCore -> CommToolsData` — three levels of inheritance makes method tracing require cross-file jumping. `protected` members are implicitly shared between subclasses. Hard for new developers to locate where a method is defined.

**Suggestion**: Favor composition over inheritance for clearer ownership.

---

## Score Breakdown

| Dimension       | Score | Notes                                    |
|-----------------|-------|------------------------------------------|
| Modularity      | 8/10  | Tool layer excellent, orchestration too large |
| Dependencies    | 9/10  | No cycles, clear direction               |
| Maintainability | 6/10  | NrrdTools 71KB is the biggest pain point  |
| Type Safety     | 6/10  | Dual type systems + scattered `as any`   |
| Testability     | 7/10  | Core has tests, tool layer lacks tests   |
| Naming          | 7/10  | Some names not intuitive (CommToolsData) |

---

## Recommended Action Priority

1. **Split NrrdTools.ts** — Highest impact, reduces risk for any future modification
2. **Unify type definitions** — Reduces confusion, quick win
3. **Consolidate event lifecycle in EventRouter** — Eliminates event leak risks
4. **Merge callback interfaces** — Simplifies tool initialization
5. **Refactor inheritance to composition** — Long-term structural improvement
