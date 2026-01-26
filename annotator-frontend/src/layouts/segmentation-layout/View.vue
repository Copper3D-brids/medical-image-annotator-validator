<template>
  <!--
    Main Content View Component

    This component serves as the primary content wrapper for the application.
    It renders the MainPage component which contains the dual-panel medical
    image viewing and annotation interface.
  -->
  <v-main>
    <MainPage />
  </v-main>
</template>

<script lang="ts" setup>
/**
 * View Layout Component
 *
 * @description Wrapper component that renders the main application content.
 * Uses Vuetify's v-main component for proper layout spacing with app-bar.
 */
import MainPage from '@/views/MainPage.vue';
</script>
<style scoped>
</style>
