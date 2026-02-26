# SphereTool 重写任务

## 概述
重写 `SphereTool.ts`，添加 SphereType/Channel 映射、独立 SphereMaskVolume、文档更新。

| Sphere Type | Layer   | Channel |
|-------------|---------|---------|
| tumour      | layer1  | 1       |
| ribcage     | layer1  | 3       |
| skin        | layer1  | 4       |
| nipple      | layer1  | 5       |

---

## 任务清单

### 1. 分析与准备
- [x] 阅读参考实现 `plan/reference/manager/tools/SphereTool.ts`
- [x] 阅读当前 `SphereTool.ts` 及 `BaseTool.ts`
- [x] 分析 `DrawToolCore.ts` 中 sphere 的使用方式
- [x] 分析 `coreType.ts` 中 `INrrdStates` sphere 相关字段
- [x] 分析 channel/layer 概念
- [x] 确认交互流程（左键按下→滚轮调大小→左键松开→回调）
- [x] 确认 draw 模式互斥（Shift 键在 sphere 模式下被无视）

### 2. 编写实现计划
- [x] 制定 `SphereTool.ts` 重写方案
- [x] 更新计划：添加 SphereMaskVolume、文档更新需求
- [x] 用户审核计划

### 3. 重写 SphereTool.ts
- [x] 添加 `SphereType` 类型和 `SPHERE_CHANNEL_MAP` 常量
- [x] 添加 `SPHERE_COLORS` 常量
- [x] 添加 `getChannelForSphereType()` / `getLayerForSphereType()` / `getColorForSphereType()` 方法
- [x] 重构 `drawSphere` — 使用 sphere type 对应的 channel color
- [x] 重构 `drawCalculatorSphere` — 使用 `SPHERE_COLORS` 替代 `nrrd_states.*Color`
- [x] 重构 `drawCalculatorSphereOnEachViews` — 使用新颜色映射
- [x] 重构 `drawSphereOnEachViews` — 使用 sphere type 对应的颜色
- [x] 添加 MaskVolume 接口预留注释
- [x] 保留 `SphereCallbacks` 接口

### 4. 添加 SphereMaskVolume
- [x] `coreType.ts` — `INrrdStates` 添加 `sphereMaskVolume` 字段
- [x] `CommToolsData.ts` — 初始化 `sphereMaskVolume = null`
- [x] `NrrdTools.ts` — `setAllSlices()` 中创建 `sphereMaskVolume`
- [x] `NrrdTools.ts` — `clear()` 中清空 `sphereMaskVolume`

### 5. 更新导出
- [x] `index.ts` 新增导出 `SphereType`, `SPHERE_CHANNEL_MAP`, `SPHERE_COLORS`

### 6. 更新文档
- [x] `nrrdtools-usage-guide.md` — 添加 SphereTool 使用场景和 callback 说明
- [x] `segmentation-module.md` — 更新 §4.4 和 §7.1，添加 §7.3 SphereTool 说明

### 7. 验证
- [x] TypeScript 编译通过 (`npx tsc --noEmit`)
- [ ] 用户手动测试 sphere 和 calculator sphere 功能
