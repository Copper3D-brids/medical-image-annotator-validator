<template>
    <v-progress-linear
        color="nav-success-2"
        buffer-value="0"
        stream
    ></v-progress-linear>
    <v-radio-group
        class="radio-group guide-operation-functional-control"
        v-model="commFuncRadio"
        label="Functional Controller"
        :inline="true"
        :disabled="disabled"
        @update:modelValue="toggleFuncRadios"
    >
        <v-radio
        v-for="(item, idx) in radioValues"
        :key="idx"
        :label="item.label"
        :value="item.value"
        :color="item.color"
        ></v-radio>
    </v-radio-group>
    <v-progress-linear
        color="nav-success-2"
        buffer-value="0"
        stream
    ></v-progress-linear>
</template>

<script setup lang="ts">
/**
 * Functional Control Component
 *
 * @description Renders a radio button group for functional control selection.
 * Used for toggling between different operational modes in the application.
 *
 * @prop {boolean} disabled - Whether the radio group is disabled
 * @prop {RadioValue[]} radioValues - Array of radio button configurations
 *
 * @emits update:selectedRadio - Emitted when a radio button is selected
 * @emits update:commFuncRadios - Alternative event for radio selection
 */
import { ref, computed  } from "vue";

/** Type definition for radio button configuration */
type RadioValue = {
  label: string;
  value: string;
  color: string;
};

defineProps<{
  disabled: boolean,
  radioValues: RadioValue[],
}>();

const emit = defineEmits(["update:selectedRadio", "update:commFuncRadios"]);

/** Two-way bound model for current radio selection */
const commFuncRadio = defineModel()

/**
 * Handles radio button selection changes.
 * Emits the selected value and updates the model.
 *
 * @param value - The value of the selected radio button
 */
function toggleFuncRadios(value:any){
    emit("update:selectedRadio", value);
    commFuncRadio.value = value;
}

</script>

<style scoped>

</style>