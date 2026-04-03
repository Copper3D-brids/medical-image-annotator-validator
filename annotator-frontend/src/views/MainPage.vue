<template>
  <div class="main-page-wrapper">
    <LayoutTwoPanels ref="layoutTwoPanelsRef">
      <template #left>
        <LeftPanel :panel-width="layoutTwoPanelsRef?.leftPanelWidth" :panel-percent="layoutTwoPanelsRef?.percent"/>
      </template>
      <template #right>
        <RightPanel :panel-width="layoutTwoPanelsRef?.rightPanelWidth" :panel-percent="100 - layoutTwoPanelsRef?.percent"/>
      </template>
    </LayoutTwoPanels>

    <!-- Backend health check / processing modal -->
    <ConnectionModal
      :show="showModal"
      :attemptCount="attemptCount"
      :processingPhase="processingPhase"
      :currentStep="currentStep"
      :currentCase="currentCase"
      :totalCases="totalCases"
      :currentCaseIndex="currentCaseIndex"
      :progressPercent="progressPercent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeMount, onUnmounted } from "vue";
import LayoutTwoPanels from "@/components/viewer/LayoutTwoPanels.vue";
import LeftPanel from "./LeftPanelController.vue";
import RightPanel from "./RightPanelController.vue";
import ConnectionModal from "@/components/common/ConnectionModal.vue";
import { useToolConfigSSE, checkHealth } from "@/plugins/api/index";
import { useNrrdCaseNames } from "@/plugins/api/cases";
// need to remove this after testing
import toolConfig from "@/assets/tool_config.json";
import { useAppConfig } from "@/plugins/hooks/config";
import { useSegmentationCasesStore } from "@/store/app";
import { useToast } from "@/composables/useToast";
import emitter from "@/plugins/custom-emitter";
import type { ISSEProgressEvent, ISSECompleteEvent, ISSEErrorEvent } from "@/models";

const { setPluginReady } = useSegmentationCasesStore();
const toast = useToast();
const layoutTwoPanelsRef = ref<InstanceType<typeof LayoutTwoPanels>>();
// need to remove this after testing
localStorage.setItem("app_config", JSON.stringify(toolConfig));

const { config } = useAppConfig();

const backendReady = ref(false);
const attemptCount = ref(0);
let pollTimer: ReturnType<typeof setInterval> | null = null;

// SSE processing state
const processingPhase = ref<'health_check' | 'processing' | 'error'>('health_check');
const currentStep = ref('');
const currentCase = ref('');
const totalCases = ref(0);
const currentCaseIndex = ref(0);
const progressPercent = ref(0);

const showModal = computed(() => !backendReady.value);

// Step weights for progress calculation within a single case
const STEP_WEIGHTS: Record<string, number> = {
  resolving_inputs: 0.1,
  copy_nii: 0.4,
  convert_gltf: 0.3,
  create_validate_json: 0.05,
  update_db: 0.15,
};
const STEP_ORDER = ['resolving_inputs', 'copy_nii', 'convert_gltf', 'create_validate_json', 'update_db'];

function calcProgress(caseIdx: number, total: number, step: string): number {
  const caseFraction = 1 / total;
  const completedCases = (caseIdx - 1) * caseFraction;
  let stepProgress = 0;
  for (const s of STEP_ORDER) {
    if (s === step) break;
    stepProgress += STEP_WEIGHTS[s] || 0;
  }
  return Math.round((completedCases + caseFraction * stepProgress) * 100);
}

function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function runToolConfig() {
  if (!config) return;

  processingPhase.value = 'processing';

  await useToolConfigSSE(config, {
    onProgress(event: ISSEProgressEvent) {
      currentStep.value = event.step;
      currentCase.value = event.case;
      totalCases.value = event.total_cases;
      currentCaseIndex.value = event.current;
      progressPercent.value = calcProgress(event.current, event.total_cases, event.step);
    },
    async onComplete(event: ISSECompleteEvent) {
      if (event.status === "success") {
        progressPercent.value = 100;
        setPluginReady();

        // Auto-load first unfinished case
        await autoLoadFirstUnfinishedCase();

        backendReady.value = true;
      }
    },
    onError(event: ISSEErrorEvent) {
      processingPhase.value = 'error';
      currentStep.value = event.summary;
      toast.error(event.summary, 10000);
      if (event.detail) {
        toast.warning(event.detail, 12000);
      }
      console.error(`[tool-config] Step ${event.step}: ${event.summary}\n${event.detail}`);
    },
  });
}

async function autoLoadFirstUnfinishedCase() {
  if (!config) return;

  try {
    const auth = {
      user_uuid: config.user_info.uuid,
      assay_uuid: config.assay_info.uuid,
    };
    const casesData = await useNrrdCaseNames(auth);

    if (!casesData?.details?.length) return;

    // Find first case where validate_json.finished === false
    const firstUnfinished = casesData.details.find((d: any) => {
      const vj = d.output?.validate_json;
      return !vj || vj.finished === false;
    });

    const targetCase = firstUnfinished?.name ?? casesData.names[0];

    await nextTick();
    emitter.emit("Segementation:CaseSwitched", targetCase);
  } catch (e) {
    console.error("[auto-load] Failed to find first unfinished case:", e);
  }
}

async function pollHealth() {
  attemptCount.value += 1;
  try {
    const res = await checkHealth();
    if (res.status === "ok") {
      stopPolling();
      runToolConfig();
    }
  } catch {
    // backend not ready yet, keep polling
  }
}

onBeforeMount(() => {
  pollTimer = setInterval(pollHealth, 2000);
  pollHealth();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.main-page-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
