/**
 * Coordinate Transform Composable
 *
 * @description Handles NRRD coordinate transformations:
 * - Stores NRRD origin, spacing, bias, dimensions
 * - Converts between pixel and mm coordinates
 * - Computes corrected origin for model positioning
 *
 * Coordinate formulas:
 * - pixel / spacing = mm
 * - mm * spacing = pixel
 *
 * @module composables/right-panel/useCoordinateTransform
 */
import { ref, type Ref } from "vue";
import * as THREE from "three";

/**
 * Composable for coordinate transformations
 */
export function useCoordinateTransform() {
    /** NRRD image origin in mm */
    const nrrdOrigin = ref<number[]>([]);
    /** NRRD voxel spacing */
    const nrrdSpacing = ref<number[]>([]);
    /** NRRD RAS dimensions in mm */
    const nrrdRas = ref<number[]>([]);
    /** NRRD dimensions in pixels */
    const nrrdDimensions = ref<number[]>([]);
    /** NRRD bias for centering models in Three.js */
    const nrrdBias = ref<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
    /** Corrected origin = origin + bias */
    const correctedOrigin = ref<number[]>([0, 0, 0]);

    /**
     * Updates coordinate data from NRRD load
     */
    function updateFromNrrdData(data: {
        origin: number[];
        spacing: number[];
        ras: number[];
        dimensions: number[];
        bias: { x: number; y: number; z: number };
        correctedOrigin: number[];
    }) {
        nrrdOrigin.value = data.origin;
        nrrdSpacing.value = data.spacing;
        nrrdRas.value = data.ras;
        nrrdDimensions.value = data.dimensions;
        nrrdBias.value = new THREE.Vector3(data.bias.x, data.bias.y, data.bias.z);
        correctedOrigin.value = data.correctedOrigin;
    }

    /**
     * Converts pixel position to mm
     */
    function pixelToMm(pixel: number[], axis: 0 | 1 | 2): number {
        return pixel[axis] / nrrdSpacing.value[axis];
    }

    /**
     * Converts mm position to pixel
     */
    function mmToPixel(mm: number, axis: 0 | 1 | 2): number {
        return mm * nrrdSpacing.value[axis];
    }

    /**
     * Applies bias to position
     */
    function applyBias(position: THREE.Vector3): THREE.Vector3 {
        return position.clone().add(nrrdBias.value);
    }

    return {
        nrrdOrigin,
        nrrdSpacing,
        nrrdRas,
        nrrdDimensions,
        nrrdBias,
        correctedOrigin,
        updateFromNrrdData,
        pixelToMm,
        mmToPixel,
        applyBias,
    };
}
