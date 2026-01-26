<template>
  <div>
    <Switcher
      :title="'3D Model'"
      :label="switchModelLabel"
      :disabled="modelDisabled"
      v-model:controller="modelState"
      @toggleUpdate="toggle3DModel"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Right Panel Control Component
 *
 * @description Provides toggle control for 3D model visibility in the right panel.
 * Enables users to show/hide the 3D breast model during annotation.
 *
 * @listens Segmentation:FinishLoadAllCaseImages - Enables model toggle after images load
 * @emits Common:ToggleRightModelVisibility - Emitted to show/hide 3D model
 */
import Switcher from "@/components/common/Switcher.vue";
import { ref, onMounted, onUnmounted } from "vue";
import emitter from "@/plugins/custom-emitter";

/** Current 3D model visibility state */
const modelState = ref(true);

/** Whether model toggle is disabled (until images are loaded) */
const modelDisabled = ref(true)

/** Label for model visibility switch */
const switchModelLabel = ref("show");


onMounted(() => {
  manageEmitters();
});

/**
 * Registers event listeners.
 */
function manageEmitters() {
  emitter.on("Segmentation:FinishLoadAllCaseImages", emitterOnFinishLoadAllCaseImages)
}

/**
 * Enables model toggle control after case images finish loading.
 */
const emitterOnFinishLoadAllCaseImages = () => {
  modelDisabled.value = false;
}

/**
 * Toggles 3D model visibility and emits event to right panel core.
 *
 * @param value - New visibility state (true = show, false = hide)
 */
function toggle3DModel(value: boolean) {
  switchModelLabel.value = switchModelLabel.value === "show" ? "hide" : "show";
  emitter.emit("Common:ToggleRightModelVisibility", value);
}

/**
 * Cleanup: Remove event listeners on unmount.
 */
onUnmounted(() => {
  emitter.off("Segmentation:FinishLoadAllCaseImages", emitterOnFinishLoadAllCaseImages)
})
</script>

<style scoped></style>
  