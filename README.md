# Medical Image Annotator (Validator)

## Table of contents
* [Summary of functionality](#summary-of-functionality)
* [How to use the plugin](#how-to-use-the-plugin)
* [Summary of technical implementation](#summary-of-technical-implementation)

## Summary of functionality

This plugin provides a clinician-facing **validation workflow** for AI-predicted medical image segmentations. Rather than performing segmentation from scratch, clinicians review existing AI predictions (from nnInteractive [1]) and researcher-drawn masks, then either approve, correct, or reject each case.

The tool supports multi-contrast medical imaging (CT, MR, PET, etc.) with synchronized 2D slice panels (axial, coronal, sagittal) and a 3D volume viewer. When corrections are needed, the same annotation toolset (paint, erase, sphere brush, Gaussian smooth) is available for editing masks.

[1] Isensee, F.*, Rokuss, M.*, Krämer, L.*, Dinkelacker, S., Ravindran, A., Stritzke, F., Hamm, B., Wald, T., Langenberg, M., Ulrich, C., Deissler, J., Floca, R., & Maier-Hein, K. (2025). nnInteractive: Redefining 3D Promptable Segmentation. https://arxiv.org/abs/2503.08373
*: equal contribution

## How to use the plugin

### Prerequisites

- Docker and Docker Compose
- Medical image data accessible via MinIO (S3-compatible) storage

### Standalone deployment (Docker Compose)

```bash
# Start the full stack (frontend + backend + MinIO)
docker compose up --build

# Access the application
open http://localhost:3001
```

This starts three services:
- **Frontend** (nginx) — serves the Vue app and proxies API/WebSocket traffic to the backend
- **Backend** (FastAPI) — handles data coordination, file proxying, and validation logic
- **MinIO** — S3-compatible object storage for medical images and outputs

### Local development

```bash
# Start the backend
cd annotator-backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8082

# Start the frontend (in a separate terminal)
cd annotator-frontend
yarn install
yarn dev
```

The frontend dev server connects directly to the backend at `http://localhost:8082`.

### Plugin deployment (via clinical dashboard)

When deployed as a plugin inside the clinical dashboard portal, the frontend is built as a UMD bundle and the backend runs as a Docker container on the shared `digitaltwins` network. See the main `dashboard-plugin/CLAUDE.md` for the build and deploy pipeline.

```bash
cd annotator-frontend
yarn build:plugin   # Produces dist/my-app.umd.js
```

### Validation workflow

1. **Load a case** — The tool configuration (user UUID, assay UUID, dataset names, cohort names) is passed to the plugin. The backend validates MinIO paths and resolves image URLs.

2. **View images** — Multi-contrast medical images are rendered in synchronized 2D slice panels (axial, coronal, sagittal) and a 3D volume viewer. The AI-predicted mask (`model_predicted_nii`) and researcher-drawn mask (`researcher_manual_nii`) are loaded as overlays.

3. **Review** — The clinician reviews the existing masks and decides on one of three actions:
   - **No need for correction** — the AI prediction is acceptable as-is
   - **Corrected** — the clinician made manual corrections using the annotation tools
   - **Reject** — the case is rejected

4. **Correct (if needed)** — Use the annotation tools to modify masks:
   - **Paint** — freehand brush on the current 2D slice
   - **Erase** — remove annotation on the current slice
   - **Sphere Brush** — place a 3D spherical annotation across multiple slices; scroll mouse wheel to resize
   - **Gaussian Smooth** — apply 3D Gaussian smoothing to the current layer mask
   - **Contrast** / **Zoom** / **Pan** — image navigation controls

5. **Navigate cases** — Use the Validation Panel to move between cases and track validation progress.

6. **Export** — Save corrected masks (NIfTI format) and generate 3D meshes (OBJ/GLB). Trigger SPARC SDS dataset generation for downstream sharing.

### Supported image formats

NRRD, NIfTI (`.nii` / `.nii.gz`), DICOM, VTK, OBJ, GLB, GLTF


## Summary of technical implementation

### Architecture overview

```
annotator-frontend (Vue 3 + TypeScript)
    |
    +-- Vue components & composables (src/)
    |       UI, state management (Pinia), API calls
    |
    +-- ValidationPanel.vue
    |       Case navigation + validation actions (approve/correct/reject)
    |
    +-- Core annotation engine (src/ts/)  <-- loaded separately, not Vite-bundled
            Drawing tools, MaskVolume, GaussianSmoother, UndoManager, 3D rendering

annotator-backend (FastAPI + Python)
    |
    +-- REST API -- tool config, file proxy, validation status, mask upload, SDS generation
    +-- WebSocket -- real-time notifications (OBJ/GLB conversion progress)
    +-- SQLite + SQLAlchemy -- User, Assay, Case, CaseInput (with model_predicted + researcher_manual), CaseOutput (with validate_json)
    +-- MinIO -- S3-compatible storage for input images and output results
```

### Networking

The application supports three deployment modes with different networking:

| Mode | Frontend API base | How requests reach backend |
|------|-------------------|---------------------------|
| Local dev (`yarn dev`) | `http://localhost:8082/api` | Direct connection to backend |
| Docker Compose (production) | `/api` (relative path) | nginx reverse proxy to `backend:8082` |
| Plugin (embedded in portal) | `/plugin/<name>/api` | Portal nginx proxy |

In the Docker Compose stack, nginx serves the built Vue app and proxies `/api/` and `/ws` to the backend container. The frontend uses relative paths so it works regardless of the host port mapping.

### Frontend

The frontend is built with **Vue 3** (Composition API) and **Vuetify 3**, and can be deployed either as a standalone SPA or as a **UMD library plugin** embedded in a host dashboard. In plugin mode (`BUILD_AS_PLUGIN=true`), Vue, Vuetify, Pinia, and vue-toastification are treated as external globals injected by the host.

The core annotation engine lives under `src/ts/` and is deliberately excluded from the Vite bundle to allow independent versioning and loading. Key modules:

| Module | Description |
|--------|-------------|
| `MaskVolume` | 3D volumetric mask stored as a `Uint8Array` of shape `width x height x depth x numChannels`. Provides voxel-level read/write and per-slice `ImageData` rendering. |
| `GaussianSmoother` | 3D separable Gaussian blur optimised with direct array indexing and branch-free convolution. Supports anisotropic voxel spacing. |
| `UndoManager` | Undo/redo stack with `pushGroup()` for atomic multi-slice operations (e.g. Sphere Brush, Gaussian Smooth). |
| `DrawingTool` / `EraserTool` | Per-slice 2D freehand annotation on HTML Canvas. |
| `SphereBrushTool` | 3D sphere that writes to the active layer's `MaskVolume` across all intersected slices in a single grouped undo entry. |
| `DrawToolCore` | Rendering loop compositing annotation layers onto the slice canvas with per-layer opacity. |
| `CanvasState` | Central state container unifying `NrrdState` (image metadata, voxel spacing) and `GuiState` (active tool, drawing parameters). |

3D volume rendering uses the **copper3D** library (a Three.js-based medical imaging renderer) and supports multi-format loading (NRRD, NIfTI, DICOM, VTK, OBJ, GLB, GLTF).

### Backend

The backend is a **FastAPI** application serving three roles:

1. **Data coordination** — On startup of a case, the frontend calls `POST /api/tool-config`. The backend validates image paths on MinIO, resolves URLs (including `model_predicted_nii` and `researcher_manual_nii` inputs), and synchronises User / Assay / Case records in SQLite. The response carries all resolved input URLs via SSE.

2. **File proxying** — The frontend loads medical images through `/api/files/{case_id}/{file_type}` endpoints, which proxy the actual files from MinIO or local storage. This avoids exposing MinIO URLs directly to the browser.

3. **Validation management** — `GET /api/validate-status/{case_id}` and `POST /api/validate/{case_id}` manage the validation state for each case. The validation result is persisted as a JSON file (`validate_json`) in the case output.

4. **Output processing** — Annotation masks are stored as NIfTI files. An async background task converts them to 3D OBJ/GLB meshes using trimesh and pygltflib, and optionally packages everything as a **SPARC SDS dataset** via sparc_me. Progress is broadcast to the frontend over WebSocket.

### Data flow

```
Host dashboard / Browser
  +-- passes config (user UUID, assay UUID, datasets, cohorts)
        |
        v
Frontend
  +-- POST /api/tool-config --> resolve MinIO URLs (SSE) --> load images via /api/files proxy
  +-- Load AI prediction (model_predicted_nii) + researcher mask (researcher_manual_nii)
  +-- Clinician reviews and optionally corrects annotations
  +-- POST /api/validate/{case_id} --> record validation decision
  +-- WebSocket <-- notified when OBJ/GLB/SDS outputs are ready
        |
        v
Backend
  +-- SQLite: User, Assay, Case, CaseInput, CaseOutput
  +-- MinIO: input images (read) + output results (write)
  +-- Async tasks: NIfTI --> OBJ/GLB conversion, SPARC SDS packaging
```
