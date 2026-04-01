# terminial-> venv/Scripts/activate.bat

import uvicorn
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse, StreamingResponse
import traceback
from pathlib import Path
import io
import os
import json
import shutil
from router import tumour_segmentation
from dotenv import load_dotenv
from typing import List
from sqlalchemy.orm import Session
from models.api_models import ToolConfigRequest
from services.minio_service import MinIOValidationError
from models.db_model import User, Assay, Case, CaseInput, CaseOutput
from services.minio_service import MinIOService
from database.database import get_db, init_db
from utils.setup import Config, get_external_base_url, rewrite_url_for_docker
from utils.convert import convert_nii_to_gltf
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_dotenv()
    init_db()
    print("starting lifespan")
    yield
    # Shutdown
    print("ending lifespan")
    pass


app = FastAPI(title="Medical Image Annotator", verison="1.0.0", lifespan=lifespan)
app.include_router(tumour_segmentation.router)

expose_headers = ["x-volume", "x-file-name", "Content-Disposition"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=expose_headers
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.extract_tb(exc.__traceback__)
    last_frame = tb[-1] if tb else None
    location = f"{last_frame.filename}:{last_frame.lineno}" if last_frame else "unknown"
    error_msg = f"{type(exc).__name__} at {location} - {str(exc)}"
    print(f"[Unhandled Exception] {request.method} {request.url.path}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": error_msg}
    )


@app.get('/')
async def root():
    return "Welcome to segmentation backend"


@app.get('/api/health')
async def health():
    return {"status": "ok"}


