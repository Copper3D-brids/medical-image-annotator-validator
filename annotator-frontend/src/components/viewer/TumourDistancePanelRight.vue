<template>
    <v-card class="right-value-panel mt-2 guide-right-value-panel" color="right-display-panel">
        <div v-if="showVolume" color="primary">
            <span>Tumour volume:</span> <span>{{ tumourVolume }} cm<sup>3</sup></span>
        </div>
        <div v-if="showExtent">
            <span>Tumour extent:</span> <span>{{ tumourExtent }} mm</span>
        </div>
        <div class="skin">
            <span>Skin:</span> <span>{{ skinDist }} mm</span>
        </div>
        <div class="ribcage">
            <span>Ribcage:</span> <span>{{ ribDist }} mm</span>
        </div>
        <div class="nipple">
            <span>Nipple:</span> <span>{{ nippleDist }} mm</span>
        </div>
        <div class="nipple">
            <span></span> <span>{{ nippleClock }}</span>
        </div>
    </v-card>
</template>

<script setup lang="ts">
/**
 * Tumour Distance Panel Right Component
 *
 * @description Displays tumour distance measurements in the right (3D) panel overlay:
 * - Tumour volume (cm³) - optional
 * - Tumour extent (mm) - optional
 * - Distance to Skin (yellow)
 * - Distance to Ribcage (cyan)
 * - Distance to Nipple with clock position (pink)
 *
 * @prop {number} tumourVolume - Tumour volume in cm³
 * @prop {number} tumourExtent - Tumour extent in mm
 * @prop {string} skinDist - Distance to skin in mm
 * @prop {string} ribDist - Distance to ribcage in mm
 * @prop {string} nippleDist - Distance to nipple in mm
 * @prop {string} nippleClock - Nipple clock position (e.g., "3 o'clock")
 * @prop {boolean} showVolume - Whether to show volume display
 * @prop {boolean} showExtent - Whether to show extent display
 */
/**
 * Component props interface
 */
interface Props {
  tumourVolume?: number
  tumourExtent?: number
  skinDist?: string
  ribDist?: string
  nippleDist?: string
  nippleClock?: string
  showVolume?: boolean
  showExtent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showVolume: true,
  showExtent: true,
})
</script>

<style scoped>
.right-value-panel {
  position: absolute;
  left: 0px;
  top: 0px;
  width: 200px;
  /* height: 150px; */
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 10px 15px;
  font-size: smaller;
  user-select: none;
  -webkit-user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.right-value-panel > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.skin {
  color: #FFEB3B;
}
.ribcage {
  color: darkcyan;
}
.nipple {
  color: hotpink;
}
</style>