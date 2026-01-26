/**
 * Right Panel Distance Calculation Composable
 *
 * @description Handles 3D distance calculations in right panel:
 * - KD-tree for skin/ribcage nearest neighbor search
 * - Nipple distance and clock position calculation
 * - Panel info display updates
 *
 * @module composables/right-panel/useRightDistanceCalculation
 */
import { ref, type Ref } from "vue";
import * as THREE from "three";
import createKDTree from "copper3d-tree";
import { getClosestNipple } from "@/plugins/view-utils/tools";

/**
 * Interface for distance calculation dependencies
 */
export interface IRightDistanceDeps {
    copperScene: Ref<{ scene: THREE.Scene } | undefined>;
}

/**
 * Composable for right panel distance calculations
 */
export function useRightDistanceCalculation(deps: IRightDistanceDeps) {
    const { copperScene } = deps;

    /** Tumour volume in cm³ */
    const tumourVolume = ref(0);
    /** Tumour extent */
    const tumourExtent = ref(0);
    /** Distance to skin */
    const skinDist = ref("0");
    /** Distance to ribcage */
    const ribDist = ref("0");
    /** Distance to nipple with L/R indicator */
    const nippleDist = ref("L: 0");
    /** Clock position relative to nipple */
    const nippleClock = ref("@ 0:0");

    /** Central limit for nipple distance */
    const nippleCentralLimit = 10;

    // KD-trees for nearest neighbor search
    let skinTree: any;
    let ribTree: any;
    let processedSkinPoints: number[][] = [];
    let processedRibPoints: number[][] = [];

    // Nipple positions
    let nippleTl: number[] = [];
    let nippleTr: number[] = [];

    // Position references
    const tumourPosition = ref<THREE.Vector3 | undefined>(undefined);
    const skinPosition = new THREE.Vector3(0, 0, 0);
    const ribPosition = new THREE.Vector3(0, 0, 0);

    // Sphere meshes for visualization
    const commGeo = new THREE.SphereGeometry(3, 32, 16);
    const skinSphere = new THREE.Mesh(
        commGeo,
        new THREE.MeshBasicMaterial({ color: "#FFFF00" })
    );
    const ribSphere = new THREE.Mesh(
        commGeo,
        new THREE.MeshBasicMaterial({ color: "#00E5FF" })
    );
    skinSphere.renderOrder = 0;
    ribSphere.renderOrder = 0;

    /**
     * Initializes KD-trees from point clouds
     */
    function initKDTrees(
        skinPoints: number[][],
        ribPoints: number[][],
        bias: THREE.Vector3
    ) {
        processedSkinPoints = skinPoints.map((p) => [
            p[0] + bias.x,
            p[1] + bias.y,
            p[2] + bias.z,
        ]);
        processedRibPoints = ribPoints.map((p) => [
            p[0] + bias.x,
            p[1] + bias.y,
            p[2] + bias.z,
        ]);
        skinTree = createKDTree(processedSkinPoints);
        ribTree = createKDTree(processedRibPoints);
    }

    /**
     * Sets nipple positions
     */
    function setNipplePositions(left: number[], right: number[]) {
        nippleTl = left;
        nippleTr = right;
    }

    /**
     * Displays skin and ribcage spheres at nearest points
     */
    function displaySkinAndRib(tumourPos: number[]) {
        if (!skinTree || !ribTree || !copperScene.value) return;

        const skinIdx = skinTree.nn(tumourPos);
        const ribIdx = ribTree.nn(tumourPos);

        skinSphere.position.set(
            processedSkinPoints[skinIdx][0],
            processedSkinPoints[skinIdx][1],
            processedSkinPoints[skinIdx][2]
        );
        ribSphere.position.set(
            processedRibPoints[ribIdx][0],
            processedRibPoints[ribIdx][1],
            processedRibPoints[ribIdx][2]
        );
        skinPosition.set(
            processedSkinPoints[skinIdx][0],
            processedSkinPoints[skinIdx][1],
            processedSkinPoints[skinIdx][2]
        );
        ribPosition.set(
            processedRibPoints[ribIdx][0],
            processedRibPoints[ribIdx][1],
            processedRibPoints[ribIdx][2]
        );

        copperScene.value.scene.add(skinSphere, ribSphere);
    }

    /**
     * Updates panel info with distances
     */
    function updateTumourPanelInfo(tPosition: THREE.Vector3) {
        const nippleLeft = new THREE.Vector3(nippleTl[0], nippleTl[1], nippleTl[2]);
        const nippleRight = new THREE.Vector3(nippleTr[0], nippleTr[1], nippleTr[2]);
        const clockInfo = getClosestNipple(nippleLeft, nippleRight, tPosition);

        nippleDist.value = clockInfo.dist;

        if (clockInfo.radial_distance < nippleCentralLimit) {
            nippleClock.value = "central";
        } else {
            nippleClock.value = "@ " + clockInfo.timeStr;
        }

        if (skinTree && ribTree) {
            skinDist.value = tPosition.distanceTo(skinPosition).toFixed(0);
            ribDist.value = tPosition.distanceTo(ribPosition).toFixed(0);
        }
    }

    /**
     * Displays and calculates all distances from tumour
     */
    function displayAndCalculateNSR() {
        if (tumourPosition.value) {
            if (skinTree && ribTree) {
                displaySkinAndRib([
                    tumourPosition.value.x,
                    tumourPosition.value.y,
                    tumourPosition.value.z,
                ]);
            }
            updateTumourPanelInfo(tumourPosition.value);
        }
    }

    /**
     * Resets all panel values
     */
    function initPanelValue() {
        tumourVolume.value = 0;
        tumourExtent.value = 0;
        skinDist.value = "0";
        ribDist.value = "0";
        nippleDist.value = "L 0";
        nippleClock.value = "@ 0:0";
    }

    /**
     * Cleans up KD-trees
     */
    function cleanup() {
        if (skinTree) skinTree.dispose();
        if (ribTree) ribTree.dispose();
        skinTree = undefined;
        ribTree = undefined;
        initPanelValue();
    }

    return {
        tumourVolume,
        tumourExtent,
        skinDist,
        ribDist,
        nippleDist,
        nippleClock,
        tumourPosition,
        skinSphere,
        ribSphere,
        initKDTrees,
        setNipplePositions,
        displaySkinAndRib,
        updateTumourPanelInfo,
        displayAndCalculateNSR,
        initPanelValue,
        cleanup,
    };
}
