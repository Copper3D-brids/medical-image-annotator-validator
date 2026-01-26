<template>
  <v-navigation-drawer
    v-model="drawer"
    :rounded="true"
    :disable-resize-watcher="true"
    :width="350"
    :permanent="!temporary"
    :temporary="temporary"
  >
    <slot></slot>
  </v-navigation-drawer>

  <v-app-bar color="surface" class="d-flex justify-end">

    <v-app-bar-nav-icon class="guide-bar-nav" @click="toggleDrawer"></v-app-bar-nav-icon>

    <div class="guide-expand-panel" data-tool="expandtool"></div>
    <v-app-bar-title >
      <span class="text-capitalize"
        >
        {{ title }}
      </span>
      <span class="text-body-2 font-italic text-deep-orange mx-2">
        {{ version }}
      </span>
    </v-app-bar-title>

    <div width="" class="w-50 d-flex flex-row justify-end align-center px-2">
      <IntroPanel />
       <slot name="theme"></slot>
      <v-img
        class="px-5"
        width="250px"
        max-width="250px"
        :src="abi_logo"
      ></v-img>
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
/**
 * AppBar Component
 *
 * @description Top-level application bar component that provides:
 * - Navigation drawer (left sidebar) with configurable sticky/temporary modes
 * - App bar header with title, version, intro panel, theme slot, and logo
 *
 * @slot default - Content to display inside the navigation drawer
 * @slot theme - Theme toggle button slot (typically a v-btn for light/dark toggle)
 *
 * @emits Common:DrawerStatus - Emitted when drawer open state changes (boolean)
 * @emits Common:NavStickyMode - Emitted when drawer sticky mode changes (boolean)
 * @emits Common:ResizeCopperSceneWhenNavChanged - Emitted to trigger 3D scene resize
 *
 * @listens Common:NavStickyMode - Updates drawer temporary/permanent state
 * @listens IntroGuide:DrawerStatus - Opens drawer when intro guide requests it
 */
import { ref, onMounted, onUnmounted } from "vue";
import IntroPanel from "@/components/intro/IntroPanel.vue";
import emitter from "@/plugins/custom-emitter";
import abi_logo from "@/assets/images/abi.png";

/**
 * Component props
 * @property {string} title - Application title displayed in app bar
 * @property {string} version - Application version displayed next to title
 */
defineProps({
  title: {
    type: String,
    default: "Tumour Position & Extent Reporting App",
  },
  version: {
    type: String,
    default: "v3.0.0",
  },
});

/** Controls whether the navigation drawer is open or closed */
const drawer = ref(false);

/**
 * Controls drawer behavior:
 * - true: drawer is temporary (overlay mode, closes on outside click)
 * - false: drawer is permanent (pushes content, stays open)
 */
const temporary = ref(true);


onMounted(() => {
  manageEmitters();
});

/**
 * Registers event listeners for drawer control.
 * Sets up handlers for sticky mode and intro guide drawer requests.
 */
function manageEmitters() {
  // Listen for sticky mode toggle from other components
  emitter.on("Common:NavStickyMode", emitterOnNavStickyMode);
  // Listen for intro guide requesting drawer to open
  emitter.on("IntroGuide:DrawerStatus", emitterOnDrawerStatus);
}

/**
 * Handles sticky mode toggle events from other components.
 * When sticky mode is enabled, drawer becomes permanent (non-temporary).
 *
 * @param val - true to enable sticky mode, false for temporary mode
 */
const emitterOnNavStickyMode = (val:boolean) => {
  temporary.value = !val;
  // Notify 3D scene to resize after drawer state change
  emitter.emit("Common:ResizeCopperSceneWhenNavChanged", {
    panel: "right",
  });
}

/**
 * Handles drawer open requests from intro guide.
 * Only opens the drawer if it's currently closed.
 *
 * @param val - "open" to request drawer opening
 */
const emitterOnDrawerStatus = (val:string)=>{
  if(val==="open" && !drawer.value){
    toggleDrawer();
  }
}

/**
 * Toggles the navigation drawer open/closed state.
 * Also updates temporary mode and emits events to notify other components.
 */
function toggleDrawer() {
  drawer.value = !drawer.value;
  // When drawer opens, make it permanent; when closed, make temporary
  temporary.value = !drawer.value;

  // Notify other components about drawer state changes
  emitter.emit("Common:DrawerStatus", drawer.value);
  emitter.emit("Common:NavStickyMode", drawer.value);
  // Trigger 3D scene resize to account for drawer space
  emitter.emit("Common:ResizeCopperSceneWhenNavChanged", {
    panel: "right",
  });
}

/**
 * Cleanup: Remove event listeners when component is unmounted
 * to prevent memory leaks and stale event handlers.
 */
onUnmounted(() => {
  emitter.off("Common:NavStickyMode", emitterOnNavStickyMode);
  emitter.off("IntroGuide:DrawerStatus", emitterOnDrawerStatus);
});

</script>
<style></style>
