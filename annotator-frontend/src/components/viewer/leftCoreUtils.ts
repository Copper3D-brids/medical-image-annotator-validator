import * as Copper from "copper3d";

/**
 * Toggles the loading animation visibility.
 *
 * @param loadingContainer - The loading animation container element
 * @param progress - The progress text element
 * @param status - Display status: "flex" to show, "none" to hide
 * @param text - Optional text to display in progress element
 */
export const switchAnimationStatus = (loadingContainer: HTMLDivElement, progress: HTMLDivElement, status: "flex" | "none", text?: string) => {
    loadingContainer!.style.display = status;
    !!text && (progress!.innerText = text);
};

/**
 * Assigns orientation names to loaded NRRD mesh objects.
 * Adds " sagittal", " coronal", " axial" suffixes to mesh names.
 *
 * @param nrrdMesh - The loaded NRRD mesh object containing x, y, z meshes
 * @param name - Base name to prepend to orientation suffix
 */
export function addNameToLoadedMeshes(nrrdMesh: Copper.nrrdMeshesType, name: string) {
    nrrdMesh.x.name = name + " sagittal";
    nrrdMesh.y.name = name + " coronal";
    nrrdMesh.z.name = name + " axial";
}