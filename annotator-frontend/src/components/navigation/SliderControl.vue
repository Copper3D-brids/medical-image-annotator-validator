<template>
    <!-- Slider Controls -->
    <v-progress-linear
        color="nav-success"
        buffer-value="0"
        stream
    ></v-progress-linear>
    <v-radio-group
        class="radio-group guide-operation-slider-control"
        v-model="sliderRadio"
        label="Slider Controller"
        :inline="true"
        :disabled="disabled"
        @update:modelValue="toggleSliderRadios"
    >
        <v-radio
        v-for="(item, idx) in sliderRadioValues"
        :key="idx"
        :label="item.label"
        :value="item.value"
        :color="item.color"
        ></v-radio>
    </v-radio-group>
    <v-slider
        v-model="slider"
        :color="sliderColor"
        thumb-label="always"
        :disabled="sliderDisabled"
        :max="sliderMax"
        :min="sliderMin"
        :step="sliderStep"
        @update:modelValue="toggleSlider"
        @end="toggleSliderFinished"
    ></v-slider>
    <v-progress-linear
        color="nav-success"
        buffer-value="0"
        stream
    ></v-progress-linear>
</template>

<script setup lang="ts">
/**
 * Slider Control Component
 *
 * @description Renders a radio button group for slider mode selection along with
 * a configurable slider control. Used for adjusting numeric values like brush size.
 *
 * @prop {RadioValue[]} sliderRadioValues - Radio button configurations for slider modes
 * @prop {boolean} disabled - Whether radio group is disabled
 * @prop {string} sliderColor - Vuetify color for the slider
 * @prop {boolean} sliderDisabled - Whether slider is disabled
 * @prop {number} sliderMax - Maximum slider value
 * @prop {number} sliderMin - Minimum slider value
 * @prop {number} sliderStep - Slider step increment
 *
 * @emits update:selectedSliderRadio - Emitted when slider mode radio changes
 * @emits update:slider - Emitted during slider drag (real-time updates)
 * @emits update:sliderFinished - Emitted when slider drag ends (final value)
 */

/** Type definition for slider radio button configuration */
type RadioValue = {
  label: string;
  value: string;
  color: string;
};
defineProps<{
  sliderRadioValues: RadioValue[],
  disabled: boolean,
  sliderColor: string,
  sliderDisabled: boolean,
  sliderMax: number,
  sliderMin: number,
  sliderStep: number,
}>();

/** Two-way bound model for selected slider mode */
const sliderRadio = defineModel("sliderRadio");

/** Two-way bound model for slider value */
const slider = defineModel<any>("slider");

const emit = defineEmits(["update:selectedSliderRadio", "update:slider", "update:sliderFinished"]);

/**
 * Handles slider mode radio button selection.
 *
 * @param value - The selected slider mode value
 */
function toggleSliderRadios(value:any){
    emit("update:selectedSliderRadio", value);
    sliderRadio.value = value;
}

/**
 * Handles slider value changes during drag operation.
 *
 * @param value - Current slider value
 */
function toggleSlider(value:any){
    emit("update:slider", value);
    slider.value = value;
}

/**
 * Handles slider drag end event.
 *
 * @param value - Final slider value when drag ends
 */
function toggleSliderFinished(value:any){
    emit("update:sliderFinished", value);
}

</script>

<style scoped>

</style>