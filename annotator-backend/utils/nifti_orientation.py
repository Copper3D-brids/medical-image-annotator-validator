import SimpleITK as sitk
from pathlib import Path


def convert_lps_to_rai(lps_path: str, rai_path: str) -> int:
    """
    Convert a NIfTI file from LPS orientation to RAI orientation.

    Uses SimpleITK DICOMOrientImageFilter which correctly handles
    direction cosines, spacing, and origin transformations.

    Returns the file size of the written RAI file.
    """
    img = sitk.ReadImage(lps_path)

    orient_filter = sitk.DICOMOrientImageFilter()
    orient_filter.SetDesiredCoordinateOrientation('RAI')
    rai_img = orient_filter.Execute(img)

    sitk.WriteImage(rai_img, rai_path)
    return Path(rai_path).stat().st_size
