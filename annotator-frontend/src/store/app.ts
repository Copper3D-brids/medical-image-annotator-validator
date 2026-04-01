import { defineStore } from "pinia";
import { ref } from "vue";
import {
  useNrrdCaseNames,
} from "@/plugins/api/index";
import {
  INrrdCaseNames,
  IAuth,
  IValidateStatus,
} from "@/models";
import { getValidateStatus } from "@/plugins/api/validate";

export const useSegmentationCasesStore = defineStore("allSegmentationCasesDetails", () => {
  const allCasesDetails = ref<INrrdCaseNames>();
  const isPluginReady = ref(false);
  const currentCaseId = ref<number | string | null>(null);
  const currentCaseValidateStatus = ref<IValidateStatus | null>(null);

  const getAllCasesDetails = async (auth: IAuth) => {
    allCasesDetails.value = await useNrrdCaseNames(auth);
  };

  const setPluginReady = () => {
    isPluginReady.value = true;
  };

  const fetchValidateStatus = async (caseId: number | string) => {
    try {
      currentCaseId.value = caseId;
      currentCaseValidateStatus.value = await getValidateStatus(caseId);
    } catch (e) {
      console.error("[store] Failed to fetch validate status:", e);
      currentCaseValidateStatus.value = null;
    }
  };

  const setValidateStatus = (status: IValidateStatus) => {
    currentCaseValidateStatus.value = status;
  };

  return {
    allCasesDetails,
    getAllCasesDetails,
    isPluginReady,
    setPluginReady,
    currentCaseId,
    currentCaseValidateStatus,
    fetchValidateStatus,
    setValidateStatus,
  };
});
