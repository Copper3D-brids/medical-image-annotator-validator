<template>
    <!-- Buttons -->
    <v-progress-linear
        color="nav-success"
        buffer-value="0"
        stream
    ></v-progress-linear>

    <div class="guide-operation-comm-btns">
        <v-btn
            v-for="(btn, idx) in commFuncBtnValues"
            block
            density="comfortable"
            variant="outlined"
            class="my-1"
            :key="idx"
            :color="btn.color"
            :disabled="btn.disabled"
            @click="onBtnClick(btn.value)"
        >
            {{ btn.label }}
        </v-btn>
    </div>
    
    <v-progress-linear
        color="nav-success"
        buffer-value="0"
        stream
    ></v-progress-linear>
</template>

<script setup lang="ts">
/**
 * Buttons Control Component
 *
 * @description Renders a list of action buttons based on configuration array.
 * Each button is styled with Vuetify components and emits click events.
 *
 * @prop {Array} commFuncBtnValues - Array of button configurations with:
 *   - label: Display text for button
 *   - value: Unique identifier emitted on click
 *   - color: Vuetify color for button
 *   - disabled: Whether button is disabled
 *
 * @emits update:btnClicked - Emitted when a button is clicked, payload is button value
 */

defineProps<{
    commFuncBtnValues: {label: string, value: string, color: string, disabled: boolean}[]
}>();

const emit = defineEmits(["update:btnClicked"]);

/**
 * Handles button click events and emits the button value to parent.
 *
 * @param value - The unique value identifier of the clicked button
 */
function onBtnClick(value:string){
    emit("update:btnClicked", value);
}

</script>

<style scoped>

</style>