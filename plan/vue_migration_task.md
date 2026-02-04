# Vue Components Migration - Task Checklist

**开始日期**: 2026-02-04
**当前状态**: Step 1 已完成，待用户验证

---

## Legend

- `[ ]` 未开始
- `[/]` 进行中
- `[x]` 已完成
- `[!]` 待验证 (已完成代码，等待测试确认)
- `[✓]` 已验证 (完成且测试通过)
- `⚠️` 有风险
- `🔒` 阻塞中 (依赖其他任务)
- `📖` 需要文档

---

## Phase 1: 基础设施 (Step 1-3)

### Step 1: 创建 SegmentationManager 实例

**状态**: `[!]` 待验证
**责任人**: AI Assistant
**完成日期**: 2026-02-04

#### 文件修改清单

- [x] `@/ts/index.ts` - 添加 SegmentationManager 和 StateManager 统一导出
  - [x] 导入 segmentation 模块
  - [x] 添加到 export 列表
  - [x] 添加类型导出

- [x] `@/models/ui.ts` - 更新接口定义
  - [x] 修改导入为 `@/ts/index`
  - [x] ILeftCoreCopperInit 添加 segmentationManager 字段

- [x] `LeftPanelCore.vue` - 创建 SegmentationManager 实例
  - [x] 修改导入为 `@/ts/index`
  - [x] 声明 segmentationManager 变量
  - [x] initCopper() 中创建实例
  - [x] emit 中传递 segmentationManager
  - [x] 添加日志 `[Phase 7 - Step 1] SegmentationManager created`

- [x] `LeftPanelController.vue` - 接收 SegmentationManager
  - [x] 声明 segmentationManager ref
  - [x] onFinishedCopperInit 中接收实例
  - [x] 添加日志 `[Phase 7 - Step 1] SegmentationManager received in Controller`

#### 验证清单

- [ ] **用户验证**: 运行应用，检查浏览器控制台
- [ ] 应该看到日志: `[Phase 7 - Step 1] SegmentationManager created`
- [ ] 应该看到日志: `[Phase 7 - Step 1] SegmentationManager received in Controller`
- [ ] 没有 TypeScript 错误
- [ ] 没有运行时错误
- [ ] 应用功能正常（图像加载、绘制等）

#### 回滚方案

如果验证失败，恢复文件：
```bash
git checkout HEAD -- \
  annotator-frontend/src/ts/index.ts \
  annotator-frontend/src/models/ui.ts \
  annotator-frontend/src/components/viewer/LeftPanelCore.vue \
  annotator-frontend/src/views/LeftPanelController.vue
```

---

### Step 2: 配置 RenderingAdapter

**状态**: `[ ]` 未开始
**前置条件**: Step 1 验证通过
**预计工作量**: 1-2 小时

#### 文件修改清单

- [ ] `LeftPanelCore.vue` - initCopper() 配置 RenderingAdapter
  - [ ] 查看 NrrdTools 源码，找到 canvas 访问方法
  - [ ] 实现 getMaskDisplayContext()
  - [ ] 实现 getDrawingContext()
  - [ ] 实现 getDrawingCanvas()
  - [ ] 实现 requestRender()
  - [ ] 调用 segmentationManager.setRenderingAdapter()
  - [ ] 添加日志 `[Phase 7 - Step 2] RenderingAdapter configured`

#### 研究任务

- [ ] 📖 阅读 NrrdTools 源码，确认以下方法是否存在：
  - [ ] getMaskDisplayCanvas() 或类似方法
  - [ ] getDrawingCanvas() 或类似方法
  - [ ] render() 或类似方法
  - [ ] 如果不存在，找到替代方案

#### 验证清单

- [ ] 控制台看到: `[Phase 7 - Step 2] RenderingAdapter configured`
- [ ] 验证 adapter 方法返回正确值:
  ```typescript
  const ctx = segmentationManager.value.getRenderingAdapter().getMaskDisplayContext();
  console.log('Context:', ctx);  // 应该是 CanvasRenderingContext2D
  ```
- [ ] 没有错误

#### 风险评估

⚠️ **中等风险**: NrrdTools 可能没有公开这些 canvas 的访问方法

---

