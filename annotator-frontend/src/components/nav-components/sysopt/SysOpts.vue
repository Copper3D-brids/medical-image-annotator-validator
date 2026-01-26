<template>
  <v-list-group value="Opts">
    <template v-slot:activator="{ props }">
      <v-list-item
        v-bind="props"
        color="primary"
        prepend-icon="mdi-cogs"
        title="Opts"
      ></v-list-item>
    </template>

    <slot></slot>
  </v-list-group>
</template>

<script setup lang="ts">
/**
 * System Options List Group Component
 *
 * @description Container component for system-level options using a collapsible list group.
 * Uses a default slot to allow parent components to inject system option controls.
 *
 * @slot default - Slot for system option control components (e.g., SysOptsCtl)
 */

</script>

<style scoped></style>
