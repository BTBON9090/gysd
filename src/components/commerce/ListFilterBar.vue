<template>
  <div class="list-filter-bar"><div class="list-filter-fields"><slot /></div><div class="list-filter-actions"><slot name="actions" /></div></div>
</template>
<style scoped>
.list-filter-bar{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px}.list-filter-fields{display:grid;grid-template-columns:minmax(140px,1fr) minmax(140px,1fr) minmax(150px,1.15fr);gap:10px;min-width:0}.list-filter-fields :deep(.el-select),.list-filter-fields :deep(.el-cascader),.list-filter-fields :deep(.el-input){width:100%;min-width:0}.list-filter-actions{display:flex;align-items:center;gap:8px;white-space:nowrap}.list-filter-actions :deep(.el-button){margin:0}
</style>
