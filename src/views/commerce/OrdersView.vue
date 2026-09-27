<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElCascader, ElDatePicker, ElInput, ElOption, ElPagination, ElPopover, ElSelect, ElTag } from 'element-plus'
import { ClipboardList, Search } from 'lucide-vue-next'
import { CATEGORY_TREE, dateText, money, STATUS_LABEL, useCommerceStore, type Order, type OrderStatus } from '@/stores/commerce'

import { orderStages, outstanding, STAGE_LABEL } from '@/utils/orderStages'

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
function currentPhase(o: Order) {
  const stages = orderStages(o)
  const index = stages.findIndex(s => s.status !== 'accepted')
  return { stage: stages[index < 0 ? stages.length - 1 : index], number: index < 0 ? stages.length : index + 1 }
}
function unpaidPhase(o: Order) { return orderStages(o).map((s,i) => s.amount > s.paid ? `第${i+1}期` : '').filter(Boolean).join('、') }
function pane(status: OrderStatus) { return status === 'pending_contract' ? 'contract' : status === 'in_service' || status === 'pending_acceptance' ? 'delivery' : status === 'completed' ? 'settlement' : 'bill' }
function detail(o: Order, focus = false) { router.push({ path: '/order/' + o.id, query: focus ? { tab: pane(o.status) } : {} }) }
function primary(o: Order) {
  if (c.activeRefund(o.id)) return c.activeRefund(o.id)?.status === 'pending' ? '处理退款' : '查看退款'
  if (o.status === 'pending_contract') return o.contractState === 'waiting' ? '' : o.contractState === 'rejected' ? '重传合同' : '上传合同'
  if (o.status === 'in_service') return o.deliverables.length ? '重新提交' : '去履约'
  if (o.status === 'completed') return '去评价'
  return ''
}
function act(o: Order) { if (c.activeRefund(o.id)) router.push({ path: '/order/' + o.id, query: { tab: 'bill', refund: c.activeRefund(o.id)!.id } }); else if (o.status === 'completed') router.push({ path: '/review', query: { order: o.id } }); else detail(o, true) }
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
      <div v-else class="order-table-wrap"><table class="order-table"><colgroup><col style="width:15%" /><col style="width:19%" /><col style="width:13%" /><col style="width:18%" /><col style="width:16%" /><col style="width:9%" /><col style="width:10%" /></colgroup><thead><tr><th>订单 / 下单时间</th><th>服务信息</th><th>来源园区</th><th>履约方式 / 进度</th><th class="align-right">整单金额汇总</th><th>订单状态</th><th class="align-right">操作</th></tr></thead><tbody>
        <tr v-for="o in rows" :key="o.id">
          <td><button class="order-number" :title="o.id" @click="detail(o)">{{ o.id }}</button><small>{{ dateText(o.createdAt) }}</small></td>
          <td class="order-info"><button class="service-name" @click="detail(o)">{{ o.serviceName }}</button><small class="category" :title="o.category">{{ o.category }}</small><small>{{ o.specSnapshot?.name || '标准规格' }} · {{ o.quantity || 1 }} {{ o.specSnapshot?.unit || '项' }}</small></td>
          <td class="order-park">{{ c.joinedParks.find(p => p.id === o.parkId)?.name || '—' }}</td>
          <td class="order-delivery"><span>{{ o.stages?.length ? '分期付款 · 分期验收' : '一次付款 · 一次验收' }}</span><small>周期 {{ o.specSnapshot?.deliveryDays || '—' }} 天 · {{ orderStages(o).length }} 期</small><small>当前第 {{ currentPhase(o).number }} / {{ orderStages(o).length }} 期 · {{ STAGE_LABEL[currentPhase(o).stage.status] }}</small><ElPopover trigger="click" placement="bottom" :width="650"><template #reference><button type="button" class="phase-ledger-link">查看各期账单 ↗</button></template><div class="phase-ledger"><h3>各期付款与退款</h3><p>{{ o.serviceName }}</p><table><thead><tr><th>阶段</th><th>应付</th><th>累计支付</th><th>已退款</th><th>待付</th></tr></thead><tbody><tr v-for="(stage,index) in orderStages(o)" :key="stage.id"><td><strong>第 {{ index+1 }} 期 · {{ stage.name }}</strong><small>{{ STAGE_LABEL[stage.status] }}</small></td><td>{{ money(stage.amount) }}</td><td>{{ money(stage.paid) }}</td><td>{{ money(stage.refunded) }}</td><td>{{ money(Math.max(0,stage.amount-stage.paid)) }}</td></tr></tbody></table><p v-if="c.activeRefund(o.id)" class="ledger-refund">退款申请 {{ money(c.activeRefund(o.id)!.requested) }} · {{ orderStages(o).find(s=>s.id===c.activeRefund(o.id)?.stageId)?.name || '整笔订单' }} · {{ STATUS_LABEL[c.activeRefund(o.id)!.status] }}（尚未计入已退款）</p><small>已退款单独核算，不会重新计入待付。</small></div></ElPopover></td>
          <td class="order-amount align-right"><strong><span class="amount-scope">总额 </span>{{ money(o.amount) }}</strong><small class="paid">累计支付 {{ money(o.paid) }}</small><small v-if="outstanding(o)" :class="o.status === 'cancelled' ? '' : 'unpaid'">{{ o.status === 'cancelled' ? '未付' : '待付' }} {{ money(outstanding(o)) }}</small><small v-if="outstanding(o) && o.stages?.length" class="phase-due">{{ unpaidPhase(o) }}</small><small v-if="o.refunded" class="refunded">累计退款 {{ money(o.refunded) }}</small></td>
          <td class="order-state"><span class="status-dot" :class="o.status">{{ STATUS_LABEL[o.status] }}</span><ElTag v-if="c.activeRefund(o.id)" type="danger" size="small" effect="plain">{{ c.activeRefund(o.id)?.status === 'pending' ? '退款待处理' : c.activeRefund(o.id)?.status === 'client_confirm' ? '退款待确认' : '退款已拒绝' }}</ElTag><small v-else-if="o.contractState === 'waiting' && o.status === 'pending_contract'">合同待确认</small></td>
          <td><div class="order-actions"><ElButton v-if="primary(o)" text type="primary" @click="act(o)">{{ primary(o) }}</ElButton><ElButton text type="primary" @click="detail(o)">详情</ElButton></div></td>
        </tr>
      </tbody></table></div>
      <div v-if="tabRows.length > pageSize" class="order-pagination"><span>共 {{ tabRows.length }} 笔订单</span><ElPagination v-model:current-page="page" :page-size="pageSize" :total="tabRows.length" layout="prev, pager, next" background /></div>
    </template>
  </div>
