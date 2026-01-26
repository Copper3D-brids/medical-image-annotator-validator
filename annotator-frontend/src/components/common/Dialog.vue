<template>
    <v-dialog
      v-model="dialog"
      width="auto"
      @after-leave="handleDialogCancel"
    >
        <v-sheet
            class="pa-4 text-center mx-auto"
            elevation="12"
            :min-width="min"
            :max-width="max"
            rounded="lg"
            width="100%"
        >
            <div class="d-flex justify-space-start align-center">
                <v-icon
                    class="mb-5 mr-4"
                    color="success"
                    icon="mdi-cog-outline"
                    size="60"
                ></v-icon>
                <slot name="title"></slot>
            </div>

                <slot name="description"></slot>

                <v-divider class="mb-4"></v-divider>
                
                <slot></slot>

                <div class="text-end">
                <v-btn
                    class="text-none"
                    color="success"
                    variant="flat"
                    width="90"
                    rounded
                    @click="handleDialogSave"
                >
                    {{ saveBtnName }}
                </v-btn>
            </div>
        </v-sheet>
    </v-dialog>

    <div class="px-2 my-6">
      <v-btn
        v-show="showDialog"
        :color="btnColor"
        :prepend-icon="btnIcon"
        :height="btnHeight"
        max-width="100"
        block
        :text="btnText" 
        :variant="btnVariant"
        @click="openDialog"
      ></v-btn>
    </div>
</template>

<script setup lang="ts">
/**
 * Dialog Component
 *
 * @description Reusable modal dialog component with configurable:
 * - Trigger button with customizable text, icon, and color
 * - Title and description slots for content
 * - Save/Cancel actions with event emissions
 *
 * Uses Vuetify v-dialog and v-sheet for styling.
 *
 * @slot title - Custom dialog title content
 * @slot description - Custom description text
 * @slot default - Main dialog body content
 *
 * @prop {number} max - Maximum dialog width
 * @prop {number} min - Minimum dialog width
 * @prop {string} btnText - Trigger button text
 * @prop {string} btnColor - Trigger button color
 * @prop {string} btnIcon - Trigger button prepend icon
 * @prop {boolean} showDialog - Whether to show trigger button
 * @prop {string} saveBtnName - Save button text
 *
 * @emits onOpen - Emitted when dialog opens
 * @emits onCancel - Emitted when dialog is cancelled
 * @emits onSave - Emitted when save button is clicked
 */
import { ref } from "vue";

/**
 * Dialog props interface
 */
interface DialogProps {
    max?: number;
    min?: number;
    icon?: string;
    btnText?: string;
    btnColor?: string;
    btnIcon?: string;
    btnVariant?: string;
    showDialog?: boolean;
    saveBtnName?: string;
    btnHeight?:string;
}

withDefaults(defineProps<DialogProps>(), {
    max: 600,
    min: 600,
    icon: "mdi-cog-outline",
    btnText: "",
    btnColor: "",
    btnIcon: "",
    btnVariant: "outlined",
    showDialog: true,
    saveBtnName: "Save",
    btnHeight:""
});

/** Dialog open state */
const dialog = ref(false);

/** Whether save was clicked (prevents cancel event on close) */
const isSaved = ref(false);

const emit = defineEmits([
    "onOpen",
    "onCancel",
    "onSave"
]);

/**
 * Opens the dialog and emits onOpen event.
 */
const openDialog = () => {
    dialog.value = true;
    isSaved.value = false;
    emit("onOpen");
}

/**
 * Handles dialog cancel/close (after-leave event).
 * Only emits onCancel if save was not clicked.
 */
const handleDialogCancel = () => {
    if(isSaved.value) return;
    emit("onCancel");
    dialog.value = false;
}

/**
 * Handles save button click.
 * Closes dialog and emits onSave event.
 */
const handleDialogSave = () => {
    dialog.value = false;
    isSaved.value = true;
    emit("onSave");
}
</script>

<style scoped>

</style>