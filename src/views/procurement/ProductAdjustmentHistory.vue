<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import ProductPriceHistoryChart from './ProductPriceHistoryChart.vue'

type PriceRecord = { time:string; original:number; sale:number; tax?:number }
const props = defineProps<{ parkName:string; records:PriceRecord[] }>()
const emit = defineEmits<{ back:[] }>()
const mode = ref<'taxed'|'untaxed'>('taxed')
watch(() => props.parkName, () => { mode.value='taxed' })
const ordered = computed(() => [...props.records].reverse())
function displayPrice(price:number, tax?:number) {
  if (!Number.isFinite(price)) return '—'
  if (mode.value === 'untaxed') return `¥${price.toFixed(2)}`
  return typeof tax === 'number' && Number.isFinite(tax) ? `¥${(price * (1 + tax / 100)).toFixed(2)}` : '—'
}
</script>

<template>
  <div class="adjustment-history">
    <header class="history-header">
      <button type="button" class="history-back" @click="emit('back')"><ArrowLeft :size="15"/>返回调价</button>
      <div class="history-heading"><h3>历史价格</h3><p>{{ parkName }}</p></div>
    </header>
    <div class="history-toolbar">
      <div class="history-mode" aria-label="价格口径"><span>价格口径</span><button type="button" :class="{active:mode==='taxed'}" :aria-pressed="mode==='taxed'" @click="mode='taxed'">含税</button><button type="button" :class="{active:mode==='untaxed'}" :aria-pressed="mode==='untaxed'" @click="mode='untaxed'">未税</button></div>
    </div>
    <p class="history-note">记录价格被替换时的价格；旧记录若未保存历史税率，含税价格显示为“—”。</p>
    <ProductPriceHistoryChart :records="records" :mode="mode"/>
    <div v-if="ordered.length" class="history-table-wrap">
      <table class="history-table"><thead><tr><th>替换时间</th><th>{{mode==='taxed'?'含税原价':'未税原价'}}</th><th>{{mode==='taxed'?'含税销售价':'未税销售价'}}</th></tr></thead><tbody><tr v-for="(record,index) in ordered" :key="index"><td>{{record.time}}</td><td>{{displayPrice(record.original,record.tax)}}</td><td>{{displayPrice(record.sale,record.tax)}}</td></tr></tbody></table>
    </div>
  </div>
</template>

<style scoped>
.adjustment-history{min-width:0}.history-header{display:flex;align-items:flex-start;gap:18px;margin-bottom:14px}.history-back{display:inline-flex;align-items:center;gap:5px;flex:none;margin:1px 0 0;padding:6px 9px;border:0;border-radius:5px;background:transparent;color:#315bc8;font:inherit;font-size:13px;cursor:pointer}.history-back:hover{background:#edf3ff}.history-heading{min-width:0}.history-heading h3{margin:0;color:#263a56;font-size:16px}.history-heading p{margin:6px 0 0;color:#718199;font-size:13px;line-height:1.5;overflow-wrap:anywhere}.history-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px}.history-mode{display:flex;align-items:center;gap:6px;color:#718198;font-size:12px}.history-mode span{margin-right:4px}.history-mode button{border:1px solid #dfe6ef;border-radius:5px;background:#fff;color:#667990;padding:4px 10px;cursor:pointer;font:inherit}.history-mode button.active{border-color:#6a8ee3;background:#edf3ff;color:#285ac7}.history-note{margin:10px 0 0;color:#718198;font-size:12px;line-height:1.6}.history-table-wrap{overflow-x:auto;margin-top:16px;border:1px solid #e5eaf2;border-radius:6px}.history-table{border-collapse:collapse;width:100%;text-align:left;font-size:13px;font-variant-numeric:tabular-nums}.history-table th,.history-table td{padding:11px 14px;border-bottom:1px solid #edf1f6;white-space:nowrap}.history-table th{background:#f7f9fc;color:#728199;font-size:12px;font-weight:600}.history-table td{color:#34475f}.history-table tr:last-child td{border-bottom:0}.history-table th:not(:first-child),.history-table td:not(:first-child){text-align:right}
</style>
