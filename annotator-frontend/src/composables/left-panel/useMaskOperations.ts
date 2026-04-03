/**
 * Mask Operations Composable
 *
 * @description Handles all mask-related operations for the left panel:
 * - Initializing mask data to backend
 * - Loading mask JSON from URL
 * - Setting mask data from backend
 * - Replacing/clearing mask data
 *
 * Phase 7: Added SegmentationManager data sync support
 *
 * @module composables/left-panel/useMaskOperations
 */
import { ref, type Ref } from "vue";
import * as Copper from "copper3d";
import {
    IStoredMasks,
    IReplaceMask,
    IToolMaskData,
    IDetails,
    INrrdCaseNames,
    ICaseUrls,
} from "@/models";
import { useReplaceMask, useClearMaskMesh, useInitMasks, useSaveMasks, useInitMaskLayers, useUpdateMaskMeta } from "@/plugins/api/index";
import { switchAnimationStatus } from "@/components/viewer/utils";
import emitter from "@/plugins/custom-emitter";
import { useNiftiVoxelData, useNiftiVoxelDataFromUrl } from "@/plugins/utils";
import { useToast } from "@/composables/useToast";

/**
 * Interface for mask operations dependencies
 */
export interface IMaskOperationsDeps {
    nrrdTools: Ref<Copper.NrrdTools | undefined>;
    loadingContainer: Ref<HTMLDivElement | undefined>;
    progress: Ref<HTMLDivElement | undefined>;
    loadBarMain: Ref<Copper.loadingBarType | undefined>;
    currentCaseDetail: Ref<IDetails | undefined>;
    currentCaseName: Ref<string>;
    allCasesDetails: Ref<INrrdCaseNames | undefined>;
    originUrls: ICaseUrls;
    regiterUrls: ICaseUrls;
}

/**
 * Composable for mask operations
 */
