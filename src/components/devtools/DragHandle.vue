<script setup lang="ts">
import { ref } from 'vue'
import { useAcceptanceStore } from '@/stores/acceptance'

const emit = defineEmits<{ open: [] }>()
const acc = useAcceptanceStore()
const dragging = ref(false)
let startX = 0
let startY = 0
let originX = 0
let originY = 0
let moved = false

function onDown(event: PointerEvent) {
  dragging.value = true
  moved = false
  startX = event.clientX
  startY = event.clientY
  originX = acc.dockPosition.x
  originY = acc.dockPosition.y
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function onMove(event: PointerEvent) {
  if (!dragging.value) return
  const dx = event.clientX - startX
  const dy = event.clientY - startY
  if (Math.abs(dx) + Math.abs(dy) > 5) moved = true
  if (!moved) return
  acc.setDockPosition(
    Math.max(10, Math.min(window.innerWidth - 88, originX + dx)),
    Math.max(10, Math.min(window.innerHeight - 44, originY + dy)),
  )
}
function onUp(event: PointerEvent) {
  if (!dragging.value) return
  dragging.value = false
  ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  if (!moved) emit('open')
}
</script>

<template>
  <button class="drag-handle" :class="{ dragging }" type="button" title="拖动移动 · 点击打开验收工具" @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp">
    <span class="grip">⠿</span>验收
  </button>
</template>

<style scoped>
.drag-handle{display:inline-flex;align-items:center;gap:5px;height:36px;padding:0 12px 0 8px;border:1px solid #d8dfeb;border-radius:9px;background:#fff;color:#26354f;font-size:13px;font-weight:650;cursor:grab;box-shadow:0 8px 24px rgba(26,45,84,.14);touch-action:none;user-select:none}.drag-handle.dragging{cursor:grabbing}.grip{opacity:.55;font-size:15px;line-height:1}
</style>
