# Medical Image Annotator (Validator)

## Project Overview

A full-stack medical image annotation **validation** tool. Clinicians review AI-predicted segmentations and researcher-drawn masks, then either approve, correct, or reject each case. Built with Vue 3 + TypeScript frontend and FastAPI Python backend. Deployable as a standalone SPA, as a Docker Compose stack (frontend + backend + MinIO), or as an embedded UMD plugin inside the clinical dashboard portal.

## Architecture

```
medical-image-annotator-validator/
├── annotator-frontend/    # Vue 3 + TypeScript + Vuetify 3 (dual-mode: app or UMD plugin)
├── annotator-backend/     # FastAPI + SQLAlchemy
├── plan/                  # Implementation plans & task tracking
├── docker-compose.yml     # Standalone stack (frontend + backend + MinIO)
└── medical_image_annotator.cwl  # CWL workflow definition
```

### Frontend Stack
- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Language**: TypeScript 5.0 (strict mode)
- **Build**: Vite 6.3 — dual mode via `BUILD_AS_PLUGIN` env var
  - Plugin mode → `my-app.umd.js` (UMD library, externals: Vue, Vuetify, Pinia, vue-toastification)
  - App mode → standard SPA build
- **UI**: Vuetify 3.8 (Material Design)
- **State**: Pinia 2.0
- **3D Engine**: copper3D (custom medical imaging renderer on Three.js)
- **Package Manager**: Yarn
- **Testing**: Vitest

### Backend Stack
- **Framework**: FastAPI (Python) on Uvicorn
- **Database**: SQLite + SQLAlchemy ORM
- **Storage**: MinIO (S3-compatible)
- **Medical Libraries**: nibabel, SimpleITK, pynrrd, scikit-image
- **3D Conversion**: trimesh, pygltflib
- **Dataset Format**: SPARC SDS via sparc_me

## Deployment Modes

### 1. Local Development
```bash
# Backend
cd annotator-backend
uvicorn main:app --port 8082

# Frontend
cd annotator-frontend
yarn dev    # Connects to backend via http://localhost:8082
```
Frontend uses `.env` (`VITE_PLUGIN_API_PORT=8082`) to connect directly to backend.

### 2. Standalone Docker Compose
```bash
docker compose up --build
```
- Frontend: nginx on container port 80, mapped to host `${FRONTEND_PORT:-3001}`
- Backend: uvicorn on container port 8082 (internal only, not exposed to host)
- MinIO: ports 9000 (API) + 9001 (console)
- Frontend uses **relative paths** (`/api`, `/ws`) — nginx proxies to backend
- All services on `annotator-validator-net` bridge network

### 3. Plugin in Clinical Dashboard
- Built via portal's `PluginBuilder` → UMD bundle uploaded to MinIO `tools` bucket
- Backend deployed via portal's `PluginDeployer` → `annotator-backend/docker-compose.yml`
- Backend must attach to `digitaltwins` external network
- Nginx route: `/plugin/<expose_name>/` → plugin backend container

## Common Commands

### Frontend
```bash
cd annotator-frontend
yarn dev              # Dev server with hot reload
yarn build            # Production app build
yarn build:plugin     # Plugin build (UMD, BUILD_AS_PLUGIN=true)
yarn test             # Run Vitest tests
yarn test:watch       # Watch mode
yarn test:ui          # Interactive test UI
yarn lint             # ESLint with auto-fix
```

### Backend
```bash
cd annotator-backend
uvicorn main:app --port 8082    # Start dev server
```

### Docker
```bash
docker compose up --build       # Standalone stack
docker compose down             # Stop stack
```

## Code Conventions

- **Indent**: 2 spaces (JS/TS/Vue), per `.editorconfig`
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Components**: Vue 3 Composition API (`<script setup lang="ts">`)
- **Path alias**: `@/` maps to `src/`
- **Linting**: ESLint with `vue3-essential` + TypeScript rules
- **Multi-word component names rule**: disabled

## Networking & API Base URL

The frontend determines API base URL via `src/plugins/api/getBaseUrl.ts`:

| Mode | `getApiBaseUrl()` | How it reaches backend |
|------|-------------------|----------------------|
| Dev (`yarn dev`) | `http://localhost:8082/api` | Direct connection |
| Production (`yarn build` + nginx) | `/api` (relative) | nginx `proxy_pass → backend:8082` |
| Plugin (`build:plugin`) | `/plugin/<name>/api` | Portal nginx proxy |

**No `.env.production` file** — production builds use relative paths. Only `.env` exists for local development.

### Nginx Configuration (`annotator-frontend/nginx.conf`)

- Proxies `/api/` → `http://backend:8082/api/`
- Proxies `/ws` → `http://backend:8082/ws` (WebSocket upgrade)
- Uses `$http_host` (not `$host`) to preserve the port in proxied `Host` header
- SSE support: `proxy_buffering off` for tool-config streaming
- SPA fallback: `try_files $uri $uri/ /index.html`

## Key Source Locations

### Validator-Specific Components

