<template>
  <v-snackbar
    v-model="visible"
    :timeout="duration"
    :color="color"
    location="top right"
    variant="elevated"
  >
    {{ message }}
    <template v-slot:actions>
      <v-btn
        variant="text"
        size="small"
        icon="mdi-close"
        @click="visible = false"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import emitter from '@/plugins/custom-emitter';
import type { ToastOptions } from '@/composables/useToast';

const visible = ref(false);
const message = ref('');
const duration = ref(3000);
const color = ref('success');

const colorMap = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info'
};

const handleToastShow = (options: ToastOptions) => {
  message.value = options.message;
  duration.value = options.duration || 3000;
  color.value = colorMap[options.type];
  visible.value = true;
};

onMounted(() => {
  emitter.on('toast:show', handleToastShow);
});

onUnmounted(() => {
  emitter.off('toast:show', handleToastShow);
});
</script>
