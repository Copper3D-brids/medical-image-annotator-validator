# NRRD 与 NIfTI 坐标系转换及 Three.js 渲染对齐

## 1. 背景

项目中 NRRD 医学图像在前端通过 Copper3D/Three.js 渲染，后端使用 nibabel 创建 NIfTI (.nii) mask 文件，并将 NIfTI 转换为 OBJ/GLTF 3D 模型在 Three.js 右侧面板中叠加渲染。

### 问题

- 前端传入的 `spaceOrigin` 和 `voxelSpacing` 来自 NRRD 图像
- 后端创建 NIfTI 时直接使用这些值构建 affine 矩阵，导致 NIfTI 的 origin 与 NRRD 不一致
- 纠正 NIfTI origin 后，生成的 OBJ/GLTF 模型在 Three.js 中出现镜像翻转

## 2. 坐标系说明

### 2.1 NRRD 文件

本项目的 NRRD 文件 header：

```
space: left-posterior-superior
space origin: (-172.90557483345, -150.62954517692, -60.331355285645)
space directions: (0.759, 0, 0) (0, 0.759, 0) (0, 0, 1.1)
```

- **坐标系**：LPS（Left-Posterior-Superior）
- **origin 值**：`[-172.9, -150.6, -60.3]`，在 LPS 中为负值，表示图像起始于 Right-Anterior-Inferior (RAI) 角落
- **ITK-SNAP 显示**：orientation 为 RAI（描述的是图像数据的起始方向，与 LPS 坐标系一致）

### 2.2 NIfTI 文件

NIfTI 标准中，affine 矩阵通过 sform/qform 定义 voxel→world 的映射。

经过 RAI→LPS 转换后的 NIfTI affine：

```
[-spacing_x,    0,          0,         172.9 ]
[   0,       -spacing_y,    0,         150.6 ]
[   0,          0,       spacing_z,    -60.3 ]
[   0,          0,          0,          1.0  ]
```

- **存储的 origin**：`[172.9, 150.6, -60.3]`（LPS 值）
- **ITK-SNAP 显示**：orientation 为 LPS

### 2.3 ITK-SNAP orientation 与坐标系的关系

ITK-SNAP 显示的 orientation（RAI/LPS）与文件 header 中的坐标系是**不同层面的描述**：

| 描述 | NRRD | NIfTI |
|------|------|-------|
| 坐标系 | LPS（header: `space: left-posterior-superior`） | 由 affine 矩阵定义 |
| Origin 值 | `[-172.9, -150.6, -60.3]`（LPS 坐标） | `[172.9, 150.6, -60.3]`（LPS 值） |
| ITK-SNAP orientation | RAI（图像起始方向） | LPS（图像起始方向） |

两者描述的是同一张图像，只是 origin 的表达不同：
- NRRD origin 在 LPS 坐标系中为负值 → 起始角在 RAI
- NIfTI origin 在 affine 中为正值（经过转换） → 起始角在 LPS

### 2.4 Three.js NRRDLoader 坐标转换

Three.js 的 `NRRDLoader` 源码（[NRRDLoader.js](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/NRRDLoader.js)）中，对 `left-posterior-superior` 空间应用了转换矩阵：

```javascript
if ( headerObject.space === 'left-posterior-superior' ) {
    transitionMatrix.set(
        -1, 0, 0, 0,
         0, -1, 0, 0,
         0, 0, 1, 0,
         0, 0, 0, 1
    );
}
```

此矩阵对 X、Y 轴取反，将 LPS 转换为 **RAS**（Right-Anterior-Superior）。

**结论**：Three.js 渲染 NRRD 切片时使用的是 **RAS** 坐标空间。

## 3. 完整的坐标转换链路

```
NRRD 文件 (LPS)                    Three.js 渲染 (RAS)
origin: [-172.9, -150.6, -60.3]  →  NRRDLoader diag(-1,-1,1)  →  [172.9, 150.6, -60.3]

NIfTI 文件 (LPS in affine)         OBJ/GLTF 顶点 (RAS for Three.js)
origin: [172.9, 150.6, -60.3]   →  convert.py: negate X,Y    →  [-172.9, -150.6, -60.3]
                                                                   ↓ + abs(spacing) * verts
                                                                   ↓ + nrrdBias positioning
                                                                   → 与 NRRD 切片对齐 ✓
```

### 3.1 创建 NIfTI（tools.py）

