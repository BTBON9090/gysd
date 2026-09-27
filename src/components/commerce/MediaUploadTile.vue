<script setup lang="ts">
import { ImagePlus } from 'lucide-vue-next'
import DemoImage from './DemoImage.vue'
withDefaults(defineProps<{ source?: string; label?: string; accept?: string; multiple?: boolean; disabled?: boolean }>(), { source: '', label: '添加图片', accept: 'image/jpeg,image/png,image/webp' })
defineEmits<{ change: [event: Event] }>()
</script>
<template>
  <label class="media-upload-tile" :class="{ filled: source, disabled }" :title="source ? '点击更换图片' : label">
    <DemoImage v-if="source" :source="source" />
    <span class="upload-tile-caption"><ImagePlus :size="21" /><span>{{ source ? '更换图片' : label }}</span></span>
    <input type="file" :aria-label="label" :accept="accept" :multiple="multiple" :disabled="disabled" @change="$emit('change', $event)" />
  </label>
</template>
<style scoped>
.media-upload-tile{position:relative;display:flex;align-items:center;justify-content:center;width:160px;height:112px;flex:none;overflow:hidden;border:1px dashed #c7d5e9;border-radius:8px;background:#f7f9fd;color:#3c5cbb;cursor:pointer;box-sizing:border-box}.media-upload-tile:hover{border-color:#5578d0;background:#f0f5ff}.upload-tile-caption{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:12px;font-weight:500}.media-upload-tile :deep(.demo-image){position:absolute;inset:0;pointer-events:none}.filled .upload-tile-caption{position:absolute;inset:0;opacity:0;background:#1b2c4a80;color:#fff;transition:opacity .15s}.filled:hover .upload-tile-caption{opacity:1}.media-upload-tile input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;font-size:0}.disabled{opacity:.55;pointer-events:none}
</style>

<style scoped>
.upload-tile-caption{justify-content:center;text-align:center}
</style>
