cwlVersion: v1.2
class: CommandLineTool
baseCommand: [GUI]

label: "Medical Image Annotator"
doc: |
  This tool takes an input NRRD medical image and generates segmentation mask files
  in both NIfTI (.nii) and JSON (.json) formats.

inputs:
  nrrd_file:
    type: File
    label: "Input NRRD file"
    doc: "Medical image file in NRRD format."
    inputBinding:
      position: 1
  mask_layer1_nii:
    type: File
    label: "Input mask layer1 nii file"
    doc: "Medical image file in nii.gz format."
    inputBinding:
      position: 2
  mask_layer2_nii:
    type: File
    label: "Input mask layer2 nii file"
    doc: "Medical image file in nii.gz format."
    inputBinding:
      position: 3
  mask_layer3_nii:
    type: File
    label: "Input mask layer3 nii file"
    doc: "Medical image file in nii.gz format."
    inputBinding:
      position: 4
  mask_layer3_nii:
    type: File
    label: "Input mask layer3 nii file"
    doc: "Medical image file in nii.gz format."
    inputBinding:
      position: 4

outputs:
  mask_layer1_nii:
    type: File
    label: "Input mask layer1 nii file"
    doc: "Medical image file in nii.gz format."
    inputBinding:
      position: 2
  mask_layer2_nii:
    type: File
    label: "Input mask layer2 nii file"
    doc: "Medical image file in nii.gz format."
    inputBinding:
      position: 3
  mask_layer3_nii:
    type: File
    label: "Input mask layer3 nii file"
    doc: "Medical image file in nii.gz format."
    inputBinding:
      position: 4
  mask_layer3_nii:
    type: File
    label: "Input mask layer3 nii file"
    doc: "Medical image file in nii.gz format."
    inputBinding:
      position: 4
  validate_json:
    type: File
    label: "Segmentation mask metadata in JSON format"
    outputBinding:
      glob: "validate_json.json"

stdout: output.txt
