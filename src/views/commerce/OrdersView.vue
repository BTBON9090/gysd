<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElCascader, ElDatePicker, ElInput, ElOption, ElPagination, ElSelect, ElTag } from 'element-plus'
import { ClipboardList, Search } from 'lucide-vue-next'
import { CATEGORY_TREE, dateText, money, STATUS_LABEL, useCommerceStore, type Order, type OrderStatus } from '@/stores/commerce'

const c = useCommerceStore()
const router = useRouter()
const route = useRoute()
const filter = reactive({ park: String(route.query.park || ''), category: '', name: '', id: '', from: '', to: '' })
const applied = reactive({ ...filter })
const tab = ref('all')
const page = ref(1)
const pageSize = 20
const tabs: [string, string][] = [['all','全部'],['pending_payment','待支付'],['pending_contract','待签约'],['in_service','服务中'],['pending_acceptance','待验收'],['completed','已完成'],['cancelled','已取消']]
const filtered = computed(() => c.data.walletOpen ? c.data.orders.filter(o =>
  c.joinedParks.some(p => p.id === o.parkId) &&
  (!applied.park || o.parkId === applied.park) &&
  (!applied.category || o.category.startsWith(applied.category)) &&
  (!applied.name || o.serviceName.toLowerCase().includes(applied.name.trim().toLowerCase())) &&
  (!applied.id || o.id.toLowerCase().includes(applied.id.trim().toLowerCase())) &&
  (!applied.from || o.createdAt.slice(0, 10) >= applied.from) &&
  (!applied.to || o.createdAt.slice(0, 10) <= applied.to)
) : [])
const tabRows = computed(() => filtered.value.filter(o => tab.value === 'all' || o.status === tab.value))
const rows = computed(() => tabRows.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const hasFilter = computed(() => Object.values(applied).some(Boolean))
watch(() => tabRows.value.length, length => { page.value = Math.min(page.value, Math.max(1, Math.ceil(length / pageSize))) })
function count(status: string) { return filtered.value.filter(o => status === 'all' || o.status === status).length }
function query() { Object.assign(applied, filter); page.value = 1 }
function reset() { Object.assign(filter, { park: '', category: '', name: '', id: '', from: '', to: '' }); query() }
function pane(status: OrderStatus) { return status === 'pending_contract' ? 'contract' : status === 'in_service' ? 'delivery' : status === 'completed' ? 'settlement' : 'bill' }
function detail(o: Order, focus = false) { router.push({ path: '/order/' + o.id, query: focus ? { tab: pane(o.status) } : {} }) }
function primary(o: Order) {
  if (c.activeRefund(o.id)) return '处理退款'
  if (o.status === 'pending_contract') return o.contractState === 'waiting' ? '' : o.contractState === 'rejected' ? '重传合同' : '上传合同'
  if (o.status === 'in_service') return o.deliverables.length ? '重新提交' : '去履约'
  if (o.status === 'completed') return '去评价'
  return ''
}
function act(o: Order) { if (c.activeRefund(o.id)) router.push({ path: '/aftersale', query: { order: o.id } }); else if (o.status === 'completed') router.push({ path: '/review', query: { order: o.id } }); else detail(o, true) }
function delivery(o: Order) {
  if (o.deliverySnapshot) return o.deliverySnapshot
  const specs = c.data.services.find(s => s.id === o.serviceId)?.specs || []
  const spec = specs.find(s => s.price === o.amount) || specs[0]
  return spec ? '支付后 ' + spec.startDays + ' ' + spec.dayType + '开始 · ' + spec.deliveryDays + ' 天交付' : '按订单约定交付'
}
</script>

<template>
  <div class="biz-page order-page">
    <header class="biz-head order-head"><span class="order-head-icon"><ClipboardList :size="24" /></span><div><h1>订单管理</h1><p>查看来自已加入园区的订单，按交易阶段处理合同、交付与验收。</p></div><span class="order-total">共 <strong>{{ c.data.orders.length }}</strong> 笔订单</span></header>
    <div v-if="!c.data.walletOpen" class="biz-empty"><h3>开通钱包后查看订单</h3><p>交易数据将在支付平台开户后解锁。</p><ElButton type="primary" @click="router.push('/wallet')">前往我的钱包</ElButton></div>
    <template v-else>
      <div class="order-sticky list-sticky">
        <div class="order-filters">
          <ElSelect v-model="filter.park" clearable placeholder="全部已加入园区"><ElOption v-for="p in c.joinedParks" :key="p.id" :value="p.id" :label="p.name" /></ElSelect>
          <ElCascader :model-value="filter.category ? filter.category.split(' / ') : []" :options="CATEGORY_TREE" :props="{ checkStrictly: true }" clearable filterable placeholder="全部服务分类" @change="filter.category = Array.isArray($event) ? $event.join(' / ') : ''" />
          <ElInput v-model="filter.name" clearable placeholder="服务名称" @keyup.enter="query"><template #prefix><Search :size="14" /></template></ElInput>
          <ElInput v-model="filter.id" clearable placeholder="订单号" @keyup.enter="query"><template #prefix><Search :size="14" /></template></ElInput>
          <div class="order-date"><span>下单时间</span><ElDatePicker v-model="filter.from" type="date" value-format="YYYY-MM-DD" format="YYYY/MM/DD" placeholder="开始日期" popper-class="biz-date-popper" /><b>至</b><ElDatePicker v-model="filter.to" type="date" value-format="YYYY-MM-DD" format="YYYY/MM/DD" placeholder="结束日期" popper-class="biz-date-popper" /></div>
          <div class="order-filter-actions"><ElButton type="primary" @click="query">查询</ElButton><ElButton @click="reset">重置</ElButton></div>
        </div>
        <div class="biz-tabs order-tabs"><button v-for="[key, label] in tabs" :key="key" class="biz-tab" :class="{ active: tab === key }" @click="tab = key; page = 1">{{ label }} <span>{{ count(key) }}</span></button></div>
      </div>
      <div v-if="!rows.length" class="biz-empty"><h3>{{ c.data.orders.length ? '暂无符合条件的订单' : '暂无订单' }}</h3><p>{{ c.data.orders.length ? '调整筛选条件或查看其他状态。' : '客户下单后，订单会显示在这里。' }}</p><ElButton v-if="hasFilter" @click="reset">清空筛选</ElButton></div>
      <div v-else class="order-table-wrap"><table class="order-table"><thead><tr><th>订单信息</th><th>来源园区</th><th>交付方式</th><th>订单金额</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="o in rows" :key="o.id"><td class="order-info"><strong :title="o.serviceName">{{ o.serviceName }}</strong><span>{{ o.id }}</span><small>下单 {{ dateText(o.createdAt) }}</small></td><td class="order-park">{{ c.joinedParks.find(p => p.id === o.parkId)?.name || '—' }}</td><td class="order-delivery">{{ delivery(o) }}</td><td class="order-amount"><strong>{{ money(o.amount) }}</strong><small>已付 {{ money(o.paid) }}</small><small v-if="o.amount - o.paid > 0">待付 {{ money(o.amount - o.paid) }}</small></td><td><ElTag :type="o.status === 'completed' ? 'success' : o.status === 'cancelled' ? 'info' : o.status === 'pending_contract' ? 'warning' : 'primary'" effect="light">{{ STATUS_LABEL[o.status] }}</ElTag></td><td><div class="order-actions"><ElButton v-if="primary(o)" type="primary" plain @click="act(o)">{{ primary(o) }}</ElButton><ElButton text type="primary" @click="detail(o)">详情</ElButton></div></td></tr></tbody></table></div>
      <div v-if="tabRows.length > pageSize" class="order-pagination"><span>共 {{ tabRows.length }} 笔订单</span><ElPagination v-model:current-page="page" :page-size="pageSize" :total="tabRows.length" layout="prev, pager, next" background /></div>
    </template>
  </div>
</template>

<style scoped>
.order-page{max-width:1360px;min-width:890px}.order-head{justify-content:flex-start;align-items:center}.order-head-icon{display:grid;place-items:center;flex:none;width:46px;height:46px;border-radius:11px;background:#eaf0ff;color:#3659c2}.order-head>div{flex:1}.order-total{color:#78869b;font-size:12px;white-space:nowrap}.order-total strong{color:#284ab0;font-size:19px;font-variant-numeric:tabular-nums}
.order-filters{display:grid;grid-template-columns:minmax(155px,1.1fr) minmax(145px,1fr) minmax(135px,.9fr) minmax(130px,.85fr);gap:10px;align-items:center}.order-filters :deep(.el-select),.order-filters :deep(.el-cascader),.order-filters :deep(.el-input){width:100%;min-width:0}.order-date{grid-column:span 3;display:flex;align-items:center;gap:8px;min-width:0;color:#6b7a90;font-size:12px}.order-date span{white-space:nowrap}.order-date b{font-weight:400}.order-date :deep(.el-date-editor){width:150px;max-width:35%;height:32px}.order-filter-actions{display:flex;gap:8px;justify-content:flex-end}.order-filter-actions :deep(.el-button){margin:0}.order-tabs{margin:10px 0 9px;flex-wrap:nowrap;overflow-x:auto;border-bottom:0}.order-tabs .biz-tab{flex:none;padding:10px 13px;white-space:nowrap}.order-tabs .biz-tab span{font-size:11px;color:#8c99ac}.order-tabs .biz-tab.active span{color:#3153bd}
.order-table-wrap{overflow-x:auto;border:1px solid #e1e8f1;border-radius:11px;background:#fff}.order-table{width:100%;border-collapse:collapse;min-width:940px;text-align:left;font-size:12px}.order-table th{background:#f7f9fd;color:#6d7d94;font-weight:700;white-space:nowrap}.order-table th,.order-table td{padding:15px 13px;border-bottom:1px solid #ecf0f5;vertical-align:middle}.order-table tr:last-child td{border-bottom:0}.order-table tbody tr:hover{background:#fbfcff}.order-info{min-width:205px}.order-info strong{display:block;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#21314a;font-size:13px}.order-info span,.order-info small,.order-amount small{display:block;margin-top:5px;color:#8895a7;font-size:11px}.order-park{min-width:150px;max-width:210px;line-height:1.5;color:#46566d}.order-delivery{min-width:166px;max-width:195px;color:#52637a;line-height:1.5}.order-amount{min-width:135px;white-space:nowrap}.order-amount strong{color:#233853;font-size:15px;font-variant-numeric:tabular-nums}.order-actions{display:flex;align-items:center;gap:4px;white-space:nowrap}.order-actions :deep(.el-button){margin:0}.order-pagination{display:flex;justify-content:space-between;align-items:center;padding-top:18px;color:#77869b;font-size:12px}
@media(max-width:1130px){.order-filters{grid-template-columns:repeat(4,minmax(0,1fr))}.order-date{grid-column:span 3}.order-date :deep(.el-date-editor){width:130px}}
</style>