</template>

<style scoped>
.order-page{max-width:var(--biz-content-width);min-width:0}.order-head{justify-content:flex-start;align-items:center}.order-head-icon{display:grid;place-items:center;flex:none;width:46px;height:46px;border-radius:11px;background:#eaf0ff;color:#3659c2}.order-head>div{flex:1}.order-total{color:#78869b;font-size:12px;white-space:nowrap}.order-total strong{color:#284ab0;font-size:19px;font-variant-numeric:tabular-nums}
.order-filters{display:grid;grid-template-columns:minmax(155px,1.1fr) minmax(145px,1fr) minmax(135px,.9fr) minmax(130px,.85fr);gap:10px;align-items:center}.order-filters :deep(.el-select),.order-filters :deep(.el-cascader),.order-filters :deep(.el-input){width:100%;min-width:0}.order-date{grid-column:span 3;display:flex;align-items:center;gap:8px;min-width:0;color:#6b7a90;font-size:12px}.order-date span{white-space:nowrap}.order-date b{font-weight:400}.order-date :deep(.el-date-editor){width:150px;max-width:35%;height:32px}.order-filter-actions{display:flex;gap:8px;justify-content:flex-end}.order-filter-actions :deep(.el-button){margin:0}.order-tabs{margin:10px 0 9px;flex-wrap:nowrap;overflow-x:auto;border-bottom:0}.order-tabs .biz-tab{flex:none;padding:10px 13px;white-space:nowrap}.order-tabs .biz-tab span{font-size:11px;color:#8c99ac}.order-tabs .biz-tab.active span{color:#3153bd}
.order-table-wrap{overflow:hidden;border:1px solid #e2e8f0;border-radius:9px;background:#fff}.order-table{width:100%;table-layout:fixed;border-collapse:collapse;text-align:left;font-size:12px;line-height:1.5}.order-table th{background:#f7f9fc;color:#728098;font-size:11px;font-weight:500;white-space:nowrap}.order-table th,.order-table td{padding:16px 12px;border-bottom:1px solid #ecf0f5;vertical-align:top}.order-table th{padding-top:11px;padding-bottom:11px}.order-table tr:last-child td{border-bottom:0}.order-table tbody tr:hover{background:#fafcff}.order-table small{display:block;margin-top:5px;color:#8995a7;font-size:11px}.order-number,.service-name{display:block;width:100%;padding:0;border:0;background:none;cursor:pointer;font:inherit;text-align:left}.order-number{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#365cc1;font-variant-numeric:tabular-nums}.service-name{color:#26374e;font-weight:650;line-height:1.55}.service-name:hover{color:#365cc1}.category{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.order-park{color:#51617a}.order-delivery{color:#455771}.order-amount{white-space:nowrap;font-variant-numeric:tabular-nums}.order-amount strong{color:#21324b;font-size:14px}.order-table .paid{color:#278465}.order-table .unpaid{color:#af6d25}.order-table .refunded{color:#b75a5a}.align-right{text-align:right}.order-state .el-tag{margin-top:9px;font-size:10px;padding:0 5px;white-space:nowrap}.status-dot{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.status-dot::before{content:'';width:5px;height:5px;border-radius:50%;background:#4a72d4}.status-dot.completed::before{background:#2a977d}.status-dot.cancelled::before{background:#a3adbb}.status-dot.pending_contract::before{background:#9b71ce}.order-actions{display:flex;flex-direction:column;align-items:flex-end;gap:3px}.order-actions :deep(.el-button){margin:0;padding:3px 0;height:23px;font-size:12px}.order-pagination{display:flex;justify-content:space-between;align-items:center;padding-top:18px;color:#77869b;font-size:12px}
</style>

<style scoped>
.order-table th,.order-table td{padding-left:10px;padding-right:10px}.order-table td:last-child{padding-right:14px}.order-actions{gap:6px}.order-actions :deep(.el-button){white-space:nowrap}.amount-scope{font-size:10px;font-weight:400;color:#8090a7}.order-table .phase-due{margin-top:0;color:#9ba6b6;font-size:10px}.phase-ledger-link{border:0;background:none;padding:6px 0 0;color:#365cc1;font-size:11px;cursor:pointer}.phase-ledger h3{margin:0;font-size:15px;color:#263954}.phase-ledger p{margin:6px 0 14px;font-size:12px;color:#75849a}.phase-ledger table{width:100%;border-collapse:collapse;font-size:12px}.phase-ledger td,.phase-ledger th{padding:10px 6px;text-align:right;border-bottom:1px solid #e7edf5;white-space:nowrap}.phase-ledger td:first-child,.phase-ledger th:first-child{text-align:left;white-space:normal}.phase-ledger th{background:#f7f9fc;font-size:11px;font-weight:500}.phase-ledger strong{font-size:12px;font-weight:600}.phase-ledger small{display:block;font-size:11px;color:#8290a4;margin-top:5px}.phase-ledger .ledger-refund{padding:10px;margin:12px 0 6px;background:#fff4ed;color:#a46636;border-radius:6px}
</style>
