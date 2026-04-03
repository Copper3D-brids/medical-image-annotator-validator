cwlVersion: v1.2
class: CommandLineTool
baseCommand: [GUI]

label: "Medical Image Annotator Validator"
doc: |
  A clinician-facing validation tool for AI-predicted medical image segmentations.
  Takes multi-contrast medical images, an AI-predicted segmentation mask, and a
  researcher-drawn manual mask as inputs. Outputs a clinician-validated NIfTI mask,
  mask metadata (JSON), a 3D mesh (GLB), and a validation decision (JSON).

inputs:
  contrast_pre:
    type: File
    label: "Pre-contrast image"
    doc: "Pre-contrast medical image file."
    inputBinding:
      position: 1
  contrast_1:
    type: File?
    label: "Contrast phase 1 image"
    doc: "Contrast phase 1 medical image file."
    inputBinding:
      position: 2
  contrast_2:
    type: File?
    label: "Contrast phase 2 image"
    doc: "Contrast phase 2 medical image file."
    inputBinding:
      position: 3
  contrast_3:
    type: File?
    label: "Contrast phase 3 image"
    doc: "Contrast phase 3 medical image file."
    inputBinding:
      position: 4
  contrast_4:
    type: File?
    label: "Contrast phase 4 image"
    doc: "Contrast phase 4 medical image file."
    inputBinding:
      position: 5
  registration_pre:
    type: File?
    label: "Pre-registration image"
    doc: "Pre-registration medical image file."
    inputBinding:
      position: 6
  registration_1:
    type: File?
    label: "Registration phase 1 image"
    doc: "Registration phase 1 medical image file."
    inputBinding:
      position: 7
  registration_2:
    type: File?
    label: "Registration phase 2 image"
    doc: "Registration phase 2 medical image file."
    inputBinding:
      position: 8
  registration_3:
    type: File?
    label: "Registration phase 3 image"
    doc: "Registration phase 3 medical image file."
    inputBinding:
      position: 9
  registration_4:
    type: File?
    label: "Registration phase 4 image"
    doc: "Registration phase 4 medical image file."
    inputBinding:
      position: 10
  model_predicted_nii:
    type: File
    label: "AI model predicted segmentation mask"
    doc: "AI-predicted segmentation mask in NIfTI (.nii.gz) format."
    inputBinding:
      position: 11
  researcher_manual_nii:
    type: File?
    label: "Researcher manual segmentation mask"
    doc: "Researcher-drawn manual segmentation mask in NIfTI (.nii.gz) format."
    inputBinding:
      position: 12

outputs:
  mask_meta_json:
    type: File
    label: "Mask metadata JSON"
    doc: "Segmentation mask metadata in JSON format."
    outputBinding:
      glob: "mask_meta_json.json"
  clinician_validated_nii:
    type: File
    label: "Clinician validated segmentation mask"
    doc: "Clinician-validated segmentation mask in NIfTI (.nii.gz) format."
    outputBinding:
      glob: "clinician_validated_nii.nii.gz"
  mask_glb:
    type: File
    label: "3D mesh of segmentation mask"
    doc: "3D mesh representation of the segmentation mask in GLB format."
    outputBinding:
      glob: "mask_glb.glb"
  validate_json:
    type: File
    label: "Validation decision JSON"
    doc: "Validation decision record (no_need_for_correction / corrected / reject) in JSON format."
    outputBinding:
      glob: "validate_json.json"

stdout: output.txt
