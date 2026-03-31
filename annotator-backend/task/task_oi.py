from utils import convert_to_nii_sigel_channel, tools, convert
from utils.ws_manager import manager
from utils.setup import TumourData
import io
import asyncio
from models.db_model import SessionLocal, Case, CaseInput, CaseOutput
from pathlib import Path


def obj_converter(case_id: str, layer_id: str = "layer3"):
    """
    Legacy OBJ converter — redirects to GLTF conversion.
    OBJ format is no longer used in the validator variant.
    """
    print(f"OBJ conversion requested for case {case_id}, redirecting to GLTF")
    gltf_converter(case_id)


async def notify_frontend(case_id: str):
    """Send completion notification to the connected frontend via WebSocket."""
    await manager.send_notification(case_id, {
        "status": "complete",
        "case_id": case_id,
        "action": "reload_obj",
        "volume": TumourData.volume
    })
    print(f"Sent notification to frontend for case {case_id}")


def gltf_converter(case_id: str, layer_id: str = None):
    """
    Convert clinician_validated_nii to GLTF 3D mesh format with channel-specific colors.

    Uses convert_nii_to_gltf with default clinician_validated_nii_path lookup.

    :param case_id: ID of the case to process
    :param layer_id: Ignored in validator variant (always uses clinician_validated_nii)
    """
    with SessionLocal() as session:
        case_output = session.query(CaseOutput).filter(CaseOutput.case_id == case_id).first()  # type: ignore

        assert isinstance(case_output, CaseOutput)

        print(f"Starting GLTF conversion of clinician_validated_nii for case {case_id}")

        # Convert NIfTI to GLTF (defaults to clinician_validated_nii_path when layer_id=None)
        glb_path = convert.convert_nii_to_gltf(case_output)

        if glb_path:
            print(f"GLTF conversion complete for case {case_id}")
            print(f"GLTF file created at: {glb_path}")

            session.commit()
            session.refresh(case_output)

            asyncio.run(notify_frontend_gltf(case_id, str(glb_path)))
        else:
            print(f"GLTF conversion failed for case {case_id}: No mask data found")

            # Clear GLB file when there's no data
            if case_output.mask_glb_path:
                glb_path_file = Path(case_output.mask_glb_path)
                if glb_path_file.exists():
                    glb_path_file.write_bytes(b"")
                    case_output.mask_glb_size = 0

            session.commit()
            session.refresh(case_output)

            asyncio.run(notify_frontend_gltf_error(case_id, "clinician_validated", "No mask data to convert"))


async def notify_frontend_gltf(case_id: str, gltf_path: str):
    """Send GLTF completion notification to the connected frontend via WebSocket."""
    await manager.send_notification(case_id, {
        "status": "complete",
        "case_id": case_id,
        "action": "reload_gltf",
        "gltf_path": gltf_path,
        "volume": TumourData.volume
    })
    print(f"Sent GLTF notification to frontend for case {case_id}")


async def notify_frontend_gltf_error(case_id: str, layer_id: str, error_message: str):
    """Send GLTF error notification to the connected frontend via WebSocket."""
    await manager.send_notification(case_id, {
        "status": "error",
        "case_id": case_id,
        "action": "gltf_conversion_error",
        "layer_id": layer_id,
        "error": error_message
    })
    print(f"Sent GLTF error notification to frontend for case {case_id}: {error_message}")

