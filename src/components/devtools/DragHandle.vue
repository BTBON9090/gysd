<script setup lang="ts">
import { ref } from 'vue'

const x = ref(Math.min(window.innerWidth - 80, window.innerWidth - 88))
const y = ref(Math.min(120, window.innerHeight / 3))
const dragging = ref(false)
let ox = 0
let oy = 0

function onDown(e: PointerEvent) {
  dragging.value = true
  ox = e.clientX - x.value
  oy = e.clientY - y.value
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}
function onMove(e: PointerEvent) {
  if (!dragging.value) return
  x.value = Math.max(8, Math.min(window.innerWidth - 56, e.clientX - ox))
  y.value = Math.max(8, Math.min(window.innerHeight - 48, e.clientY - oy))
}
function onUp(e: PointerEvent) {
  dragging.value = false
  try {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <button
    class="drag-handle"
    type="button"
    title="拖动移动 · 点击打开验收工具"
    :style="{ left: x + 'px', top: y + 'px' }"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @click="$emit('open')"
  >
    <span class="grip">⠿</span>
    验收
  </button>
</template>

<style scoped>
.drag-handle {
  position: fixed;
  z-index: 90;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 12px 0 8px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-pill);
  background: #fff;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: grab;
  box-shadow: var(--shadow-lg);
  touch-action: none;
  user-select: none;
}
.drag-handle:active {
  cursor: grabbing;
}
.grip {
  opacity: 0.45;
  letter-spacing: -1px;
}
</style>