@app.post('/api/tool-config')
async def get_tool_config(request: ToolConfigRequest, db: Session = Depends(get_db)):
    print(f"\n{'='*60}")
    print(f"[tool-config] user={request.user_info.uuid}, assay={request.assay_info.uuid}")
    print(f"  datasets: {request.assay_info.datasets}")
    print(f"  cohorts:  {request.assay_info.cohorts}")
    print(f"  minio:    {request.system.minio.base_url}")
    print(f"{'='*60}")

    # 1. Validation & Resolution (pre-streaming — errors raise HTTPException)
    minio_service = MinIOService()

    # 1.1 Validate Minio public path
    minio_base_url = request.system.minio.base_url
    print(f"[Step 1.1] Validating MinIO base URL: {minio_base_url}")
    try:
        minio_service.validate_base_url(minio_base_url)
    except MinIOValidationError as e:
        print(f"[Step 1.1] FAILED: {e.summary}")
        raise HTTPException(status_code=400, detail={
            "step": e.step, "summary": e.summary, "detail": e.detail
        })
    print(f"[Step 1.1] OK")

    datasets = request.assay_info.datasets
    cohorts = request.assay_info.cohorts
    required_inputs = Config.INPUTS

    # 1.2 - 1.4 Validate datasets, cohorts, and resolve inputs
    try:
        resolved_results = minio_service.validate_and_resolve_inputs(
            public_path=minio_base_url,
            datasets=datasets,
            cohorts=cohorts,
            required_inputs=required_inputs
        )
        print(f"[Step 1.4] Input resolution complete")
    except MinIOValidationError as e:
        traceback.print_exc()
        print(f"[Step {e.step}] FAILED: {e.summary}")
        raise HTTPException(status_code=400, detail={
            "step": e.step, "summary": e.summary, "detail": e.detail
        })
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail={
            "step": "unknown", "summary": f"Unexpected validation error: {e}", "detail": str(e)
        })

    # Rewrite URLs for Docker environment
    external_base = get_external_base_url()
    if external_base:
        print(f"Docker detected: rewriting MinIO URLs with external base: {external_base}")
        for cohort in resolved_results:
            for input_type in resolved_results[cohort]:
                resolved_results[cohort][input_type] = rewrite_url_for_docker(
                    resolved_results[cohort][input_type], external_base
                )

    # Store request data for the generator (closures capture these)
    req_user_uuid = request.user_info.uuid
    req_assay_uuid = request.assay_info.uuid
    req_assay_name = request.assay_info.name

    def sse_event(event: str, data: dict) -> str:
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"

    def process_cases():
        """Generator that processes cases and yields SSE events."""
        total_cases = len(cohorts)

        try:
            # Create output directories
            output_dir = Path("outputs") / req_user_uuid / req_assay_uuid / "medical-image-annotator-outputs"
            output_dir.mkdir(parents=True, exist_ok=True)
            output_sds_dir = output_dir.parent / "medical-image-annotator-outputs-sds"
            output_sds_dir.mkdir(parents=True, exist_ok=True)

            # 1. User
            user = db.query(User).filter(User.uuid == req_user_uuid).first()
            if not user:
                user = User(uuid=req_user_uuid)
                db.add(user)
                db.commit()
                db.refresh(user)

            # 2. Assay
            assay = db.query(Assay).filter(Assay.uuid == req_assay_uuid).first()
            if not assay:
                assay = Assay(
                    uuid=req_assay_uuid,
                    user_uuid=user.uuid,
                    name=req_assay_name,
                    minio_base_url=minio_base_url,
                    datasets_config=datasets,
                    cohorts_config=cohorts,
                    output_path=str(output_dir),
                    output_sds_path=str(output_sds_dir)
                )
                db.add(assay)
                db.commit()
                db.refresh(assay)

            # 3. Process each case (cohort)
            for case_idx, cohort in enumerate(cohorts):
                yield sse_event("progress", {
                    "step": "resolving_inputs",
                    "case": cohort,
                    "total_cases": total_cases,
                    "current": case_idx + 1
                })

                # Create or get case
                case = db.query(Case).filter(Case.assay_uuid == assay.uuid, Case.name == cohort).first()
                if not case:
                    case = Case(
                        assay_uuid=assay.uuid,
                        user_uuid=user.uuid,
                        name=cohort,
                        is_current=False
                    )
                    db.add(case)
                    db.commit()
                    db.refresh(case)

                # 4. Inputs — resolve all input types from resolved_results
                input_fields = {
                    "contrast_pre_path": resolved_results[cohort].get("contrast_pre"),
                    "contrast_1_path": resolved_results[cohort].get("contrast_1"),
                    "contrast_2_path": resolved_results[cohort].get("contrast_2"),
                    "contrast_3_path": resolved_results[cohort].get("contrast_3"),
                    "contrast_4_path": resolved_results[cohort].get("contrast_4"),
                    "registration_pre_path": resolved_results[cohort].get("registration_pre"),
                    "registration_1_path": resolved_results[cohort].get("registration_1"),
                    "registration_2_path": resolved_results[cohort].get("registration_2"),
                    "registration_3_path": resolved_results[cohort].get("registration_3"),
                    "registration_4_path": resolved_results[cohort].get("registration_4"),
                    "model_predicted_nii_path": resolved_results[cohort].get("model_predicted_nii"),
                    "researcher_manual_nii_path": resolved_results[cohort].get("researcher_manual_nii"),
                }

                if not case.input:
                    case_input = CaseInput(case_id=case.id, **input_fields)
                    db.add(case_input)
                else:
                    for field, value in input_fields.items():
                        setattr(case.input, field, value)

                # 5. Output — one file per sam folder, driven by Config.OUTPUTS
                if not case.output:
                    case_folder = output_dir / cohort
                    output_names = Config.OUTPUTS
                    output_extensions = Config.OUTPUT_EXTENSIONS

                    # Create sam folders and file paths dynamically
                    output_paths = {}  # output_name -> Path
                    for idx, out_name in enumerate(output_names, start=1):
                        sam_folder = case_folder / f"sam-{idx}"
                        sam_folder.mkdir(parents=True, exist_ok=True)
                        ext = output_extensions.get(out_name, "")
                        output_paths[out_name] = sam_folder / f"{out_name}{ext}"

                    # Initialize mask_meta_json (empty JSON)
                    if not output_paths["mask_meta_json"].exists():
                        output_paths["mask_meta_json"].write_text("{}")

                    # Initialize validate_json with default values
                    yield sse_event("progress", {
                        "step": "create_validate_json",
                        "case": cohort,
                        "total_cases": total_cases,
                        "current": case_idx + 1
                    })
                    default_validate = {
                        "no_need_for_correction": False,
                        "corrected": False,
                        "reject": False,
                        "finished": False
                    }
                    output_paths["validate_json"].write_text(json.dumps(default_validate, indent=2))

                    # Auto-copy researcher_manual_nii → clinician_validated_nii
                    clinician_nii_path = output_paths["clinician_validated_nii"]
                    researcher_nii_url = resolved_results[cohort].get("researcher_manual_nii")
                    if researcher_nii_url:
                        yield sse_event("progress", {
                            "step": "copy_nii",
                            "case": cohort,
                            "total_cases": total_cases,
                            "current": case_idx + 1
                        })
                        try:
                            bucket, object_path = minio_service._extract_bucket_and_path(researcher_nii_url)
                            response = minio_service.client.get_object(bucket, object_path)
                            with open(clinician_nii_path, 'wb') as f:
                                shutil.copyfileobj(response, f)
                            response.close()
                            response.release_conn()
                            print(f"  Copied researcher_manual_nii → {clinician_nii_path}")
                        except Exception as e:
                            print(f"  Warning: Failed to copy researcher_manual_nii for {cohort}: {e}")
                            if not clinician_nii_path.exists():
                                clinician_nii_path.touch()
                    else:
                        if not clinician_nii_path.exists():
                            clinician_nii_path.touch()

                    # Create empty GLB placeholder (will be overwritten by conversion)
                    mask_glb_path = output_paths["mask_glb"]
                    if not mask_glb_path.exists():
                        mask_glb_path.touch()

                    # Create CaseOutput record dynamically from Config.OUTPUTS
                    case_output_kwargs = {"case_id": case.id, "temp_dataset_name": "medical-image-annotator-outputs"}
                    for out_name in output_names:
                        p = output_paths[out_name]
                        case_output_kwargs[f"{out_name}_path"] = str(p)
                        case_output_kwargs[f"{out_name}_size"] = p.stat().st_size

                    case_output_record = CaseOutput(**case_output_kwargs)
                    db.add(case_output_record)
                    db.commit()
                    db.refresh(case_output_record)

                    # Auto-convert NII → GLTF (only if we have actual NII data)
                    if researcher_nii_url and clinician_nii_path.stat().st_size > 0:
                        yield sse_event("progress", {
                            "step": "convert_gltf",
                            "case": cohort,
                            "total_cases": total_cases,
                            "current": case_idx + 1
                        })
                        try:
                            result = convert_nii_to_gltf(
                                case_output_record,
                                nii_path=str(clinician_nii_path),
                                glb_path=str(mask_glb_path)
                            )
                            if result:
                                case_output_record.mask_glb_size = Path(result).stat().st_size
                                print(f"  Converted NII → GLTF for {cohort}")
                            else:
                                print(f"  Warning: GLTF conversion returned None for {cohort} (possibly empty mask)")
                        except Exception as e:
                            print(f"  Warning: GLTF conversion failed for {cohort}: {e}")

                    # Update DB
                    yield sse_event("progress", {
                        "step": "update_db",
                        "case": cohort,
                        "total_cases": total_cases,
                        "current": case_idx + 1
                    })
                    db.commit()

            # Final commit and success event
            db.commit()
            yield sse_event("complete", {"status": "success", "assay_id": assay.id})

        except Exception as e:
            db.rollback()
            error_tb = traceback.format_exc()
            print(f"[get_tool_config] Error during processing:\n{error_tb}")
            yield sse_event("error", {
                "step": "processing",
                "summary": "Internal server error during case processing",
                "detail": f"{type(e).__name__}: {str(e)}"
            })

    return StreamingResponse(
        process_cases(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@app.get("/data/users")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users


@app.get("/data/assays")
async def get_assays(db: Session = Depends(get_db)):
    assays = db.query(Assay).all()
    return assays


@app.get("/data/cases")
async def get_cases(db: Session = Depends(get_db)):
    # Using simple join or eager load to show relationships could be useful, 
    # but basic query with SQLAlchemy usually returns nested objects if relationships are set up.
    # We might need to handle serialization carefully if they are circular, but fastAPI handles dicts well.
    cases = db.query(Case).all()
    # Return cases with inputs and outputs
    result = []
    for case in cases:
        # Read validate_json from file if available
        validate_json_data = None
        if case.output and case.output.validate_json_path:
            try:
                with open(case.output.validate_json_path) as f:
                    validate_json_data = json.loads(f.read())
            except Exception:
                validate_json_data = None

        result.append({
            "id": case.id,
            "name": case.name,
            "user_uuid": case.user_uuid,
            "assay_uuid": case.assay_uuid,
            "input": {
                "contrast_pre_path": case.input.contrast_pre_path if case.input else None,
                "contrast_1_path": case.input.contrast_1_path if case.input else None,
                "contrast_2_path": case.input.contrast_2_path if case.input else None,
                "contrast_3_path": case.input.contrast_3_path if case.input else None,
                "contrast_4_path": case.input.contrast_4_path if case.input else None,
                "registration_pre_path": case.input.registration_pre_path if case.input else None,
                "registration_1_path": case.input.registration_1_path if case.input else None,
                "registration_2_path": case.input.registration_2_path if case.input else None,
                "registration_3_path": case.input.registration_3_path if case.input else None,
                "registration_4_path": case.input.registration_4_path if case.input else None,
                "model_predicted_nii_path": case.input.model_predicted_nii_path if case.input else None,
                "researcher_manual_nii_path": case.input.researcher_manual_nii_path if case.input else None,
            },
            "output": {
                "mask_meta_json_path": case.output.mask_meta_json_path if case.output else None,
                "mask_meta_json_size": case.output.mask_meta_json_size if case.output else None,
                "clinician_validated_nii_path": case.output.clinician_validated_nii_path if case.output else None,
                "clinician_validated_nii_size": case.output.clinician_validated_nii_size if case.output else None,
                "mask_glb_path": case.output.mask_glb_path if case.output else None,
                "mask_glb_size": case.output.mask_glb_size if case.output else None,
                "validate_json": validate_json_data,
            }
        })
    return result


@app.get("/api/test")
async def test():
    blob_content = b"This is the content of the blob."
    blob_stream = io.BytesIO(blob_content)

    # Create the response
    response = Response(content=blob_stream.getvalue())

    # Set the headers to indicate the file type and disposition
    response.headers["Content-Type"] = "application/octet-stream"
    response.headers["Content-Disposition"] = "attachment; filename=blob_file.txt"

    # Add the string data to the response headers
    response.headers["x-file-name"] = "This is a custom string."

    return response


if __name__ == '__main__':
    # uvicorn.run(app)
    uvicorn.run(app, port=8082)