### Step 3: 配置 DimensionAdapter 和初始化

**状态**: `[ ]` 未开始
**前置条件**: Step 2 完成
**预计工作量**: 2-3 小时
**依赖**: `🔒` 需要图像加载完成后才能初始化

#### 文件修改清单

- [ ] `LeftPanelController.vue` - handleAllImagesLoaded()
  - [ ] 从 NrrdTools 获取 states
  - [ ] 配置 DimensionAdapter
    - [ ] getDimensions()
    - [ ] getVoxelSpacing()
    - [ ] getSpaceOrigin()
    - [ ] getCurrentSliceIndex()
    - [ ] getCurrentAxis()
    - [ ] getSizeFactor()
    - [ ] getGlobalAlpha()
  - [ ] 调用 segmentationManager.initialize()
  - [ ] 添加日志 `[Phase 7 - Step 3] SegmentationManager initialized`

#### 验证清单

- [ ] 加载病例后，控制台看到初始化日志
- [ ] 验证初始化成功:
  ```typescript
  console.log('Initialized:', segmentationManager.value.isInitialized());  // true
  console.log('Dimensions:', segmentationManager.value.getDimensions());
  ```
- [ ] 验证 dimensions 正确
- [ ] 没有错误

---

## Phase 2: 数据层迁移 (Step 4-5)

### Step 4: 迁移 useMaskOperations

**状态**: `[ ]` 未开始
**前置条件**: Step 3 完成
**预计工作量**: 3-4 小时

#### 文件修改清单

- [ ] `composables/left-panel/useMaskOperations.ts`
  - [ ] 添加 segmentationManager 参数到 composable
  - [ ] 修改 getMaskData() 使用 segmentationManager
  - [ ] 修改 setMaskData() 使用 segmentationManager
  - [ ] 更新数据格式转换逻辑
  - [ ] 保留旧的 nrrdTools 调用（备用）

- [ ] `LeftPanelController.vue`
  - [ ] 传递 segmentationManager 到 useMaskOperations

#### API 对比

| 操作 | 旧 API | 新 API |
|------|--------|--------|
| 获取掩码 | `nrrdTools.getMaskData()` | `segmentationManager.getMaskData()` |
| 设置掩码 | `nrrdTools.setMasksData(data)` | `segmentationManager.setMasksData(data)` |

#### 数据格式转换

旧格式:
```typescript
{
  paintImagesLabel1: { z: [...] },
  paintImagesLabel2: { z: [...] },
  paintImagesLabel3: { z: [...] }
}
```

新格式:
```typescript
{
  layer1: [...],
  layer2: [...],
  layer3: [...]
}
```

#### 验证清单

- [ ] 保存掩码功能正常
- [ ] 加载掩码功能正常
- [ ] 数据格式转换正确
- [ ] 与后端 API 兼容
- [ ] 没有数据丢失

#### 风险评估

⚠️ **高风险**: 数据格式变化可能导致与后端不兼容

---

### Step 5: 迁移 useDistanceCalculation

**状态**: `[ ]` 未开始
**前置条件**: Step 4 完成
**预计工作量**: 2-3 小时

#### 文件修改清单

- [ ] `composables/left-panel/useDistanceCalculation.ts`
  - [ ] 添加 segmentationManager 参数
  - [ ] 更新 sphere 相关功能
  - [ ] 保留旧代码（备用）

- [ ] `LeftPanelController.vue`
  - [ ] 传递 segmentationManager 到 useDistanceCalculation

#### 验证清单

- [ ] Sphere 工具正常
- [ ] 距离计算正确
- [ ] 没有错误

---

## Phase 3: 交互层迁移 (Step 6-7)

### Step 6: 迁移 useSliceNavigation

**状态**: `[ ]` 未开始
**前置条件**: Step 5 完成
**预计工作量**: 2-3 小时

#### 文件修改清单

- [ ] `composables/left-panel/useSliceNavigation.ts`
  - [ ] TBD

#### 验证清单

- [ ] 切片导航正常
- [ ] 轴向切换正常

---

### Step 7: 注册工具到 SegmentationManager

**状态**: `[ ]` 未开始
**前置条件**: Step 6 完成
**预计工作量**: 3-4 小时

#### 工具注册清单

