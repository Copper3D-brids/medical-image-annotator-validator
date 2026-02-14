<template>
  <v-list-group value="LayerChannel">
    <template v-slot:activator="{ props }">
      <v-list-item
        v-bind="props"
        color="nav-success-2"
        prepend-icon="mdi-layers-triple"
        title="Layer & Channel"
      ></v-list-item>
    </template>
    
    <div class="lc-container" :class="{ 'global-disabled': !controlsEnabled }">
      <!-- Layer Section -->
      <div class="section-header">
        <span class="label">Layers</span>
      </div>
      
      <div class="layer-list">
        <div 
          v-for="layer in LAYER_CONFIGS" 
          :key="layer.id"
          class="layer-item"
          :class="{ 
            'active': activeLayer === layer.id,
            'is-hidden': !layerVisibility[layer.id]
          }"
        >
          <!-- Visibility Toggle (Left) -->
          <div 
            class="layer-vis-btn"
            :class="{ 'visible': layerVisibility[layer.id], 'hidden': !layerVisibility[layer.id] }"
            @click.stop="onToggleLayerVisibility(layer.id)"
          >
            <v-icon size="14">{{ layerVisibility[layer.id] ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
            <v-tooltip activator="parent" location="top" open-delay="400">Toggle Visibility</v-tooltip>
          </div>

          <!-- Selection (Right) -->
          <div 
            class="layer-select-area" 
            @click="onSelectLayer(layer.id)"
          >
            <span class="layer-name">{{ layer.name }}</span>
            <span v-if="!layerVisibility[layer.id]" class="status-text">(Hidden)</span>
          </div>
        </div>
      </div>

      <!-- Channel Section -->
      <div class="section-header mt-3">
        <span class="label">Channels</span>
        <div v-if="controlsEnabled" class="active-badge" :style="activeBadgeStyle">
          Selected: Ch {{ activeChannel }}
        </div>
      </div>

      <div class="channel-grid">
        <div 
          v-for="channel in CHANNEL_CONFIGS"
          :key="channel.value"
          class="channel-card"
          :class="{ 
            'active': activeChannel === channel.value,
            'is-disabled': isChannelDisabled(channel.value),
            'parent-hidden': !layerVisibility[activeLayer]
          }"
          :style="getChannelStyle(channel)"
          @click="onSelectChannel(channel.value)"
        >
          <div class="channel-content">
            <span class="channel-num">{{ channel.value }}</span>
          </div>

          <!-- Visibility Toggle (Absolute Positioned) -->
          <!-- Only show if parent layer is visible, otherwise entire channel is effectively hidden -->
          <div 
            v-if="layerVisibility[activeLayer]"
            class="channel-vis-toggle"
            @click.stop="onToggleChannelVisibility(channel.value)"
            :class="{ 'vis-active': channelVisibility[activeLayer]?.[channel.value] }"
          >
            <v-icon size="12" :color="getVisIconColor(channel.value)">
              {{ channelVisibility[activeLayer]?.[channel.value] ? 'mdi-eye' : 'mdi-eye-off' }}
            </v-icon>
          </div>
        </div>
      </div>
      
      <!-- Disabled Overlay when controls not enabled -->
      <div v-if="!controlsEnabled" class="disabled-overlay">
        <span>Load image to enable</span>
      </div>

    </div>
  </v-list-group>
</template>

<script setup lang="ts">
/**
 * LayerChannelSelector Component
 *
 * Phase 7 - Step 10b: Layer/Channel Selection UI (Refined)
 *
 * Updates:
 * - Disabled states when hidden
 * - Restricted selection logic
 * - Enhanced visuals (Neon/Cyberpunk aesthetics)
 */
import { ref, computed, onMounted, onUnmounted } from "vue";
import emitter from "@/plugins/custom-emitter";
import * as Copper from "@/ts/index";
import { useLayerChannel, LAYER_CONFIGS, CHANNEL_CONFIGS, type ChannelConfig } from "@/composables/left-panel";


// ===== Logic =====

// Helper to check if a channel is disabled
const isChannelDisabled = (val: number) => {
  // If parent layer is hidden, everything is disabled
  if (!layerVisibility.value[activeLayer.value]) return true;
  // If channel itself is hidden, it's disabled for selection
  return !channelVisibility.value[activeLayer.value]?.[val];
};

// Style for active badge
const activeBadgeStyle = computed(() => {
  if (!controlsEnabled.value) return {};
  // Find current channel config to get color
  const conf = CHANNEL_CONFIGS.find(c => c.value === activeChannel.value);
  // Use a brighter color logic or just use the config color
  const color = conf?.color.replace(',0.6)', ',1)').replace('rgba', 'rgba') || '#fff';
  return {
    backgroundColor: color,
    boxShadow: `0 0 8px ${color}`
  };
});

// Dynamic style for channel card
const getChannelStyle = (channel: ChannelConfig) => {
  const isActive = activeChannel.value === channel.value;
  const isHidden = !channelVisibility.value[activeLayer.value]?.[channel.value];
  const isLayerHidden = !layerVisibility.value[activeLayer.value];
  
  if (isLayerHidden) return {}; // Parent hidden style takes precedence via class

  // Base color from config (convert to solid for UI pop)
  const baseColor = channel.color.replace(',0.6)', ',1)'); // Hacky alpha replace for specific rgba format

  if (isActive) {
    return {
      borderColor: baseColor,
      boxShadow: `inset 0 0 15px ${channel.color}, 0 0 5px ${baseColor}`,
      color: '#fff'
    };
  }
  
  if (isHidden) {
      return { opacity: 0.4 };
  }

  // Normal visible state
  return {
      borderColor: 'rgba(255,255,255,0.1)'
  };
};

const getVisIconColor = (val: number) => {
  const isVisible = channelVisibility.value[activeLayer.value]?.[val];
  return isVisible ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)';
};

