<template>
  <div>
    <v-container>
      <v-row style="height: 60px">
        <v-col cols="7" class="d-flex justify-start align-center">
          {{ props.title }}
        </v-col>
        <v-col cols="5" class="d-flex justify-center align-center">
          <v-switch
            v-model="controller"
            color="switcher"
            :loading="loading"
            :disabled="disabled"
            :label="label"
            hide-details
            class="ml-5"
            @update:model-value="toggleUpdate"
          ></v-switch>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
/**
 * Switcher Component
 *
 * @description Reusable toggle switch component with title label.
 * Uses Vuetify v-switch with two-way binding support.
 *
 * @prop {string} title - Label text displayed next to switch
 * @prop {boolean} controller - Current switch state (v-model supported)
 * @prop {boolean|string} loading - Loading state for switch
 * @prop {boolean} disabled - Whether switch is disabled
 * @prop {string} label - On/Off label text
 *
 * @emits toggleUpdate - Emitted when switch value changes
 * @emits update:controller - Emitted for v-model support
 */
import { ref, computed } from "vue";

/**
 * Component props interface
 */
type Props = {
  title: string;
  controller: boolean;
  loading?: string | boolean;
  disabled?: boolean;
  label?: string;
};

let props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  controller: false,
  label: "off",
});

const emit = defineEmits(["toggleUpdate", "update:controller"]);

/**
 * Computed property for two-way binding of switch state.
 * Gets value from props, sets via emit for v-model support.
 */
const controller = computed({
  get() {
    return props.controller;
  },
  set(val: boolean) {
    emit("update:controller", val);
  },
});

/**
 * Handles switch toggle and emits update event.
 */
const toggleUpdate = (value: any) => {
  emit("toggleUpdate", value);
};
</script>

<style scoped></style>
