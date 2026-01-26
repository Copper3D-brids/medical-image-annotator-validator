<template>
    <v-card class="left-value-panel mt-2">
      <div class="dts"><span>DTS:</span> <span>{{ dts }} mm</span></div>
      <div class="dtn"><span>DTN:</span> <span>{{ dtn }} mm</span></div>
      <div class="dtr"><span>DTR:</span> <span>{{ dtr }} mm</span></div>
    </v-card>
</template>

<script setup lang="ts">
/**
 * Tumour Distance Panel Left Component
 *
 * @description Displays tumour distance measurements in the left panel overlay:
 * - DTS: Distance to Skin (yellow)
 * - DTN: Distance to Nipple (pink)
 * - DTR: Distance to Ribcage (cyan)
 *
 * @prop {number} dts - Distance to skin in mm
 * @prop {number} dtn - Distance to nipple in mm
 * @prop {number} dtr - Distance to ribcage in mm
 */
defineProps({
  dts: Number,
  dtn: Number,
  dtr: Number
})
</script>

<style scoped>

.left-value-panel {
  position: absolute !important;
  z-index: 10000;
  left: 15px;
  top: 0px;
  width: 200px;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.1) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 10px !important;
  padding: 10px 15px !important;
  font-size: smaller !important;
  user-select: text !important;
  -webkit-user-select: text !important;
  /* display: flex; */
  /* align-items: center; */
  /* justify-content: center; */
}

.left-value-panel > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left-value-panel .dts {
  color: #FFEB3B;
}
.left-value-panel .dtr {
  color: darkcyan;
}
.left-value-panel .dtn {
  color: hotpink;
}
</style>