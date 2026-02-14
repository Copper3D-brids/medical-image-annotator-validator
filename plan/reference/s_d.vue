<template>
  <div class="app">
    <h2>Vue 3 Canvas Segmentation (8 Labels + Undo)</h2>

    <div class="toolbar">
      <label>
        Label:
        <select v-model="currentLabel">
          <option v-for="l in 8" :key="l" :value="l">Label {{ l }}</option>
        </select>
      </label>

      <label>
        Tool:
        <select v-model="tool">
          <option value="draw">Draw</option>
          <option value="erase">Erase</option>
        </select>
      </label>

      <label>
        Brush:
        <input type="range" min="1" max="20" v-model="radius" /> {{ radius }}
      </label>

      <button @click="undo">Undo (Ctrl+Z)</button>
      <button @click="clear">Clear</button>
    </div>

    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointerleave="onUp"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const width = 400
const height = 500

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D

// ===== segmentation mask =====
const mask = new Uint8Array(width * height)

// ===== undo stack =====
type Delta = { idx: number; prev: number }
let currentStroke: Delta[] = []
const undoStack: Delta[][] = []

// ===== UI state =====
const currentLabel = ref(1)
const tool = ref<'draw' | 'erase'>('draw')
const radius = ref(6)
let drawing = false

// ===== label colors =====
const colors: Record<number, string> = {
  0: 'rgba(0,0,0,0)',
  1: 'rgba(255,0,0,0.6)',
  2: 'rgba(0,255,0,0.6)',
  3: 'rgba(0,0,255,0.6)',
  4: 'rgba(255,255,0,0.6)',
  5: 'rgba(255,0,255,0.6)',
  6: 'rgba(0,255,255,0.6)',
  7: 'rgba(255,128,0,0.6)',
  8: 'rgba(128,0,255,0.6)'
}

onMounted(() => {
  ctx = canvasRef.value!.getContext('2d')!
  redraw()
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})

function onKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault()
    undo()
  }
}

function applyBrush(cx: number, cy: number) {
  for (let y = cy - radius.value; y <= cy + radius.value; y++) {
    for (let x = cx - radius.value; x <= cx + radius.value; x++) {
      if (x < 0 || y < 0 || x >= width || y >= height) continue
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy > radius.value * radius.value) continue

      const idx = y * width + x
      let newValue = mask[idx]

      if (tool.value === 'draw') {
        newValue = currentLabel.value
      } else {
        if (mask[idx] === currentLabel.value) newValue = 0
      }

      if (newValue !== mask[idx]) {
        currentStroke.push({ idx, prev: mask[idx] })
        mask[idx] = newValue
      }
    }
  }
}

function redraw() {
  ctx.clearRect(0, 0, width, height)
  for (let i = 0; i < mask.length; i++) {
    const label = mask[i]
    if (label === 0) continue
    const x = i % width
    const y = Math.floor(i / width)
    ctx.fillStyle = colors[label]
    ctx.fillRect(x, y, 1, 1)
  }
}

function getPos(e: PointerEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  return {
    x: Math.floor(e.clientX - rect.left),
    y: Math.floor(e.clientY - rect.top)
  }
}

function onDown(e: PointerEvent) {
  drawing = true
  currentStroke = []
  const { x, y } = getPos(e)
  applyBrush(x, y)
  redraw()
}

function onMove(e: PointerEvent) {
  if (!drawing) return
  const { x, y } = getPos(e)
  applyBrush(x, y)
  redraw()
}

function onUp() {
  if (!drawing) return
  drawing = false
  if (currentStroke.length > 0) {
    undoStack.push(currentStroke)
  }
  currentStroke = []
}

function undo() {
  const stroke = undoStack.pop()
  if (!stroke) return
  for (const { idx, prev } of stroke) {
    mask[idx] = prev
  }
  redraw()
}

function clear() {
  mask.fill(0)
  undoStack.length = 0
  redraw()
}
</script>

<style scoped>
.app {
  font-family: sans-serif;
  padding: 16px;
}

.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  align-items: center;
}

canvas {
  border: 1px solid #ccc;
  touch-action: none;
}
</style>