| Path | Purpose |
|------|---------|
| `annotator-frontend/src/components/segmentation/ValidationPanel.vue` | Case validation UI (approve / correct / reject) with case navigation |
| `annotator-frontend/src/plugins/api/validate.ts` | Validation API client (`getValidateStatus`, `updateValidateStatus`) |

### Core Annotation Engine (`src/ts/` — excluded from Vite build, loaded separately)

| Path | Purpose |
|------|---------|
| `src/ts/Utils/segmentation/core/MaskVolume.ts` | 3D volumetric mask (width x height x depth x numChannels, Uint8Array) |
| `src/ts/Utils/segmentation/core/GaussianSmoother.ts` | Optimized 3D Gaussian blur (anisotropic spacing support) |
| `src/ts/Utils/segmentation/core/UndoManager.ts` | Undo/redo with grouped operations (`pushGroup`) |
| `src/ts/Utils/segmentation/core/types.ts` | Core type definitions |
| `src/ts/Utils/segmentation/CanvasState.ts` | Central state container (NrrdState, GuiState, volumes, undo stacks) |
| `src/ts/Utils/segmentation/DrawToolCore.ts` | Rendering loop (canvas composition, globalAlpha) |

### Frontend Components & Composables

| Path | Purpose |
|------|---------|
| `src/components/segmentation/OperationCtl.vue` | Main tool buttons (Paint, Erase, Smooth, Sphere) |
| `src/components/segmentation/LayerChannelSelector.vue` | Multi-layer/channel UI |
| `src/composables/left-panel/useCaseManagement.ts` | Case load/save logic |
| `src/composables/left-panel/useMaskOperations.ts` | Undo/redo + mask operations |
| `src/composables/right-panel/useWebSocketSync.ts` | WebSocket synchronization |
| `src/plugins/api/getBaseUrl.ts` | API/WS base URL resolution (dev / prod / plugin) |
| `src/plugins/api/client.ts` | Axios HTTP client with baseURL from `getApiBaseUrl()` |

### Backend

| Path | Purpose |
|------|---------|
| `main.py` | FastAPI app, CORS, `/api/tool-config`, `/api/generate_sds` |
| `router/tumour_segmentation.py` | Main API routes: cases, files proxy, validation, download, WebSocket |
| `models/db_model.py` | SQLAlchemy ORM (User, Assay, Case, CaseInput, CaseOutput) |
| `services/minio_service.py` | MinIO S3 validation and path resolution |
| `utils/convert.py` | Format conversion (NIfTI to OBJ/GLB) |
| `utils/sds.py` | SPARC SDS dataset generation |
| `utils/ws_manager.py` | WebSocket notification manager |
| `utils/setup.py` | Docker detection, external base URL construction, URL rewriting |
| `database/database.py` | SQLAlchemy engine, `get_db()` dependency |

## Data Models (Backend)

- **User**: uuid, assays (1:N), cases (1:N)
- **Assay**: uuid, user_uuid, name, minio_public_path, datasets_config, cohorts_config, output_path
- **Case**: user_uuid, assay_uuid, name, is_current
- **CaseInput**: contrast_pre/1/2/3/4 paths, registration_pre/1/2/3/4 paths, model_predicted_nii, researcher_manual_nii
- **CaseOutput**: mask_meta_json, clinician_validated_nii, mask_obj, mask_glb, validate_json, SDS dataset names

## Validation Workflow

1. **Tool Config** (`POST /api/tool-config`): frontend sends user/assay UUIDs + dataset/cohort names. Backend validates MinIO paths, resolves input URLs (including `model_predicted_nii` and `researcher_manual_nii`), creates DB records, returns resolved URLs via SSE.
2. **Load Case**: frontend loads multi-contrast images + AI prediction + researcher mask via proxied file URLs (`/api/files/{case_id}/{file_type}`).
3. **Review & Annotate**: clinician reviews the AI-predicted and researcher-drawn masks, optionally corrects annotations using drawing tools.
4. **Validate** (`POST /api/validate/{case_id}`): clinician marks the case as one of:
   - `no_need_for_correction` — AI prediction is acceptable
   - `corrected` — clinician made corrections
   - `reject` — case is rejected
5. **Export**: masks saved as NIfTI, converted to OBJ/GLB, packaged as SPARC SDS dataset.

## Supported Medical Image Formats

NRRD, NIfTI (.nii / .nii.gz), DICOM, VTK, OBJ, GLB, GLTF

## Important Notes

- `src/ts/` is **excluded from the Vite build** and loaded as a separate bundle. Do not add imports from `src/ts/` into Vite-compiled files.
- Plugin build externalizes Vue, Vuetify, Pinia, vue-toastification — these must exist as globals in the host page.
- Backend serves on **port 8082** internally.
- There is **no `.env.production`** file. Production builds rely on relative paths (`/api`) resolved at runtime by the browser. Only `.env` exists for local dev with `VITE_PLUGIN_API_PORT=8082`.
- The standalone `docker-compose.yml` (project root) includes its own MinIO instance. The plugin `docker-compose.yml` (`annotator-backend/docker-compose.yml`) uses the portal's shared MinIO via the `digitaltwins` network.
