# AI 执行严格模式模板 - 严格模式

你收到的内容分为两部分：
1. **Plan**: 重构项目的完整计划
2. **Execution Template**: 执行规则（本模板）

请按照以下严格规则执行 Plan：

## 执行规则

1. **逐 Stage 执行**
   - 从 Phase 0 开始，按顺序执行每个 Stage/Phase
   - 每个 Stage 完成后立即停止执行下一 Stage

2. **生成 Stage 报告**
   - 在 `/report/` 文件夹下生成 `Stage_<X>_Report.md`
   - 报告内容包括：
     - Stage 名称
     - 完成状态 (Completed: True / False)
     - 输出日志 / 错误信息
     - 关键数据和变更概览
     - 如果有前端/后端接口或数据变更，列明
   - Markdown 格式，保证可读性

3. **等待确认**
   - 在生成报告后，**不继续执行下一 Stage**  
   - 等待用户确认 `继续执行` 才执行下一个 Stage

4. **错误处理**
   - 如果某个 Stage 出现错误或异常：
     - 在报告里详细记录错误
     - 停止执行下一 Stage
     - 不跳过任何逻辑

5. **日志要求**
   - 每个 Stage 的日志尽量详细，包括函数调用、API 调用、数据读写、Canvas/Uint8Array 更新等  
   - 方便人工核对 Stage 是否执行正确

6. **增量报告**
   - 每个 Stage Report 应该包含：
     - 输入数据
     - 处理逻辑摘要
     - 输出数据 / 变更
     - Delta / Mask 更新情况（如果有）
     - 异常或注意事项
     
7. **AI 错误学习（强制）**
- 所有已发生的执行错误、遗漏、误解 Plan 的行为，必须记录在 `/report/AI_error.md`
- 每条错误必须包含：
  - 错误 Stage
  - 错误描述
  - 根因分析
  - 纠正措施
  - 防止复发的执行约束
- 在执行 **每一个新的 Stage 之前**：
  - 必须检查 `/report/AI_error.md`
  - 并在当前 Stage Report 中声明：
    - “AI_error.md 已检查，本 Stage 未违反已记录错误约束”
- 已记录的错误 **不允许在后续 Stage 中再次发生**

## 示例报告结构

```
/report/Stage_0_Report.md

# Stage 0: Data Persistence Strategy

**Completed**: True

**日志**:
- 初始化 3 个 MaskLayer
- 前端成功加载 NIfTI 文件 layer1/2/3
- Delta 增量同步已启用
- UndoManager 初始化完成

**关键变更**:
- 新增 `SegmentationManager` 类
- Mask 数据结构升级为 Uint8Array
- /outputs/... 目录下生成空 NIfTI 文件

**异常 / 注意事项**:
- 无
```

## 注意

- 执行期间**只使用 Plan 指定的逻辑**，不自行修改或优化 Plan
- 严格模式意味着每个 Stage 完成后必须生成报告并等待确认
- 发送给用户的报告必须在 `/report/` 下保存成 Markdown 文件