- [ ] PencilTool
- [ ] BrushTool
- [ ] EraserTool
- [ ] PanTool
- [ ] ZoomTool
- [ ] ContrastTool
- [ ] SphereTool
- [ ] CrosshairTool

#### 文件修改清单

- [ ] `LeftPanelCore.vue` 或 `LeftPanelController.vue`
  - [ ] 创建工具实例
  - [ ] 注册到 SegmentationManager
  - [ ] 配置事件监听

#### 验证清单

- [ ] 所有工具能切换
- [ ] 工具互斥规则正确
- [ ] 工具功能正常

---

## Phase 4: UI 层迁移 (Step 8-10)

### Step 8: 迁移 OperationCtl.vue

**状态**: `[ ]` 未开始
**前置条件**: Step 7 完成
**预计工作量**: 3-4 小时

#### 文件修改清单

- [ ] 创建 StateManager 实例
- [ ] 替换 guiSettings 为 StateManager
- [ ] 更新所有状态更新调用
- [ ] 订阅状态变化

#### 验证清单

- [ ] 工具切换 UI 正常
- [ ] 参数调整 UI 正常
- [ ] 状态同步正确

---

### Step 9: 迁移 Calculator.vue

**状态**: `[ ]` 未开始
**前置条件**: Step 8 完成
**预计工作量**: 2 小时

#### 文件修改清单

- [ ] 替换 guiSettings 为 StateManager
- [ ] 使用 setCalculatorTarget() 方法

#### 验证清单

- [ ] 计算器功能正常
- [ ] 通道自动切换正确

---

### Step 10: 迁移 OperationAdvance.vue

**状态**: `[ ]` 未开始
**前置条件**: Step 9 完成
**预计工作量**: 2 小时

#### 文件修改清单

- [ ] 替换 guiSettings 为 StateManager
- [ ] 更新高级参数设置

#### 验证清单

- [ ] 高级设置功能正常

---

## Phase 5: 清理 (Step 11-12)

### Step 11: 全面测试

**状态**: `[ ]` 未开始
**前置条件**: Step 10 完成
**预计工作量**: 4-6 小时

#### 功能测试清单

- [ ] **图像加载**
  - [ ] 加载单个病例
  - [ ] 加载多对比度图像
  - [ ] 切换病例

- [ ] **切片导航**
  - [ ] 切片滑动
  - [ ] 轴向切换 (x/y/z)
  - [ ] 键盘快捷键

- [ ] **工具功能**
  - [ ] Pencil 工具
  - [ ] Brush 工具
  - [ ] Eraser 工具
  - [ ] Pan 工具
  - [ ] Zoom 工具
  - [ ] Contrast 工具
  - [ ] Sphere 工具
  - [ ] Crosshair 工具
  - [ ] Calculator 工具

- [ ] **绘制功能**
  - [ ] 在不同层绘制
  - [ ] 在不同通道绘制
  - [ ] 笔刷大小调整
  - [ ] 透明度调整

- [ ] **Undo/Redo**
  - [ ] Undo 功能
  - [ ] Redo 功能
  - [ ] 多层 Undo/Redo

- [ ] **掩码保存/加载**
  - [ ] 保存到后端
  - [ ] 从后端加载
  - [ ] 数据完整性验证

- [ ] **距离计算**
  - [ ] Sphere 定位
  - [ ] DTS/DTN/DTR 计算

- [ ] **UI 功能**
  - [ ] 工具栏交互
  - [ ] 参数调整
  - [ ] 状态显示

#### 性能测试清单

- [ ] 大尺寸图像 (>512x512)
- [ ] 多层绘制性能
- [ ] 内存使用情况
- [ ] 渲染帧率

#### 兼容性测试清单

- [ ] Chrome
- [ ] Firefox
- [ ] Edge

---

### Step 12: 移除 NrrdTools

**状态**: `[ ]` 未开始
**前置条件**: Step 11 所有测试通过
**预计工作量**: 2-3 小时
**风险等级**: ⚠️ **高风险** - 不可逆操作

#### 移除清单

