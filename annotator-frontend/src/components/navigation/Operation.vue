<template>
  <!--
    Operation Settings List Group

    This component provides a collapsible navigation group for operation-related controls.
    It uses named slots to allow parent components to inject specific control types:
    - Calculator: Calculator control component
    - FunctionalControl: Radio button functional controls
    - SliderControl: Slider-based controls
    - ButtonControl: Action buttons
    - OperationAdvance: Advanced operation settings
  -->
  <v-list-group value="Operation" class="guide-operation-overall" data-tool="operationtool">
        <template v-slot:activator="{ props }">
            <v-list-item
                v-bind="props"
                color="nav-success"
                prepend-icon="mdi-axe"
                title="Operation Settings"
            ></v-list-item>
        </template>
        <!-- Calculator Control -->
        <slot name="Calculator"></slot>
        <!-- Functional Control -->
        <v-container fluid>
            <slot name="FunctionalControl"></slot>
            <slot name="SliderControl"></slot>
            <slot name="ButtonControl"></slot>
        </v-container>
        <slot name="OperationAdvance"></slot>
    </v-list-group>
</template>

<script setup lang="ts">
/**
 * Operation Settings Group Component
 *
 * @description Provides a collapsible list group for operation-related settings.
 * Uses Vuetify's v-list-group with named slots for flexible content injection.
 *
 * @slot Calculator - Slot for calculator control component
 * @slot FunctionalControl - Slot for functional radio button controls
 * @slot SliderControl - Slot for slider-based controls
 * @slot ButtonControl - Slot for action button controls
 * @slot OperationAdvance - Slot for advanced operation settings
 */

</script>

<style>
.v-selection-control-group--inline {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 0 10px;
}
</style>