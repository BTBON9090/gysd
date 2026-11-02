<script setup lang="ts">
import { ElButton } from 'element-plus'
withDefaults(defineProps<{ expanded: boolean; advancedCount: number; secondAdvanced?: boolean }>(), { secondAdvanced: false })
const emit = defineEmits<{ 'update:expanded': [value: boolean]; query: []; reset: [] }>()
</script>

<template>
  <div class="list-filter-bar" :class="{ 'has-second-advanced': secondAdvanced }">
    <div class="filter-field first"><slot name="first" /></div>
    <div class="filter-field second"><slot name="second" /></div>
    <div class="filter-field third"><slot name="third" /></div>
    <div class="filter-actions"><ElButton text @click="emit('update:expanded', !expanded)">{{ expanded ? '收起筛选' : '更多筛选' }}{{ advancedCount ? `（${advancedCount}）` : '' }}</ElButton><ElButton type="primary" @click="emit('query')">查询</ElButton><ElButton @click="emit('reset')">重置</ElButton></div>
    <template v-if="expanded">
      <div class="filter-field advanced-first"><slot name="advanced-first" /></div>
      <div v-if="secondAdvanced" class="filter-field advanced-second"><slot name="advanced-second" /></div>
      <div class="advanced-date"><slot name="advanced-date" /></div>
    </template>
  </div>
</template>

<style scoped>
.list-filter-bar{display:grid;grid-template-columns:minmax(180px,1fr) minmax(180px,1fr) minmax(180px,1fr) auto;gap:10px;align-items:center}.filter-field{min-width:0}.filter-field :deep(.el-input),.filter-field :deep(.el-select),.filter-field :deep(.el-cascader){width:100%;min-width:0}.first{grid-column:1;grid-row:1}.second{grid-column:2;grid-row:1}.third{grid-column:3;grid-row:1}.filter-actions{grid-column:4;grid-row:1;display:flex;justify-content:flex-end;align-items:center;gap:8px;white-space:nowrap}.filter-actions :deep(.el-button){margin:0}.filter-actions :deep(.el-button.is-text:not(.is-circle)){height:32px;min-height:32px}.advanced-first{grid-column:1;grid-row:2}.advanced-second{grid-column:2;grid-row:2}.advanced-date{grid-column:2 / -1;grid-row:2;min-width:0}.has-second-advanced .advanced-date{grid-column:3 / -1}.advanced-date :deep(.order-date){display:flex;align-items:center;gap:8px;color:#6b7a90;font-size:12px}.advanced-date :deep(.order-date span){white-space:nowrap}.advanced-date :deep(.order-date b){font-weight:400}.advanced-date :deep(.el-date-editor.el-input){width:150px;max-width:35%;height:32px}
</style>
