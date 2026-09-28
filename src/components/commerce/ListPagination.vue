<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { ElPagination } from 'element-plus'
const props = defineProps<{ page: number; pageSize: number; total: number; noun?: string }>()
const emit = defineEmits<{ 'update:page': [value: number] }>()
const root = ref<HTMLElement>()
async function change(value: number) {
  emit('update:page', value)
  await nextTick()
  root.value?.closest('.park-group, .biz-page, .members-page')?.scrollIntoView({ block: 'start' })
}
</script>
<template>
  <footer v-if="total > 0" ref="root" class="list-pagination" aria-label="列表分页">
    <span>共 {{ total }} {{ noun || '条' }}<span class="page-range">本页 {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, total) }}</span></span>
    <ElPagination :current-page="props.page" :page-size="pageSize" :total="total" :pager-count="5" layout="prev, pager, next" background @current-change="change" />
  </footer>
</template>
<style scoped>
.list-pagination{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;margin-top:12px;border-top:1px solid #e3e9f1;color:#53647a;font-size:12px;background:#fff}.page-range{margin-left:16px;color:#65748a}
</style>