前端传入 NRRD 的 `spaceOrigin`（LPS: `[-172.9, -150.6, -60.3]`）和 `voxelSpacing`。

```python
# RAI→LPS 转换：NRRD origin (LPS负值) → NIfTI affine (LPS正值)
# X、Y 取反
affine = np.diag([-spacing[0], -spacing[1], spacing[2], 1.0])
affine[:3, 3] = [-origin[0], -origin[1], origin[2]]
# origin = [-172.9, -150.6, -60.3]
# affine[:3, 3] = [172.9, 150.6, -60.3]
```

### 3.2 NIfTI 转 OBJ/GLTF（convert.py）

读取 NIfTI affine 中的 LPS origin，转回 NRRD 原始值（LPS 负值）用于顶点计算，使模型在 Three.js 的 RAS 渲染空间中与 NRRD 切片对齐。

```python
affine = img.affine
# NIfTI affine[:3, 3] = [172.9, 150.6, -60.3] (LPS)
# 转回 NRRD 原始值：negate X, Y
spacing = [abs(affine[0, 0]), abs(affine[1, 1]), abs(affine[2, 2])]
origin = [-affine[0, 3], -affine[1, 3], affine[2, 3]]
# origin = [-172.9, -150.6, -60.3]

verts = verts * spacing + origin
```

### 3.3 前端模型定位（useRightPanelModels.ts）

```typescript
// nrrdOrigin 来自 volume.header.space_origin = [-172.9, -150.6, -60.3]（LPS 原始值）
// nrrdBias 用于居中对齐
const x_bias = -(nrrdOrigin[0] * 2 + nrrdRASDimensions[0]) / 2;
const y_bias = -(nrrdOrigin[1] * 2 + nrrdRASDimensions[1]) / 2;
const z_bias = -(nrrdOrigin[2] * 2 + nrrdRASDimensions[2]) / 2;
nrrdBias = new THREE.Vector3(x_bias, y_bias, z_bias);

// OBJ/GLTF 模型加载后，用 nrrdBias 定位
content.position.set(nrrdBias.x, nrrdBias.y, nrrdBias.z);
```

## 4. 修改的文件

### 4.1 `annotator-backend/utils/tools.py`

`create_nifti_file()` 和 `write_nifti_file()` — 创建 NIfTI 时进行坐标转换：

```python
# 修改前（直接使用 NRRD 值，导致 nibabel 存储时 origin 翻转）
affine = np.diag([spacing[0], spacing[1], spacing[2], 1.0])
affine[:3, 3] = origin

# 修改后（正确的坐标转换）
affine = np.diag([-spacing[0], -spacing[1], spacing[2], 1.0])
affine[:3, 3] = [-origin[0], -origin[1], origin[2]]
```

### 4.2 `annotator-backend/router/tumour_segmentation.py`

内联的 init-layers 实现（~line 589），同样的坐标转换修改。

### 4.3 `annotator-backend/utils/convert.py`

`convert_nii_to_obj()`、`convert_nii_to_gltf()`、`convert_to_obj()` — 读取 NIfTI origin 时转回 NRRD 原始值：

```python
# 修改前（直接使用 NIfTI affine origin）
origin = [affine[0, 3], affine[1, 3], affine[2, 3]]

# 修改后（LPS → 转回 NRRD 原始值，negate X, Y）
origin = [-affine[0, 3], -affine[1, 3], affine[2, 3]]
```

## 5. 注意事项

### 5.1 .nii.gz 文件不能直接改扩展名

`.nii.gz` 是 gzip 压缩文件。直接把扩展名从 `.nii.gz` 改为 `.nii` 不会解压内容，`nib.load()` 会因为格式不匹配而失败。

正确做法：
```bash
# 改回扩展名
mv mask.nii mask.nii.gz

# 或真正解压
gzip -d mask.nii.gz
```

### 5.2 坐标系转换总结

| 操作 | 转换 | X | Y | Z |
|------|------|---|---|---|
| 创建 NIfTI（NRRD→NIfTI） | 取反 X, Y | `-origin[0]` | `-origin[1]` | `origin[2]` |
| 生成 OBJ/GLTF（NIfTI→渲染） | 取反 X, Y | `-affine[0,3]` | `-affine[1,3]` | `affine[2,3]` |
| Three.js NRRDLoader（LPS→RAS） | 取反 X, Y | `×(-1)` | `×(-1)` | `×1` |
