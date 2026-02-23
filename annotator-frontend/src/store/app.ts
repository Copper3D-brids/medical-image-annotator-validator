import { defineStore } from "pinia";
import { ref } from "vue";
import {
  useNrrdCaseNames,
} from "@/plugins/api/index";
import {
  INrrdCaseNames,
  IAuth
} from "@/models";
export const useSegmentationCasesStore = defineStore("allSegmentationCasesDetails", () => {
  const allCasesDetails = ref<INrrdCaseNames>();
  const isPluginReady = ref(false);

  const getAllCasesDetails = async (auth: IAuth) => {
    allCasesDetails.value = await useNrrdCaseNames(auth);
  };

  const setPluginReady = () => {
    isPluginReady.value = true;
  };

  return {
    allCasesDetails,
    getAllCasesDetails,
    isPluginReady,
    setPluginReady,
  };
});