- [ ] **LeftPanelCore.vue**
  - [ ] 移除 NrrdTools 变量声明
  - [ ] 移除 NrrdTools 创建代码
  - [ ] 移除 NrrdTools 配置代码
  - [ ] 移除 toolNrrdStates 相关代码
  - [ ] 更新 emit，移除 nrrdTools

- [ ] **LeftPanelController.vue**
  - [ ] 移除 nrrdTools ref
  - [ ] 移除 nrrdTools 相关代码
  - [ ] 更新 cleanup 逻辑

- [ ] **Composables**
  - [ ] useMaskOperations: 移除 nrrdTools 参数
  - [ ] useDistanceCalculation: 移除 nrrdTools 参数
  - [ ] useSliceNavigation: 移除 nrrdTools 参数
  - [ ] useCaseManagement: 移除 nrrdTools 参数

- [ ] **Types/Interfaces**
  - [ ] ILeftCoreCopperInit: 移除 nrrdTools 字段

#### 验证清单

- [ ] TypeScript 编译无错误
- [ ] 所有功能测试通过
- [ ] 没有 nrrdTools 引用残留
- [ ] 应用正常运行

#### 回滚方案

**重要**: 在执行此步骤前，创建 Git 分支备份：
```bash
git checkout -b backup-before-remove-nrrdtools
git checkout main  # 或你的工作分支
```

如果出现问题：
```bash
git checkout backup-before-remove-nrrdtools
```

---

## 进度总结

### 完成统计

| Phase | 总任务数 | 已完成 | 待验证 | 进行中 | 未开始 | 完成率 |
|-------|---------|--------|--------|--------|--------|--------|
| Phase 1 | 3 | 0 | 1 | 0 | 2 | 0% |
| Phase 2 | 2 | 0 | 0 | 0 | 2 | 0% |
| Phase 3 | 2 | 0 | 0 | 0 | 2 | 0% |
| Phase 4 | 3 | 0 | 0 | 0 | 3 | 0% |
| Phase 5 | 2 | 0 | 0 | 0 | 2 | 0% |
| **总计** | **12** | **0** | **1** | **0** | **11** | **0%** |

### 时间估算

| Phase | 预计工作量 | 实际工作量 | 差异 |
|-------|-----------|-----------|------|
| Phase 1 | 4-6 小时 | - | - |
| Phase 2 | 5-7 小时 | - | - |
| Phase 3 | 5-7 小时 | - | - |
| Phase 4 | 7-10 小时 | - | - |
| Phase 5 | 6-9 小时 | - | - |
| **总计** | **27-39 小时** | **-** | **-** |

---

## 当前行动项

### 立即执行 (高优先级)

1. **用户验证 Step 1**
   - [ ] 运行应用
   - [ ] 检查控制台日志
   - [ ] 确认没有错误
   - [ ] 反馈验证结果

### 等待中 (依赖验证)

2. **研究 NrrdTools API** (Step 2 准备)
   - [ ] 查看 NrrdTools 源码
   - [ ] 列出所有需要的方法
   - [ ] 确认访问方式

3. **准备 Step 2 实施**
   - [ ] 阅读 Step 2 详细计划
   - [ ] 准备测试用例

---

## 风险跟踪

| 风险 | 等级 | 状态 | 缓解措施 |
|------|------|------|---------|
| 数据格式不兼容 | 🔴 高 | 监控中 | 完整测试 Step 4 |
| Canvas 访问问题 | 🟡 中 | 待评估 | 研究 NrrdTools 源码 |
| 性能下降 | 🟡 中 | 未发生 | Step 11 性能测试 |
| 工具互斥逻辑错误 | 🟡 中 | 未发生 | Step 7 详细测试 |

---

## 问题跟踪

### 待解决问题

| ID | 问题 | 优先级 | 状态 | 负责人 |
|----|------|--------|------|--------|
| - | - | - | - | - |

### 已解决问题

| ID | 问题 | 解决方案 | 解决日期 |
|----|------|----------|---------|
| - | - | - | - |

---

## 每日日志

### 2026-02-04

- [x] 创建迁移计划文档
- [x] 创建任务清单文档
- [x] 完成 Step 1 代码实施
- [ ] 等待用户验证 Step 1

---

**文档版本**: v1.0
**最后更新**: 2026-02-04
**下次更新**: Step 1 验证后
