Phase 4 已完成，并且对应的 /report/Stage_4_Report.md 已生成并确认无误。

请继续严格按照 execution_plan.md 与“AI 执行严格模式模板”执行 Phase 5。
执行 Phase 5 前请先确认 Phase 5 的目标与输入。



Here are the documents:

- @mask_storage_migration_plan.md  
- @mask_storage_migration_task.md  
- @mask_channel_colors_design.md  

Please execute Phase 2 — Day 6: Update CommToolsData & Type Definitions

When finish task need to update @mask_storage_migration_task.md
Do NOT proceed to the next step after completion.  
Wait for my validation and confirmation before continuing.


我现在让你在 @NrrdTools.ts 新增几个管理layer和channel的函数，要实现跑通 @LayerChannelSelector.vue layer 和channel对画笔, pencil，eraser的控制。
1. 你可以参考 @plan/reference/manager/core/LayerManager.ts和VisibilityManager.ts 看它是怎么设计layer 和channel的管理的，如有必要重写在@segmentation中，然后通过NrrdTools来导出。
    - 当layer选择不显示时，该layer下的所有channel mask 数据不能显示
    - 当layer选择显示时，只显示该layer下的所有选择显示的channel 的mask 数据
        - 比如我有3个layer：layer1， layer2， layer3，我这三个layer都支持8个channel， 那么默认我要展示所有layer上所有channel的mask数据到画布上。
          - 现在用户选择了只显示layer1 的数据，那么画布上就要移除layer2， layer3的mask数据
          - 现在用户选择了只显示layer1 的 channel 1， channel 3， channel 4， channel 5， channel 6，channel 7的数据， 那么画布上就要移除layer2， layer3的mask数据和layer 1 channel 2和channel 8的数据。以此类推
    - 支持多layer同时显示
        - 你需要好好的分析一下我的canvas架构：
         ```
          canvases: {
            originCanvas: null,
            drawingCanvas: canvases[0],
            displayCanvas: canvases[1],
            drawingCanvasLayerMaster: canvases[2],
            drawingCanvasLayerOne: canvases[3],
            drawingCanvasLayerTwo: canvases[4],
            drawingCanvasLayerThree: canvases[5],
            drawingSphereCanvas: canvases[6],
            emptyCanvas: canvases[7],
        },
         ``` 
         - drawingCanvasLayerOne 对应layer1 的数据层
         - drawingCanvasLayerTwo 对应layer2 的数据层
         - drawingCanvasLayerThree 对应layer3 的数据层
    - 默认选中要操作的是layer1 的channel 1， 所以你要把fillColor和brushColor的颜色默认改为channel 1的颜色
2. pencil，画笔和eraser只能操作选中的layer下的选中的channel 的mask的数据
   - 逻辑很简单：当用户选择了channel时，那么把fillColor和brushColor改成该channel对应的颜色即可， 你需要更改的函数在@gui.ts updatePencilState 其中segmentation==true即为pencil状态，false为brush状态。
   - 当通过pencil，画笔和eraser操作时，只能操作当前选择的channel的数据， 其他channel的数据不能动，你得要改造下我的this.drawingPrameters.handleOnDrawingMouseMove，你可以参考：@plan/reference/s_d.vue 文件中，它是如何让画笔和橡皮擦只工作在一个channel上的。pencil，画笔和eraser的基本功能你不准给我改变。
     - 比如： 现在用户使用的是pencil，现在选择的是layer 1 的channel 2 需要进行操作，而且此时所有layers的数据都显示在画布上的。
        - 那么现在用户更新画布layer 1 的channel 2的数据，画布上只能更新layer 1 的channel 2的数据，其他图层以及他们channel的数据都不能变。其实这个很好解决，因为我们更新layer 1 mask的数据是在drawingCanvasLayerOne上更新的，显示的画布一直在刷新显示drawingCanvasLayerOne，drawingCanvasLayerTwo，drawingCanvasLayerThree上所有选择显示的channel数据，我们只要解决到只能操作当前选择的channel的数据， 其他channel的数据不能动这个问题。那么其他的都会自动刷新在展示的画布上。
3. 当切换channel时，要更新画笔的颜色 fillColor:,brushColor: , 要让他们匹配选择的channel的颜色。
规则：

- 你根据NrrdTools 的方法来改造LayerChannelSelector.vue 和 useLayerChannel.ts让他们能实现我对layer和channel的管理和控制
- 执行完成后，要更新mask_storage_migration_task.md
 