// ===== Event Handlers =====

function onSelectLayer(layerId: Copper.LayerId): void {
  if (!layerVisibility.value[layerId]) {
    // Shake or deny? For now just ignore
    return;
  }
  setActiveLayer(layerId);
}

function onSelectChannel(channel: Copper.ChannelValue): void {
  if (isChannelDisabled(channel)) return;
  setActiveChannel(channel);
}

function onToggleLayerVisibility(layerId: Copper.LayerId): void {
  toggleLayerVisibility(layerId);
  // If we just hid the active layer, maybe we should warn?
  // Current logic: Logic keeps it active but disabled.
}

function onToggleChannelVisibility(channel: Copper.ChannelValue): void {
  // Only allow toggling if layer is visible? 
  // User req: "hide layer -> disable all channels". toggle is a control, maybe still allowed? 
  // The user said "disable it". Usually implies interactive elements.
  // But if I can't unhide it, I'm stuck. So Toggling MUST remain enabled.
  // It's the SELECTION that is disabled.
  toggleChannelVisibility(activeLayer.value, channel);
}

// ===== Emitter Handlers =====

const emitterOnSegmentationManager = (mgr: Copper.SegmentationManager) => {
  segmentationManager.value = mgr;
};

const emitterOnFinishLoadAllCaseImages = () => {
  enableControls();
  syncFromManager();
};

const emitterOnCaseSwitched = () => {
  disableControls();
};

// ===== Lifecycle =====

onMounted(() => {
  emitter.on("Core:SegmentationManager", emitterOnSegmentationManager);
  emitter.on("Segmentation:FinishLoadAllCaseImages", emitterOnFinishLoadAllCaseImages);
  emitter.on("Segementation:CaseSwitched", emitterOnCaseSwitched);
});

onUnmounted(() => {
  emitter.off("Core:SegmentationManager", emitterOnSegmentationManager);
  emitter.off("Segmentation:FinishLoadAllCaseImages", emitterOnFinishLoadAllCaseImages);
  emitter.off("Segementation:CaseSwitched", emitterOnCaseSwitched);
});
</script>

<style scoped>
.lc-container {
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
  min-height: 150px;
}

.disabled-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(2px);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.7);
    font-size: 12px;
    font-weight: 500;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
}

.active-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  color: #000;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 0 5px rgba(255,255,255,0.5);
  transition: all 0.3s ease;
}

/* ===== Layer Styles ===== */

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.layer-item {
  display: flex;
  height: 32px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.2s ease;
}

.layer-item.active {
  border-color: var(--v-theme-nav-success-2, #4CAF50);
  background: linear-gradient(90deg, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.05));
}

.layer-item.is-hidden {
    opacity: 0.6;
    border-style: dashed;
}

/* Visibility Toggle (Left Part) */
.layer-vis-btn {
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0,0,0,0.2);
  transition: background 0.2s;
}

.layer-vis-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.layer-vis-btn.visible {
  color: #fff;
  text-shadow: 0 0 5px rgba(255,255,255,0.5);
}

.layer-vis-btn.hidden {
  color: rgba(255, 255, 255, 0.3);
}

/* Selection Area (Right Part) */
.layer-select-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.layer-item.is-hidden .layer-select-area {
    cursor: not-allowed;
    color: rgba(255, 255, 255, 0.4);
}

.layer-item.active .layer-select-area {
  color: #fff;
  font-weight: bold;
}

.layer-select-area:hover {
  background: rgba(255, 255, 255, 0.05);
}

.status-text {
    font-size: 10px;
    font-style: italic;
    opacity: 0.7;
}

/* ===== Channel Styles ===== */

.channel-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.channel-card {
  position: relative;
  height: 44px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  overflow: hidden;
}

.channel-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.channel-card.active {
    /* Style handled by inline styles for dynamic color */
  transform: scale(1.02);
  z-index: 1;
}

.channel-card.is-disabled {
    cursor: not-allowed;
    opacity: 0.4;
    filter: grayscale(0.8);
    border-style: dashed;
}

.channel-card.parent-hidden {
    pointer-events: none; /* Cannot even hover */
    opacity: 0.2;
}

.channel-num {
  font-size: 14px;
  font-weight: bold;
  opacity: 0.9;
  z-index: 2;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
}

/* Channel Visibility Toggle */
.channel-vis-toggle {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0.6;
  z-index: 5;
  cursor: pointer;
  transition: all 0.2s;
}

.channel-vis-toggle:hover {
  background: rgba(0, 0, 0, 0.8);
  opacity: 1;
  transform: scale(1.1);
}
</style>
