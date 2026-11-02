<script setup lang="ts">
import { computed } from 'vue'
import { ElPopover } from 'element-plus'

type SummaryItem = { id: string; name: string; qty: number; unit: string }
const props = defineProps<{ items: SummaryItem[] }>()
const firstItems = computed(() => props.items.slice(0, 2))
const remaining = computed(() => Math.max(props.items.length - firstItems.value.length, 0))
const totalQuantity = computed(() => props.items.reduce((total, item) => total + (Number(item.qty) || 0), 0))
const hasMixedUnits = computed(() => new Set(props.items.map(item => item.unit || '件')).size > 1)
const totals = computed(() => {
  const groups = new Map<string, number>()
  for (const item of props.items) {
    const unit = item.unit || '件'
    groups.set(unit, (groups.get(unit) || 0) + (Number(item.qty) || 0))
  }
  return [...groups].map(([unit, qty]) => `${qty} ${unit}`).join('、')
})
</script>

<template>
  <div class="order-products">
    <template v-if="items.length">
      <strong v-for="(item, index) in firstItems" :key="item.id" class="product-name" :title="item.name">{{ item.name }}<template v-if="index < firstItems.length - 1">、</template></strong>
      <ElPopover v-if="items.length > 1" placement="top-start" trigger="hover" :width="320" :show-after="150" :hide-after="150" popper-class="order-products-popover">
        <template #reference><button type="button" class="more-products" :aria-label="`查看全部 ${items.length} 种商品及数量`">{{ remaining ? `+${remaining}` : `共 ${items.length} 种` }}</button></template>
        <div class="product-popover">
          <div class="popover-heading">商品明细 <span>共 {{ items.length }} 种</span></div>
          <div class="popover-items"><div v-for="item in items" :key="item.id" class="popover-item"><span>{{ item.name }}</span><strong>{{ item.qty }} {{ item.unit }}</strong></div></div>
          <div class="popover-total"><span>{{ hasMixedUnits ? '合计数量（不同单位）' : '总数量' }}</span><strong>{{ hasMixedUnits ? totalQuantity : totals }}</strong></div>
          <div v-if="hasMixedUnits" class="unit-totals">按单位：{{ totals }}</div>
        </div>
      </ElPopover>
      <small v-else class="single-quantity">{{ items[0].qty }} {{ items[0].unit }}</small>
    </template>
    <span v-else class="empty">暂无商品</span>
  </div>
</template>

<style scoped>
.order-products{min-width:0;display:flex;flex-wrap:nowrap;align-items:baseline;gap:6px;line-height:1.5}
.product-name{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#253754;font-size:13px;font-weight:600}
.more-products{flex:none;border:0;background:none;color:#365fc5;font:inherit;font-size:12px;cursor:pointer;padding:0;white-space:nowrap}
.more-products:hover{text-decoration:underline}
.single-quantity,.empty{flex:none;color:#64748b;font-size:12px;white-space:nowrap}
.product-popover{font-size:13px;color:#263955}.popover-heading{display:flex;justify-content:space-between;gap:12px;padding:2px 0 10px;font-weight:600}.popover-heading span{color:#7a899e;font-size:12px;font-weight:400}.popover-items{max-height:clamp(80px, calc(100vh - 240px), 220px);overflow-y:auto;overscroll-behavior:contain}.popover-item{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:8px 0;border-top:1px solid #edf1f6}.popover-item span{min-width:0;overflow-wrap:anywhere}.popover-item strong{flex:none;font-weight:500}.popover-total{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #e6edf5;padding-top:10px;margin-top:4px}.popover-total span{color:#687990}.popover-total strong{text-align:right}.unit-totals{max-height:60px;overflow-y:auto;color:#687990;font-size:12px;margin-top:5px;overflow-wrap:anywhere}
</style>
