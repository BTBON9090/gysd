<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElCascader, ElDialog, ElInput, ElInputNumber, ElMessage, ElOption, ElSelect, ElTag } from 'element-plus'
import { CATEGORY_TREE, dateText, money, STATUS_LABEL, useCommerceStore, type Refund } from '@/stores/commerce'

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
function submit() {
  if (!target.value) return
  if (!c.decideRefund(target.value.id, mode.value as 'agree' | 'reject' | 'change', form.amount, form.decision, form.note)) { ElMessage.error('请检查退款金额与处理说明'); return }
  dialog.value = false
  ElMessage.success(mode.value === 'change' ? '已提交客户确认' : mode.value === 'reject' ? '已驳回退款' : '退款处理完成')
}
function goOrder(item: Refund) { router.push({ path: `/order/${item.orderId}`, query: { tab: 'bill', from: 'aftersale', refund: item.id } }) }
</script>

<template>
  <div class="biz-page">
    <header class="biz-head"><div><h1>售后管理</h1><p>处理客户发起的退款，查看改价确认与退款结果。</p></div></header>
    <div v-if="!c.data.walletOpen" class="biz-empty"><h3>开通钱包后查看售后</h3><ElButton type="primary" @click="router.push('/wallet')">前往我的钱包</ElButton></div>
    <template v-else>
      <div class="biz-toolbar"><ElSelect v-model="filter.park" clearable placeholder="全部来源园区"><ElOption v-for="p in c.joinedParks" :key="p.id" :value="p.id" :label="p.name" /></ElSelect><ElCascader :model-value="filter.category?filter.category.split(' / '):[]" :options="CATEGORY_TREE" :props="{checkStrictly:true}" clearable filterable placeholder="全部分类" @change="filter.category=Array.isArray($event)?$event.join(' / '):''" /><ElInput v-model="filter.service" placeholder="服务名称" clearable /><ElInput v-model="filter.order" placeholder="订单号" clearable /><ElInput v-model="filter.refund" placeholder="退款单号" clearable /><label class="date-filter">申请时间 <input v-model="filter.from" type="date"> 至 <input v-model="filter.to" type="date"></label><ElButton type="primary" @click="query">查询</ElButton><ElButton @click="reset">重置</ElButton></div>
      <div class="biz-tabs"><button v-for="[key,label] in tabs" :key="key" class="biz-tab" :class="{active:tab===key}" @click="tab=key;page=1">{{ label }} {{ count(key) }}</button></div>
      <div v-if="!rows.length" class="biz-empty"><h3>{{c.data.refunds.length?'暂无匹配的售后申请':'暂无售后申请'}}</h3><p>客户发起的退款申请将显示在这里。</p><ElButton v-if="c.data.refunds.length" @click="reset">清空筛选</ElButton></div>
      <table v-else class="biz-table"><thead><tr><th>退款单 / 服务</th><th>原因</th><th>来源园区</th><th>退款金额</th><th>状态</th><th>申请时间</th><th>操作</th></tr></thead><tbody><tr v-for="item in rows" :key="item.id"><td><strong>{{order(item)?.serviceName}}</strong><br><span class="biz-muted">{{item.id.slice(0,8)}} · 订单 {{item.orderId}}</span></td><td>{{item.reason}}</td><td>{{c.joinedParks.find(p=>p.id===order(item)?.parkId)?.name||'—'}}</td><td><strong>{{money(item.status==='client_confirm'?item.agreed:item.requested)}}</strong><br><span v-if="item.status==='client_confirm'" class="biz-muted">原申请 {{money(item.requested)}}</span></td><td><ElTag :type="item.status==='refunded'?'success':item.status==='rejected'?'danger':'info'">{{STATUS_LABEL[item.status]}}</ElTag></td><td>{{dateText(item.createdAt)}}</td><td><div class="biz-actions"><ElButton v-if="item.status==='pending'" text type="primary" @click="open(item,'agree')">处理退款</ElButton><ElButton v-else text @click="open(item,'view')">退款详情</ElButton><ElButton text @click="goOrder(item)">查看订单</ElButton></div></td></tr></tbody></table>
      <div v-if="tabRows.length>20" class="biz-footer"><span>共 {{tabRows.length}} 笔退款</span><div class="biz-actions"><ElButton :disabled="page<=1" @click="page--">上一页</ElButton>{{page}}<ElButton :disabled="page*20>=tabRows.length" @click="page++">下一页</ElButton></div></div>
    </template>
    <ElDialog v-model="dialog" :title="mode==='view'?'退款详情':mode==='agree'?'处理退款':mode==='change'?'修改退款金额':'驳回退款'" width="520px"><template v-if="target"><div class="biz-grid"><div class="biz-field full">退款单号 <strong>{{target.id}}</strong></div><div class="biz-field full">客户申请金额 <strong>{{money(target.requested)}}</strong></div><div v-if="mode==='view'" class="biz-field full">当前状态 <strong>{{STATUS_LABEL[target.status]}}</strong></div><div v-if="mode==='view' && target.status==='client_confirm'" class="biz-field full">调整后金额 <strong>{{money(target.agreed)}}</strong></div><div v-if="mode==='view' && target.note" class="biz-field full">处理说明 <strong>{{target.note}}</strong></div><label v-if="mode!=='view' && mode!=='reject'" class="biz-field full">同意退款金额（元） <ElInputNumber v-model="form.amount" :min="0.01" :max="(order(target)?.paid||0)-(order(target)?.refunded||0)" :precision="2" /></label><label v-if="mode!=='view' && mode!=='reject'" class="biz-field full">后续处理 <ElSelect v-model="form.decision"><ElOption label="继续履约" value="continue" /><ElOption label="关闭订单" value="close" /></ElSelect></label><label v-if="mode!=='view'" class="biz-field full">{{mode==='change'?'调整说明（必填）':mode==='reject'?'驳回理由（必填）':'处理说明'}} <ElInput v-model="form.note" type="textarea" :rows="3" /></label></div><p v-if="mode!=='view'" class="biz-note warn">对客发票已开具时须先完成退票；修改金额后需客户确认。</p><div v-if="mode==='agree'" class="biz-actions" style="margin-top:15px"><ElButton @click="mode='change'">修改金额</ElButton><ElButton type="danger" plain @click="mode='reject'">驳回退款</ElButton></div></template><template #footer><ElButton @click="dialog=false">{{mode==='view'?'关闭':'取消'}}</ElButton><ElButton v-if="mode==='view' && target" @click="goOrder(target)">查看原订单</ElButton><ElButton v-if="mode!=='view'" type="primary" @click="submit">确认提交</ElButton></template></ElDialog>
  </div>
</template>
<style scoped>.date-filter{display:flex;align-items:center;gap:6px;color:#69788d;font-size:12px}.date-filter input{width:125px;height:32px;border:1px solid #d8e1ee;border-radius:7px;padding:0 6px;font:inherit;color:#34465c}</style>
