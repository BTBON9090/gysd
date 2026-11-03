<script setup lang="ts">
import { computed } from 'vue'
import { ElInputNumber, ElOption, ElSelect } from 'element-plus'
import { salePrice, type Supply } from '@/stores/products'

const props = defineProps<{ value: Supply; priceOnly?: boolean; taxLocked?: boolean }>()
const sale = computed(() => salePrice(props.value))
const taxMultiplier = computed(() => 1 + (Number(props.value.tax) || 0) / 100)
const money = (value: number) => `¥${value.toFixed(2)}`
const margin = (price: number) => price > 0 ? `${((price - (Number(props.value.cost) || 0)) / price * 100).toFixed(2)}%` : '—'
</script>

<template>
  <div class="supply-fields">
    <div v-if="!priceOnly" class="supply-quantities">
      <label class="supply-field">货期（天）<ElInputNumber v-model="props.value.leadDays" :min="0" :max="9999" /></label>
      <label class="supply-field">最小起售量<ElInputNumber v-model="props.value.minimum" :min="1" /></label>
      <label class="supply-field">递增量<ElInputNumber v-model="props.value.increment" :min="1" /></label>
      <label class="supply-field">库存<ElInputNumber v-model="props.value.stock" :min="0" /></label>
    </div>

    <div class="price-settings">
      <label class="supply-field">税点
        <ElSelect v-model="props.value.tax" :disabled="taxLocked" aria-label="税点">
          <ElOption v-for="n in [0,1,3,6,9,13]" :key="n" :label="n+'%'" :value="n" />
        </ElSelect>
        <small v-if="taxLocked" class="tax-lock-hint">由统一税点设置</small>
      </label>
      <div class="promotion-group">
        <label class="supply-field">优惠类型
          <ElSelect v-model="props.value.promotion">
            <ElOption label="无优惠" value="none" />
            <ElOption label="折扣价" value="discount" />
            <ElOption label="固定价" value="fixed" />
          </ElSelect>
        </label>
        <label v-if="props.value.promotion==='discount'" class="supply-field">折扣比例（%）
          <ElInputNumber v-model="props.value.discount" :min="0" :max="100" :precision="2" />
        </label>
        <label v-if="props.value.promotion==='fixed'" class="supply-field">固定销售价（元，未税）
          <ElInputNumber v-model="props.value.fixed" :min="0" :precision="2" />
        </label>
      </div>
    </div>

    <div class="price-table-wrap">
      <table class="price-table">
        <thead><tr><th scope="col">价格（元）</th><th scope="col">采购价</th><th scope="col">原价</th><th scope="col">销售价</th></tr></thead>
        <tbody>
          <tr>
            <th scope="row">未税价</th>
            <td><ElInputNumber v-model="props.value.cost" :min="0" :precision="2" aria-label="采购价（元，未税）" /></td>
            <td><ElInputNumber v-model="props.value.original" :min="0" :precision="2" aria-label="原价（元，未税）" /></td>
            <td class="calculated">{{ money(sale) }}</td>
          </tr>
          <tr>
            <th scope="row">含税价</th>
            <td>{{ money((Number(props.value.cost) || 0) * taxMultiplier) }}</td>
            <td>{{ money((Number(props.value.original) || 0) * taxMultiplier) }}</td>
            <td class="calculated">{{ money(sale * taxMultiplier) }}</td>
          </tr>
          <tr>
            <th scope="row">毛利率</th>
            <td>—</td>
            <td>{{ margin(Number(props.value.original) || 0) }}</td>
            <td>{{ margin(sale) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="props.value.promotion==='discount'" class="discount-hint">折扣价按原价 × 百分比计算销售价，百分比最多两位小数（如 85.5 表示按原价的 85.5% 售卖）。</p>
  </div>
</template>

<style scoped>
.supply-fields{min-width:0}
.supply-quantities{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-bottom:24px}
.supply-field{display:flex;flex-direction:column;gap:7px;min-width:0;color:#34445c;font-size:13px;font-weight:600}
.supply-fields :deep(.el-input-number),.supply-fields :deep(.el-select){width:100%;min-width:0}
.supply-fields :deep(.el-input__wrapper),.supply-fields :deep(.el-select__wrapper){box-sizing:border-box;min-height:40px}
.price-settings{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:32px;margin-bottom:20px}
.promotion-group{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.price-table-wrap{overflow-x:auto;border:1px solid #e0e7f2;border-radius:8px}
.price-table{width:100%;min-width:620px;border-collapse:collapse;table-layout:fixed;color:#405675;font-size:13px;text-align:left}
.price-table th,.price-table td{padding:10px 12px;border-bottom:1px solid #e8edf5;font-weight:400}
.price-table thead th{background:#f7f9fc;color:#687b98;font-weight:600}
.price-table th:first-child{width:108px;color:#687b98}
.price-table tbody tr:last-child th,.price-table tbody tr:last-child td{border-bottom:0}
.price-table td.calculated{color:#233e6a;font-weight:600}
.discount-hint{margin:12px 0 0;color:#71829b;font-size:12px;line-height:1.6}
.tax-lock-hint{font-size:12px;line-height:1.4;color:#78899f;font-weight:400}
@media(max-width:760px){.supply-quantities{grid-template-columns:repeat(2,minmax(0,1fr))}.price-settings{grid-template-columns:1fr;gap:16px}}
</style>
