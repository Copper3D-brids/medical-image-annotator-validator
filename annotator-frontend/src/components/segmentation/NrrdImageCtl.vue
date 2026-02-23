<template>
  <v-list-group value="Cases" class="guide-cases-overall">
    <template v-slot:activator="{ props }">
      <v-list-item
        v-bind="props"
        color="nav-success"
        prepend-icon="mdi-image"
        title="Cases Select"
      ></v-list-item>
    </template>

      <v-select
      class="mx-4"
      :items="allCasesDetails?.names"
      density="comfortable"
      label="Cases"
      variant="outlined"
      :autofocus="true"
      :disabled="disableSelectCase"
      @update:modelValue="onCaseSwitched"
    ></v-select>

    <v-select
      class="mx-4"
      v-model="slectedContrast"
      :items="contrastValue"
      :disabled="disableSelectContrast"
      chips
      label="Contrast Select"
      variant="outlined"
      multiple
      @update:modelValue="onContrastSelected"
    ></v-select>

    <Switcher
      v-model:controller="switchRegisted"
      :title="switchTitle"
      :disabled="switchDisabled"
      :label="switchLable"
      :loading="switchLoading"
      @toggleUpdate="toggleRegisterChanged"
      class="guide-case-switch"
    />
  </v-list-group>
</template>

<script setup lang="ts">
/**
 * NRRD Image Control Component
 *
 * @description Provides case and contrast image selection controls:
 * - Case selector dropdown: Select which patient case to view
 * - Contrast selector: Multi-select for which contrast phases to display
 * - Register toggle: Switch between registered and origin images
 *
 * @listens Segmentation:FinishLoadAllCaseImages - Re-enables controls after loading
 * @listens Segmentation:ContrastImageStates - Updates contrast selection options
 *
 * @emits Segementation:CaseSwitched - Emitted when user selects a different case
 * @emits Segmentation:ContrastChanged - Emitted when contrast selection changes
 * @emits Segmentation:RegisterImageChanged - Emitted when register toggle changes
 */
import Switcher from "@/components/common/Switcher.vue";
import { ref, onMounted, onUnmounted, onBeforeMount, watch } from "vue";
import { useSegmentationCasesStore } from "@/store/app";
import { storeToRefs } from "pinia";
import emitter from "@/plugins/custom-emitter";
import { useAppConfig } from "@/plugins/hooks/config";
import { useCases } from "@/plugins/hooks/cases";

/** Type for tracking selected state of each contrast phase */
type selecedType = {
  [key: string]: boolean;
};

/** Type for result object emitted on contrast change */
type resultType = {
  [key: string]: any;
};

const { config } = useAppConfig();
const { getCasesInfo } = useCases();

/** All cases details and plugin ready flag from Pinia store */
const { allCasesDetails, isPluginReady } = storeToRefs(useSegmentationCasesStore());

/** Whether case selector is disabled (during loading) */
const disableSelectCase = ref(false);

/** Whether contrast selector is disabled */
const disableSelectContrast = ref(true);

/** Available contrast phase options */
const contrastValue = ref<string[]>([]);

/** Currently selected contrast phases */
const slectedContrast = ref<string[]>([]);

/**
 * Maps contrast names to their display order.
 * Used for sorting selected contrasts in consistent order.
 */
const contrastOrder: any = {
  pre: 0,
  contrast1: 1,
  contrast2: 2,
  contrast3: 3,
  contrast4: 4,
};

/** Whether showing registered images (true) or origin images (false) */
const switchRegisted = ref<boolean>(true);

/** Title for register/origin switcher */
const switchTitle = ref<string>("Register Images");

/** Loading state for register switch */
const switchLoading = ref<boolean | string>(false);

/** Whether register switch is disabled */
const switchDisabled = ref<boolean>(true);

/** Label for register switch */
const switchLable = ref<"on" | "off">("on");

/** Tracks selected state for each contrast phase */
let contrastState: selecedType;

onBeforeMount(() => {
  if (isPluginReady.value) {
    getCasesInfo(config!);
  } else {
    const stopWatch = watch(isPluginReady, (ready) => {
      if (ready) {
        getCasesInfo(config!);
        stopWatch();
      }
    });
  }
});

onMounted(() => {
  manageEmitters();
});


function manageEmitters() {
  emitter.on("Segmentation:FinishLoadAllCaseImages", emitterOnFinishLoadAllCaseImages);
  emitter.on("Segmentation:ContrastImageStates", emitterOnContrastImageStates);
}

const emitterOnFinishLoadAllCaseImages =  () => {
  disableSelectCase.value = false;
  switchDisabled.value = false;
  switchLoading.value = false;
}
const emitterOnContrastImageStates = (contrastStates:{[key:string]:boolean}) => {
  slectedContrast.value = [];
  contrastState = contrastStates as selecedType;
  contrastValue.value = Object.keys(contrastState);
  for (const key in contrastState) {
    if (contrastState.hasOwnProperty(key)) {
      if (contrastState[key]) {
        slectedContrast.value.push(key);
      }
    }
  }
  disableSelectContrast.value = false;
}

function onCaseSwitched(casename: any) {
  disableSelectCase.value = true;
  disableSelectContrast.value = true;
  switchDisabled.value = true;
  switchLable.value = "on";
  switchRegisted.value = true;
  switchLoading.value = "warning";
  emitter.emit("Segementation:CaseSwitched", casename);
}

function onContrastSelected(contrasts: string[]) {
  let result: resultType = {};
  sort(slectedContrast.value);
  for (const key in contrastState) {
    if (contrastState.hasOwnProperty(key)) {
      if (contrasts.includes(key)) {
        if (!contrastState[key]) {
          // add a contrast, set its state to ture
          contrastState[key] = true;
          result["effect"] = key;
          result["order"] = contrastOrder[key];
          result["contrastState"] = true;
          emitter.emit("Segmentation:ContrastChanged", result);
        }
      } else {
        if (contrastState[key]) {
          // remove a contrast, set its state to ture
          contrastState[key] = false;
          result["effect"] = key;
          result["order"] = contrastOrder[key];
          result["contrastState"] = false;
          emitter.emit("Segmentation:ContrastChanged", result);
        }
      }
    }
  }
}

function toggleRegisterChanged(value: boolean) {
  switchLable.value = switchLable.value === "on" ? "off" : "on";
  switchDisabled.value = true;
  switchLoading.value = "warning";
  emitter.emit("Segmentation:RegisterImageChanged", value);
}

const sort = (arr: string[]) => {
  arr.sort((a, b) => {
    return contrastOrder[a] - contrastOrder[b];
  });
};

onUnmounted(() => {
  emitter.off("Segmentation:FinishLoadAllCaseImages", emitterOnFinishLoadAllCaseImages);
  emitter.off("Segmentation:ContrastImageStates", emitterOnContrastImageStates);
});

</script>

<style scoped>
</style>
