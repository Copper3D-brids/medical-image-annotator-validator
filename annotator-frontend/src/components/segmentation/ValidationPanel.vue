<template>
  <v-list-group value="Validation" class="guide-validation-panel">
    <template v-slot:activator="{ props }">
      <v-list-item
        v-bind="props"
        color="nav-success"
        prepend-icon="mdi-clipboard-check-outline"
        title="Case Validation"
      ></v-list-item>
    </template>

    <div class="validation-panel-content px-4 py-2">
      <!-- Navigation row -->
      <div class="d-flex justify-space-between align-center mb-3">
        <v-btn
          icon
          size="small"
          variant="outlined"
          :disabled="currentCaseIndex === 0"
          @click="onPrevious"
        >
          <v-icon>mdi-chevron-left</v-icon>
          <v-tooltip activator="parent" location="bottom">Previous Case</v-tooltip>
        </v-btn>

        <span class="text-body-2 text-medium-emphasis">
          Case {{ currentCaseIndex + 1 }} / {{ totalCases }}
        </span>

        <v-btn
          icon
          size="small"
          variant="outlined"
          :disabled="currentCaseIndex === totalCases - 1"
          @click="onNext"
        >
          <v-icon>mdi-chevron-right</v-icon>
          <v-tooltip activator="parent" location="bottom">Next Case</v-tooltip>
        </v-btn>
      </div>

      <!-- Validation action buttons -->
      <div class="d-flex flex-column ga-2">
        <v-btn
          :variant="isActive('no_need_for_correction') ? 'flat' : 'outlined'"
          :color="isActive('no_need_for_correction') ? 'success' : undefined"
          size="small"
          block
          @click="onValidate('no_need_for_correction')"
        >
          <v-icon start>mdi-check-circle-outline</v-icon>
          No Need For Correction
        </v-btn>

        <v-btn
          :variant="isActive('corrected') ? 'flat' : 'outlined'"
          :color="isActive('corrected') ? 'info' : undefined"
          size="small"
          block
          @click="onValidate('corrected')"
        >
          <v-icon start>mdi-pencil-outline</v-icon>
          Corrected
        </v-btn>

        <v-btn
          :variant="isActive('reject') ? 'flat' : 'outlined'"
          :color="isActive('reject') ? 'error' : undefined"
          size="small"
          block
          @click="onValidate('reject')"
        >
          <v-icon start>mdi-close-circle-outline</v-icon>
          Reject
        </v-btn>
      </div>
    </div>
  </v-list-group>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useSegmentationCasesStore } from "@/store/app";
import { updateValidateStatus } from "@/plugins/api/validate";
import { useToast } from "@/composables/useToast";
import emitter from "@/plugins/custom-emitter";

const store = useSegmentationCasesStore();
const { allCasesDetails, currentCaseValidateStatus, currentCaseId } = storeToRefs(store);
const toast = useToast();

const totalCases = computed(() => allCasesDetails.value?.names?.length ?? 0);

const currentCaseIndex = computed(() => {
  if (!allCasesDetails.value?.details || currentCaseId.value === null) return 0;
  const idx = allCasesDetails.value.details.findIndex(
    (d) => String(d.id) === String(currentCaseId.value)
  );
  return idx >= 0 ? idx : 0;
});

function isActive(action: string): boolean {
  if (!currentCaseValidateStatus.value) return false;
  return (currentCaseValidateStatus.value as any)[action] === true;
}

function isCurrentCaseFinished(): boolean {
  return currentCaseValidateStatus.value?.finished === true;
}

function onPrevious() {
  if (!isCurrentCaseFinished()) {
    toast.warning("Please complete the current case validation before navigating.");
    return;
  }
  if (!allCasesDetails.value?.names || currentCaseIndex.value <= 0) return;
  const prevName = allCasesDetails.value.names[currentCaseIndex.value - 1];
  emitter.emit("Segementation:CaseSwitched", prevName);
}

function onNext() {
  if (!isCurrentCaseFinished()) {
    toast.warning("Please complete the current case validation before navigating to the next case.");
    return;
  }
  if (!allCasesDetails.value?.names || currentCaseIndex.value >= totalCases.value - 1) return;
  const nextName = allCasesDetails.value.names[currentCaseIndex.value + 1];
  emitter.emit("Segementation:CaseSwitched", nextName);
}

async function onValidate(action: string) {
  if (currentCaseId.value === null) return;

  try {
    await updateValidateStatus(currentCaseId.value, action);

    // Update local state immediately
    store.setValidateStatus({
      no_need_for_correction: action === "no_need_for_correction",
      corrected: action === "corrected",
      reject: action === "reject",
      finished: true,
    });

    toast.success(`Case marked as: ${action.replace(/_/g, " ")}`);
  } catch (e) {
    console.error("[ValidationPanel] Failed to update validate status:", e);
    toast.error("Failed to update validation status.");
  }
}
</script>

<style scoped>
.validation-panel-content {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
