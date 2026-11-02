<script setup lang="ts">
import { ElButton } from 'element-plus'
import { ArrowLeft } from 'lucide-vue-next'
defineProps<{ title:string; backLabel:string }>()
const emit = defineEmits<{ back: [] }>()
</script>
<template>
  <header class="secondary-header">
    <ElButton text @click="emit('back')"><ArrowLeft :size="16"/>{{backLabel}}</ElButton>
    <h1>{{title}}</h1>
    <slot />
  </header>
</template>
<style scoped>
.secondary-header{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:16px;background:#fff;padding:10px 0;margin:-10px 0 18px}.secondary-header h1{flex:1;min-width:0;margin:0;font-size:22px;line-height:1.4;color:#20304a}.secondary-header :deep(.el-button){margin:0}.secondary-header :deep(.el-button>span){display:inline-flex;align-items:center;gap:2px}
</style>
