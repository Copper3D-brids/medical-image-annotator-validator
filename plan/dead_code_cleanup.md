# Dead Code Cleanup — segmentation/

## Date: 2026-02-19

## Completed Cleanup

### 1. gui.ts IConfigGUI — 7 dead function properties removed

These functions were passed into `setupGui()` via `IConfigGUI` but **never called** inside `setupGui()`:

| Function | Was defined in | Was wrapped in |
|---|---|---|
| `checkSharedPlaceSlice` | ImageStoreHelper.ts | DrawToolCore.ts |
| `replaceArray` | ImageStoreHelper.ts | DrawToolCore.ts |
| `findSliceInSharedPlace` | ImageStoreHelper.ts | DrawToolCore.ts |
| `sliceArrayH` | ImageStoreHelper.ts | DrawToolCore.ts |
| `sliceArrayV` | ImageStoreHelper.ts | DrawToolCore.ts |
| `replaceVerticalColPixels` | ImageStoreHelper.ts | DrawToolCore.ts |
| `replaceHorizontalRowPixels` | ImageStoreHelper.ts | DrawToolCore.ts |
| `storeImageToAxis` | ImageStoreHelper.ts | DrawToolCore.ts |

**Files modified:**
- `coreTools/gui.ts` — Removed 8 properties from `IConfigGUI` interface
- `DrawToolCore.ts` — Removed 7 wrapper methods + unused `IPaintImage` import
- `NrrdTools.ts` — Removed 8 config entries from `setupGui()` call
- `tools/ImageStoreHelper.ts` — Removed 7 method implementations (~190 lines), updated header comment

### 2. sharedPlace state + getSharedPlace() removed

`nrrd_states.sharedPlace` was only consumed by the dead `checkSharedPlaceSlice` / `findSliceInSharedPlace`. The entire chain was removed:

**Files modified:**
- `coreTools/coreType.ts` — Removed `sharedPlace: ICommXYZ` from `INrrdStates`
- `CommToolsData.ts` — Removed `sharedPlace` initialization
- `NrrdTools.ts` — Removed `sharedPlace` assignment (3 lines) + `getSharedPlace()` private method (~18 lines)

---

## Remaining Dead Code (not yet cleaned)

### Functions/Methods — never called in production

| Item | Location | Notes |
|---|---|---|
| `storeImageToAxis` | ImageStoreHelper.ts:77 | No-op empty body, SphereTool still calls it |
| `hasNonZeroPixels` (private) | ImageStoreHelper.ts | Never called within the class |
| `getState()` | EventRouter.ts:254 | Never called |
| `isShiftHeld()` | EventRouter.ts:258 | Never called |
| `isCtrlHeld()` | EventRouter.ts:262 | Never called |
| `isLeftButtonDown()` | EventRouter.ts:266 | Never called |
| `isRightButtonDown()` | EventRouter.ts:270 | Never called |
| `getKeyboardSettings()` | EventRouter.ts:285 | Never called |
| `BaseTool.setContext()` | BaseTool.ts:38 | Never called |
| `SphereTool.setCallbacks()` | SphereTool.ts:42 | Never called |
| `NrrdTools.paintedImage` | NrrdTools.ts:29 | Declared, never read or written |

### Test-only API (no production usage)

| Item | Location |
|---|---|
| `MaskVolume.setChannelColor()` | MaskVolume.ts:203 |
| `MaskVolume.getChannelColor()` | MaskVolume.ts:220 |
| `MaskVolume.getSliceRawImageData()` | MaskVolume.ts:431 |
| `MaskVolume.getMemoryUsage()` | MaskVolume.ts:803 |
| `MaskVolume.getRawData()` | MaskVolume.ts:824 |
| `MaskVolume.setRawData()` | MaskVolume.ts:844 |
| `MaskVolume.clone()` | MaskVolume.ts:869 |
| `convertIPaintImagesToVolume()` | MigrationUtils.ts:77 |
| `convertVolumeToIPaintImages()` | MigrationUtils.ts:164 |

### gui.ts IConfigGUI — additional unused properties

These are also passed to `setupGui` but never accessed inside the function body:

`filterDrawedImage`, `storeAllImages`, `drawImageOnEmptyImage`, `storeEachLayerImage`, `storeImageToLayer`, `getRestLayer`, `setIsDrawFalse`, `setEmptyCanvasSize`, `resetLayerCanvas`, `redrawDisplayCanvas`, `flipDisplayImageByAxis`, `repraintCurrentContrastSlice`, `setSyncsliceNum`, `resetPaintAreaUIPosition`, `resizePaintArea`
