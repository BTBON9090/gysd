<script setup lang="ts">
defineProps<{ modelValue: string; items: string[][]; count: (key: string) => number }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
<template>
  <div class="list-status-bar">
    <div class="list-status-tabs" role="tablist" aria-label="列表状态">
      <button v-for="[key,label] in items" :key="key" type="button" role="tab" :aria-selected="modelValue === key" :class="{ active: modelValue === key }" @click="emit('update:modelValue', key)">{{ label }} <span>{{ count(key) }}</span></button>
    </div>
    <div v-if="$slots.actions" class="list-status-actions"><slot name="actions" /></div>
  </div>
</template>
<style scoped>
.list-status-bar{display:flex;align-items:end;gap:12px;margin:19px 0 8px;border-bottom:0;min-width:0}.list-status-tabs{display:flex;flex:1;align-items:center;gap:2px;min-width:0;overflow-x:auto;white-space:nowrap}.list-status-tabs button{flex:none;appearance:none;border:0;border-bottom:2px solid transparent;background:none;padding:11px 13px;color:#62718a;font:inherit;font-size:13px;line-height:normal;cursor:pointer}.list-status-tabs button.active{color:#3355c2;border-bottom-color:#3355c2;font-weight:700}.list-status-tabs button span{margin-left:2px;font-size:11px;color:#596a80}.list-status-tabs button.active span{color:#3153bd}.list-status-actions{flex:none;display:flex;align-items:center;padding-bottom:4px}
</style>