export function useMaskOperations(deps: IMaskOperationsDeps) {
    const {
        nrrdTools,
        loadingContainer,
        progress,
        loadBarMain,
        currentCaseDetail,
        currentCaseName,
        allCasesDetails,
        originUrls,
        regiterUrls,
    } = deps;

    const toast = useToast();

    /**
     * Phase 5: Sends initial empty mask layers to backend
     *
     * When a case has no existing mask data, initialize empty NIfTI files
     * for all three layers with the correct dimensions and metadata.
     */
    const sendInitMaskToBackend = async (layerId: string) => {
        console.log("sendInitMaskToBackend");

        const dimensions = nrrdTools.value!.getCurrentImageDimension();
        const voxelSpacing = nrrdTools.value!.getVoxelSpacing();
        const spaceOrigin = nrrdTools.value!.getSpaceOrigin();

        if (dimensions.length !== 3) {
            console.warn("Cannot initialize masks: dimensions not available");
            return;
        }

        const [width, height, depth] = dimensions;

        // Phase 5 Task 5.1: Create empty NIfTI files on backend
        const request = {
            caseId: currentCaseDetail.value!.id,
            layerId,
            dimensions: [width, height, depth] as [number, number, number],
            voxelSpacing: voxelSpacing as [number, number, number] | undefined,
            spaceOrigin: spaceOrigin as [number, number, number] | undefined,
        };

        const result = await useInitMaskLayers(request);

        if (result && result.success) {
            console.log(`Initialized ${result.layer_initialized} mask`);
        } else {
            console.error("Failed to initialize mask layers");
        }
    };

    /**
     * Validator 3-layer mask loading:
     *
     * - Layer 1 (Model Predicted): from input URL (read-only, never init)
     * - Layer 2 (Researcher Manual): from input URL (read-only, never init)
     * - Layer 3 (Clinician Validated): from output (editable, init if empty)
     */
    const setMaskData = async () => {
        const caseDetail = allCasesDetails.value?.details.find(
            (detail) => detail.name === currentCaseName.value
        );

        if (!caseDetail) return;

        switchAnimationStatus(loadingContainer.value!, progress.value!, "flex", "Loading mask layers...");

        try {
            const layerBuffers: Map<string, Uint8Array> = new Map();

            // Layer 1 (Model Predicted) — read-only input from MinIO proxy
            if (caseDetail.input.model_predicted_nii) {
                const voxels = await useNiftiVoxelDataFromUrl(caseDetail.input.model_predicted_nii);
                if (voxels) layerBuffers.set('layer1', voxels);
            }

            // Layer 2 (Researcher Manual) — read-only input from MinIO proxy
            if (caseDetail.input.researcher_manual_nii) {
                const voxels = await useNiftiVoxelDataFromUrl(caseDetail.input.researcher_manual_nii);
                if (voxels) layerBuffers.set('layer2', voxels);
            }

            // Layer 3 (Clinician Validated) — editable output, init if no data
            const hasLayer3 = Number(caseDetail.output.clinician_validated_nii_size || 0) > 0;
            if (hasLayer3) {
                const voxels = await useNiftiVoxelData(caseDetail.output.clinician_validated_nii_path!);
                if (voxels) layerBuffers.set('layer3', voxels);
            } else {
                await sendInitMaskToBackend("layer3");
            }

            if (layerBuffers.size > 0) {
                nrrdTools.value!.setMasksFromNIfTI(layerBuffers, loadBarMain.value);
            }

            // Update mask_meta_json with NRRD image metadata
            const dimensions = nrrdTools.value!.getCurrentImageDimension();
            const spacing = nrrdTools.value!.getVoxelSpacing();
            const origin = nrrdTools.value!.getSpaceOrigin();
            if (dimensions.length === 3) {
                await useUpdateMaskMeta(
                    caseDetail.id,
                    dimensions,
                    spacing ?? [1.0, 1.0, 1.0],
                    origin ?? [0.0, 0.0, 0.0]
                );
            }

            toast.success("Mask layers loaded successfully");
        } catch (e) {
            console.error("Failed to load mask layers:", e);
            toast.error(`Failed to load mask layers: ${(e as Error).message}`);
        }

        setTimeout(() => {
            switchAnimationStatus(loadingContainer.value!, progress.value!, "none");
        }, 1000);
    };

    /**
     * Handles mask data from tool events.
     *
     * Phase 1 Backend Sync: Now receives raw Uint8Array slice data from
     * MaskVolume instead of ImageData.  Sends the slice data along with
     * axis/index metadata so the backend can update the corresponding
     * NIfTI slice directly.
     */
    const getMaskData = async (res: IToolMaskData) => {
        const { sliceData, layerId, channelId, sliceIndex, axis, width, height, clearFlag } = res;
        const body: IReplaceMask = {
            caseId: currentCaseDetail.value!.id,
            sliceIndex,
            layerId,
            channelId,
            axis,
            sliceData: [...sliceData],
            width,
            height,
        };
        await useReplaceMask(body);
        if (clearFlag) {
            await useClearMaskMesh(currentCaseDetail.value!.id);
        }
    };

    /**
     * Handles layer volume clear notification
     *
     * Phase 3 Task 3.2: When clearActiveLayer is called on a layer,
     * notify the backend to clear that layer's NIfTI file.
     */
    const onClearLayerVolume = async (event: { layerId: string }) => {
        const { layerId } = event;
        console.log(`Phase 3: Layer ${layerId} volume cleared, notifying backend...`);

        // Clear the 3D mesh visualization
        await sendInitMaskToBackend(layerId);
    };

    /**
     * Saves masks and triggers model sync
     *
     * Converts the specified layer's NIfTI file to OBJ 3D mesh format.
     * The conversion runs as a background task on the backend.
     *
     * @param flag - Whether to proceed with save
     * @param layerId - Layer to convert ('layer1', 'layer2', or 'layer3'), defaults to 'layer3'
     */
    const onSaveMask = async (flag: boolean, layerId: 'layer1' | 'layer2' | 'layer3' = 'layer3') => {
        if (flag) {
            // Skip expensive hasLayerData check to avoid UI blocking
            // Backend will handle empty data gracefully
            switchAnimationStatus(
                loadingContainer.value!,
                progress.value!,
                "flex",
                `Converting ${layerId} to 3D mesh, please wait......`
            );

            const result = await useSaveMasks(currentCaseDetail.value!.id, layerId);

            switchAnimationStatus(loadingContainer.value!, progress.value!, "none");

            if (result && result.success) {
                console.log(`Successfully started conversion of ${layerId} to OBJ mesh`);
                emitter.emit("Segmentation:SyncTumourModelButtonClicked", true);
            } else {
                console.error(`Failed to convert ${layerId} to OBJ mesh`);
            }
        }
    };

    return {
        sendInitMaskToBackend,
        setMaskData,
        getMaskData,
        onClearLayerVolume,
        onSaveMask,
    };
}
