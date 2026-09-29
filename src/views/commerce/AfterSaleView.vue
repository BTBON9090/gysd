<script setup lang="ts">
import ListPagination from '@/components/commerce/ListPagination.vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElCascader, ElDatePicker, ElInput, ElOption, ElSelect, ElTag } from 'element-plus'
import { CATEGORY_TREE, dateText, money, STATUS_LABEL, useCommerceStore, type Refund } from '@/stores/commerce'

import RefundDialog from '@/components/commerce/RefundDialog.vue'

const c = useCommerceStore()
const router = useRouter()
const route = useRoute()
const filter = reactive({ park: '', category: '', service: '', order: String(route.query.order || ''), refund: '', from: '', to: '' })
const applied = reactive({ ...filter })
watch(() => route.query.order, value => { filter.order = String(value || ''); applied.order = filter.order; page.value = 1 })
const tab = ref('all')
const page = ref(1)
const target = ref<Refund | null>(null)
const dialog = ref(false)
const mode = ref<'agree' | 'reject' | 'change' | 'view'>('view')
const form = reactive({ amount: 0, decision: 'continue' as 'close' | 'continue', note: '' })
const tabs = [['all', '全部'], ['pending', '待处理'], ['refunded', '已退款'], ['rejected', '已驳回'], ['cancelled', '已取消']]
const order = (item: Refund) => c.data.orders.find(o => o.id === item.orderId)
function matchTab(item: Refund, key: string) { return key === 'all' ? item.status !== 'cancelled' : key === 'pending' ? ['pending', 'client_confirm'].includes(item.status) : item.status === key }
const filtered = computed(() => c.data.walletOpen ? c.data.refunds.filter(item => {
  const o = order(item)
  return o && (!applied.park || o.parkId === applied.park) && (!applied.category || o.category.startsWith(applied.category)) && (!applied.service || o.serviceName.includes(applied.service)) && (!applied.order || o.id.includes(applied.order)) && (!applied.refund || item.id.includes(applied.refund)) && (!applied.from || item.createdAt.slice(0, 10) >= applied.from) && (!applied.to || item.createdAt.slice(0, 10) <= applied.to)
}) : [])
const tabRows = computed(() => filtered.value.filter(x => matchTab(x, tab.value)))
const rows = computed(() => tabRows.value.slice((page.value - 1) * 20, page.value * 20))
watch(() => tabRows.value.length, length => { page.value = Math.min(page.value, Math.max(1, Math.ceil(length / 20))) })
const count = (key: string) => filtered.value.filter(x => matchTab(x, key)).length
function query() { Object.assign(applied, filter); page.value = 1 }
function reset() { Object.assign(filter, { park: '', category: '', service: '', order: '', refund: '', from: '', to: '' }); tab.value = 'all'; query() }
function open(item: Refund, action: typeof mode.value) {
  target.value = item
  mode.value = action
  form.amount = item.status === 'client_confirm' ? item.agreed : item.requested
  form.decision = item.decision
  form.note = ''
  dialog.value = true
}
function goOrder(item: Refund) { router.push({ path: `/order/${item.orderId}`, query: { tab: 'bill', from: 'aftersale', refund: item.id } }) }
watch(() => route.query.refund, value => { if (typeof value !== 'string') return; const item = c.data.refunds.find(x => x.id === value); if (item) open(item, route.query.action === 'process' && item.status === 'pending' ? 'agree' : 'view') }, { immediate: true })
</script>

<template>
  <div class="biz-page">
    <header class="biz-head"><div><h1>售后管理</h1></div></header>
    <div v-if="!c.data.walletOpen" class="biz-empty"><h3>开通钱包后查看售后</h3><ElButton type="primary" @click="router.push('/wallet')">前往我的钱包</ElButton></div>
    <template v-else>
      <div class="biz-toolbar"><ElSelect v-model="filter.park" clearable placeholder="全部来源园区"><ElOption v-for="p in c.joinedParks" :key="p.id" :value="p.id" :label="p.name" /></ElSelect><ElCascader :model-value="filter.category?filter.category.split(' / '):[]" :options="CATEGORY_TREE" :props="{checkStrictly:true}" clearable filterable placeholder="全部分类" @change="filter.category=Array.isArray($event)?$event.join(' / '):''" /><ElInput v-model="filter.service" placeholder="服务名称" clearable /><ElInput v-model="filter.order" placeholder="订单号" clearable /><ElInput v-model="filter.refund" placeholder="退款单号" clearable /><div class="date-filter"><span>申请时间</span><ElDatePicker :editable="false" v-model="filter.from" type="date" value-format="YYYY-MM-DD" format="YYYY/MM/DD" placeholder="开始日期" popper-class="biz-date-popper" /><span>至</span><ElDatePicker :editable="false" v-model="filter.to" type="date" value-format="YYYY-MM-DD" format="YYYY/MM/DD" placeholder="结束日期" popper-class="biz-date-popper" /></div><ElButton type="primary" @click="query">查询</ElButton><ElButton @click="reset">重置</ElButton></div>
      <div class="biz-tabs"><button v-for="[key,label] in tabs" :key="key" class="biz-tab" :class="{active:tab===key}" @click="tab=key;page=1">{{ label }} {{ count(key) }}</button></div>
      <div v-if="!rows.length" class="biz-empty"><h3>{{c.data.refunds.length?'暂无匹配的售后申请':'暂无售后申请'}}</h3><p>客户发起的退款申请将显示在这里。</p><ElButton v-if="c.data.refunds.length" @click="reset">清空筛选</ElButton></div>
      <table v-else class="biz-table"><thead><tr><th>退款单 / 服务</th><th>原因</th><th>来源园区</th><th>退款金额</th><th>状态</th><th>申请时间</th><th>操作</th></tr></thead><tbody><tr v-for="item in rows" :key="item.id"><td><strong>{{order(item)?.serviceName}}</strong><br><span class="biz-muted">{{item.id.slice(0,8)}} · 订单 {{item.orderId}}</span></td><td>{{item.reason}}</td><td>{{c.joinedParks.find(p=>p.id===order(item)?.parkId)?.name||'—'}}</td><td><strong><b class="money-value">{{ money(item.status==='client_confirm'?item.agreed:item.requested) }}</b></strong><br><span v-if="item.status==='client_confirm'" class="biz-muted">原申请 <b class="money-value">{{ money(item.requested) }}</b></span></td><td><ElTag :type="item.status==='refunded'?'success':item.status==='rejected'?'danger':'info'">{{STATUS_LABEL[item.status]}}</ElTag></td><td>{{dateText(item.createdAt)}}</td><td><div class="biz-actions"><ElButton v-if="item.status==='pending'" text type="primary" @click="open(item,'agree')">处理退款</ElButton><ElButton v-else text @click="open(item,'view')">退款详情</ElButton><ElButton text @click="goOrder(item)">查看订单</ElButton></div></td></tr></tbody></table>
      <ListPagination v-model:page="page" :page-size="20" :total="tabRows.length" noun="笔退款" />
    </template>
    <RefundDialog v-model="dialog" :refund-id="target?.id" :mode="mode" />
  </div>
</template>
<style scoped>.date-filter{display:flex;align-items:center;gap:6px;color:#69788d;font-size:12px}.date-filter :deep(.el-date-editor){width:134px;height:32px}</style>
