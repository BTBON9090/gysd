<script setup lang="ts">
import MoneyText from '@/components/commerce/MoneyText.vue'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElDialog, ElInput, ElMessage, ElTag } from 'element-plus'
import { ArrowLeft, Check, ChevronDown, ChevronRight, Download, FileText, MessageCircle, Upload, X } from 'lucide-vue-next'
import RefundDialog from '@/components/commerce/RefundDialog.vue'
import { dateText, money, STATUS_LABEL, useCommerceStore, type OrderStage, type Refund } from '@/stores/commerce'
import { orderStages, outstanding, netPaid, STAGE_LABEL } from '@/utils/orderStages'
import { saveDemoDocument, resolveDemoImage } from '@/utils/demoMedia'

const c = useCommerceStore()
const route = useRoute()
const router = useRouter()
const order = computed(() => c.data.orders.find(o => o.id === route.params.id))
const stages = computed(() => order.value ? orderStages(order.value) : [])
const currentStage = computed(() => stages.value.find(s => s.status !== 'accepted'))
const refunds = computed(() => c.data.refunds.filter(r => r.orderId === order.value?.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)))
const activeRefund = computed(() => order.value ? c.activeRefund(order.value.id) : undefined)
const invoices = computed(() => c.data.invoices.filter(i => i.kind === 'customer' && i.orderIds.includes(order.value?.id || '')))
const issued = computed(() => invoices.value.filter(i => i.status === 'issued').reduce((n,i) => n + (i.amounts?.[order.value!.id] ?? i.amount / i.orderIds.length), 0))
const spec = computed(() => order.value?.specSnapshot)
const park = computed(() => c.data.parks.find(p => p.id === order.value?.parkId)?.name || '—')
const completedCount = computed(() => stages.value.filter(s => s.status === 'accepted').length)
const paidCount = computed(() => stages.value.filter(s => s.paid >= s.amount).length)
const tabs = [['bill','账单明细'],['contract','合同协议'],['delivery','履约验收'],['settlement','结算与评价'],['service','服务详情']] as const
const tab = ref(tabs.some(([key]) => key === route.query.tab) ? String(route.query.tab) : activeRefund.value ? 'bill' : order.value?.status === 'pending_contract' ? 'contract' : ['in_service','pending_acceptance'].includes(order.value?.status || '') ? 'delivery' : 'bill')
watch(() => route.query.tab, value => { if (tabs.some(([key]) => key === value)) tab.value = String(value) })
function selectTab(key: string) { tab.value = key; router.replace({ query: { ...route.query, tab: key } }) }
const expanded = ref<string | undefined>(currentStage.value?.id || stages.value[0]?.id)
const clockNow = ref(Date.now())
let clockTimer: ReturnType<typeof setInterval>
onMounted(() => { clockTimer = setInterval(() => { clockNow.value = Date.now() }, 60_000) })
onUnmounted(() => clearInterval(clockTimer))
function remaining(at?: string) {
  const hours = Math.max(0, Math.ceil((new Date(deadline(at,7)).getTime() - clockNow.value) / 3600000))
  return Number.isFinite(hours) ? hours ? `剩余 ${Math.floor(hours / 24)} 天 ${hours % 24} 小时` : '验收时间已到，等待系统处理' : '未记录验收期限'
}
const contactOpen = ref(false)
const refundOpen = ref(false)
const refundId = ref('')
const refundMode = ref<'view' | 'agree'>('view')
function showRefund(r: Refund, process = false) { refundId.value = r.id; refundMode.value = process && r.status === 'pending' ? 'agree' : 'view'; refundOpen.value = true }
watch(() => route.query.refund, id => { const r = refunds.value.find(item => item.id === id); if (r && !route.query.from) showRefund(r, true) }, { immediate: true })
const canInvoice = computed(() => !!order.value && !activeRefund.value && c.invoiceable(order.value) > 0)
const files = ref<string[]>([])
const resources = ref<Record<string,string>>({})
const note = ref('')
const uploading = ref(false)
watch(() => currentStage.value?.id, id => { expanded.value = id || stages.value.at(-1)?.id; files.value = []; resources.value = {}; note.value = '' })
const canDeliver = computed(() => order.value?.status === 'in_service' && order.value.contractState === 'confirmed' && !activeRefund.value && !!currentStage.value && currentStage.value.paid >= currentStage.value.amount)
const task = computed(() => {
  const o = order.value
  if (!o) return { title: '', text: '', action: '' }
  if (activeRefund.value) return { title: activeRefund.value.status === 'pending' ? '有退款待处理' : activeRefund.value.status === 'client_confirm' ? '退款待客户确认' : '退款已拒绝，待客户处理', text: `${money(activeRefund.value.status === 'client_confirm' ? activeRefund.value.agreed : activeRefund.value.requested)} · ${stages.value.find(s => s.id === activeRefund.value?.stageId)?.name || '整笔订单'}。处理结束前暂停履约与新开票。`, action: activeRefund.value.status === 'pending' ? '处理退款' : '查看退款' }
  if (o.status === 'cancelled') return { title: '订单已关闭', text: '后续付款与交付已终止；剩余实付按售后期规则结算。', action: '' }
  if (o.status === 'pending_payment') return { title: '等待客户付款', text: '客户支付后进入签约。下单后 7 天未支付将自动取消。', action: '' }
  if (o.status === 'pending_contract') return { title: o.contractState === 'waiting' ? '合同待客户确认' : o.contractState === 'rejected' ? '合同被驳回，请重新上传' : '请上传已签署合同', text: '上传双方签署的扫描件，客户确认后开始服务。', action: '查看合同' }
  if (o.status === 'completed') return { title: o.settlement === 'settled' ? '订单已结算' : '全部阶段已验收', text: o.settlement === 'settled' ? '结算与交易记录可在我的钱包查看。' : `售后期截止 ${dateText(o.afterSaleEnd)}，无未完成退款后结算。`, action: '查看结算' }
  if (o.status === 'pending_acceptance') return { title: `${currentStage.value?.name || '交付成果'} · 待客户验收`, text: `验收截止 ${dateText(deadline(currentStage.value?.submittedAt || o.acceptanceAt, 7))}，逾期自动通过。`, action: '查看交付' }
  if (currentStage.value && currentStage.value.paid < currentStage.value.amount) return { title: `${currentStage.value.name} · 等待付款`, text: `本期待付 ${money(currentStage.value.amount - currentStage.value.paid)}，支付后可提交该阶段交付物。`, action: '查看账单' }
  return { title: currentStage.value?.status === 'rejected' ? '验收被驳回，请补充交付物' : `${currentStage.value?.name || '服务'} · 待交付`, text: currentStage.value?.feedback || '按阶段约定完成服务，上传交付物后申请客户验收。', action: '去履约' }
})
function taskAction() {
  if (activeRefund.value) showRefund(activeRefund.value, true)
  else selectTab(order.value?.status === 'pending_contract' ? 'contract' : order.value?.status === 'completed' ? 'settlement' : currentStage.value && currentStage.value.paid < currentStage.value.amount ? 'bill' : 'delivery')
}
function deadline(at?: string, days = 0) { return at ? new Date(new Date(at).getTime() + days * 86400000).toISOString() : '' }
const shortDate = (at?: string) => at ? new Date(at).toLocaleDateString('zh-CN') : '—'
const progress = computed(() => {
  const o = order.value
  if (!o) return []
  const delivered = stages.value.filter(s => ['pending_acceptance','accepted'].includes(s.status)).length
  return [
    { title: '支付', value: `已付 ${paidCount.value} / ${stages.value.length} 期`, done: paidCount.value === stages.value.length, plan: stages.value.at(-1)?.payDueAt || deadline(o.createdAt, 7), actual: paidCount.value === stages.value.length ? stages.value.at(-1)?.paymentAt || o.paymentAt : '' },
    { title: '签约', value: ({none:'待上传',waiting:'待客户确认',rejected:'已驳回',confirmed:'已确认'})[o.contractState], done: o.contractState === 'confirmed', plan: '', actual: o.contractConfirmedAt },
    { title: '交付', value: `已交付 ${delivered} / ${stages.value.length} 期`, done: delivered === stages.value.length, plan: stages.value.at(-1)?.dueAt || deadline(o.contractConfirmedAt, spec.value?.deliveryDays || 0), actual: delivered === stages.value.length ? stages.value.at(-1)?.submittedAt || o.acceptanceAt : '' },
    { title: '验收', value: `已验收 ${completedCount.value} / ${stages.value.length} 期`, done: completedCount.value === stages.value.length, plan: o.status === 'pending_acceptance' ? deadline(currentStage.value?.submittedAt || o.acceptanceAt,7) : '', actual: o.completedAt },
    { title: '完成', value: o.status === 'completed' ? '已完成' : o.status === 'cancelled' ? '已关闭' : '待完成', done: o.status === 'completed', plan: '', actual: o.completedAt },
  ]
})
function back() { router.push(route.query.from === 'aftersale' ? { path: '/aftersale', query: { order: order.value?.id, refund: route.query.refund } } : '/order') }
function invoice() { if (canInvoice.value) router.push({ path: '/invoice/open', query: { order: order.value?.id } }) }
async function pick(event: Event, kind: 'contract' | 'delivery') {
  const input = event.target as HTMLInputElement
  const picked = Array.from(input.files || [])
  if (!picked.length || !order.value) return
  const allowed = kind === 'contract' ? /\.(pdf|png|jpe?g|docx?)$/i : /\.(pdf|png|jpe?g|docx?|xlsx?|zip)$/i
  if (picked.some(f => !allowed.test(f.name) || f.size > 20 * 1024 * 1024)) { ElMessage.error('支持 PDF、图片、Office、ZIP，单个文件不超过 20MB'); input.value = ''; return }
  uploading.value = true
  try {
    const saved = await Promise.all(picked.map(async f => [f.name, await saveDemoDocument(f)] as const))
    if (kind === 'contract') {
      if (c.submitContract(order.value.id, saved[0][0])) { (order.value.fileResources ||= {})[saved[0][0]] = saved[0][1]; ElMessage.success('合同已上传，等待客户确认') }
      else ElMessage.warning('当前状态不能上传合同')
    } else { for (const [name,key] of saved) { if (!files.value.includes(name)) files.value.push(name); resources.value[name] = key } }
  } catch { ElMessage.error('文件保存失败，请重新选择') }
  finally { uploading.value = false; input.value = '' }
}
function deliver() {
  if (!order.value) return
  if (c.requestAcceptance(order.value.id, files.value, note.value, currentStage.value?.id)) {
    order.value.fileResources = { ...order.value.fileResources, ...resources.value }
    files.value = []; resources.value = {}; note.value = ''; ElMessage.success('已提交客户验收')
  } else ElMessage.warning('请检查本期付款、交付文件及退款状态')
}
const documentOpen = ref(false)
const document = reactive({ name: '', url: '', content: '' })
async function previewFile(name: string, stage?: OrderStage) {
  document.name = name; document.url = ''; document.content = ''
  const key = order.value?.fileResources?.[name]
  if (key) { try { document.url = await resolveDemoImage(key) } catch { ElMessage.error('文件读取失败') } }
  if (!document.url) document.content = `示例文件 · ${name}\n\n关联订单：${order.value?.id}\n${stage ? `关联阶段：${stage.name}\n交付标准：${stage.standard}\n\n${stage.note}` : '此文件用于演示业务信息与交互。实际上传的文件将保存在本地，可预览或下载。'}`
  documentOpen.value = true
}
function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([`服务合同模板（演示）\n订单：${order.value?.id}\n服务：${order.value?.serviceName}\n请线下确认主体、阶段金额、交付标准与签章。`], { type: 'text/plain;charset=utf-8' }))
  const link = window.document.createElement('a'); link.href = url; link.download = '服务合同模板（演示）.txt'; link.click(); URL.revokeObjectURL(url)
}
const fee = computed(() => order.value ? netPaid(order.value) * order.value.shareRate / 100 : 0)
</script>

<template>
  <div v-if="order" class="biz-page order-detail-page">
    <header class="order-heading">
      <button class="back-link" @click="back"><ArrowLeft :size="14" />{{ route.query.from === 'aftersale' ? '返回售后管理' : '返回订单管理' }}</button>
      <div class="title-line"><h1>{{ order.serviceName }}</h1><ElTag :type="order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'info' : 'primary'">{{ STATUS_LABEL[order.status] }}</ElTag></div>
      <div class="order-meta"><span>{{ order.id }}</span><span>下单 {{ dateText(order.createdAt) }}</span><span>{{ order.customer }}</span></div>
    </header>
    <div class="task-banner" :class="{ refund: activeRefund, closed: order.status === 'cancelled' }"><div><strong>{{ task.title }}</strong><p><MoneyText :text="task.text" /></p></div><ElButton v-if="task.action" :type="activeRefund?.status === 'pending' ? 'danger' : 'primary'" size="small" @click="taskAction">{{ task.action }}</ElButton></div>
    <section class="order-progress" aria-label="订单进度">
      <div v-for="(step,index) in progress" :key="step.title" class="progress-node" :class="{ done: step.done }">
        <div class="node-title"><span class="node-mark"><Check v-if="step.done" :size="12" /><template v-else>{{ index + 1 }}</template></span><strong>{{ step.title }}</strong><span>{{ step.value }}</span></div>
        <div class="node-dates"><span>计划 {{ shortDate(step.plan) }}</span><span>完成 {{ shortDate(step.actual) }}</span></div>
      </div>
    </section>
    <div class="detail-layout">
      <main class="detail-main">
        <nav class="detail-tabs" aria-label="订单详情栏目"><button v-for="[key,label] in tabs" :key="key" :class="{ active: tab === key }" @click="selectTab(key)">{{ label }}<span v-if="key === 'bill' && activeRefund" class="notice-dot"></span></button></nav>
        <div class="detail-content">
          <template v-if="tab === 'bill'">
            <div class="section-heading"><h2>阶段收付款</h2><span>{{ stages.length }} 期 · 已支付 {{ paidCount }} 期</span></div>
            <table class="detail-table payment-table"><colgroup><col style="width:27%" /><col style="width:17%" /><col style="width:19%" /><col style="width:24%" /><col style="width:13%" /></colgroup><thead><tr><th>阶段 / 计划支付</th><th class="numeric">应付金额</th><th class="numeric">累计支付</th><th>支付记录</th><th>状态</th></tr></thead><tbody><tr v-for="(stage,index) in stages" :key="stage.id"><td><strong>{{ String(index + 1).padStart(2,'0') }} · {{ stage.name }}</strong><small>计划 {{ shortDate(stage.payDueAt) }}</small></td><td class="numeric"><b class="money-value">{{ money(stage.amount) }}</b></td><td class="numeric"><strong><b class="money-value">{{ money(stage.paid) }}</b></strong><small v-if="stage.refunded" class="refund-text">已退 <b class="money-value">{{ money(stage.refunded) }}</b></small></td><td><span>{{ stage.paid ? stage.paymentMethod || '支付方式未记录' : '尚未支付' }}</span><small><MoneyText :text="stage.paid ? dateText(stage.paymentAt) : order.status === 'cancelled' ? '订单已关闭' : `待付 ${money(stage.amount - stage.paid)}`" /></small></td><td><span class="plain-state" :class="stage.paid >= stage.amount ? 'success' : 'warning'">{{ stage.paid >= stage.amount ? '已支付' : order.status === 'cancelled' ? '已关闭' : '待支付' }}</span></td></tr></tbody></table>
            <div class="payment-summary"><span>累计支付 <b><b class="money-value">{{ money(order.paid) }}</b></b></span><span>已退款 <b><b class="money-value">{{ money(order.refunded) }}</b></b></span><span>剩余实付 <strong><b class="money-value">{{ money(netPaid(order)) }}</b></strong></span></div>
            <div class="section-heading subsection"><h2>退款记录 <span>{{ refunds.length }}</span></h2><span v-if="activeRefund" class="refund-text">有 1 笔未完结</span></div>
            <table v-if="refunds.length" class="detail-table refund-table"><colgroup><col style="width:47%" /><col style="width:18%" /><col style="width:18%" /><col style="width:17%" /></colgroup><thead><tr><th>退款原因 / 关联阶段</th><th class="numeric">申请金额</th><th>状态</th><th class="numeric">操作</th></tr></thead><tbody><tr v-for="r in refunds" :key="r.id" :class="{ 'active-refund-row': r.id === activeRefund?.id }"><td><strong>{{ r.reason }}</strong><small>{{ stages.find(s => s.id === r.stageId)?.name || '整笔订单' }} · {{ shortDate(r.createdAt) }}</small></td><td class="numeric"><b class="money-value">{{ money(r.requested) }}</b><small v-if="r.status === 'client_confirm' || r.status === 'refunded'">{{ r.status === 'refunded' ? '实退' : '拟退' }} <b class="money-value">{{ money(r.agreed) }}</b></small></td><td><span :class="['plain-state', r.status === 'refunded' ? 'success' : r.status === 'cancelled' ? 'muted' : 'danger']">{{ STATUS_LABEL[r.status] }}</span><small v-if="r.status === 'refunded'">{{ r.decision === 'close' ? '已关闭订单' : '继续履约' }}</small></td><td class="numeric"><ElButton text :type="r.status === 'pending' ? 'danger' : 'primary'" size="small" @click="showRefund(r, true)">{{ r.status === 'pending' ? '处理退款' : '退款详情' }}</ElButton></td></tr></tbody></table>
            <p v-else class="empty-copy">暂无退款申请</p>
            <div class="section-heading subsection"><h2>对客发票</h2><ElButton text type="primary" size="small" @click="router.push({ path: '/invoice/record', query: { order: order.id } })">发票记录与退票</ElButton></div>
            <div class="invoice-line"><span>已开票 <b><b class="money-value">{{ money(issued) }}</b></b></span><span>可开票 <b><b class="money-value">{{ money(c.invoiceable(order)) }}</b></b></span><ElButton :disabled="!canInvoice" type="primary" plain size="small" @click="invoice">上传发票</ElButton></div><p v-if="activeRefund" class="footnote">退款处理中，暂不可新开票；退款完成后按剩余实付重新计算。</p><div v-for="record in invoices" :key="record.id" class="invoice-record"><FileText :size="13" /><span>{{ record.number || '待生成票号' }}</span><span><b class="money-value">{{ money(record.amounts?.[order.id] ?? record.amount / record.orderIds.length) }}</b></span><span>{{ ({issued:'已开具',returned:'已退票',returning:'退票中',issuing:'开票中',failed:'开票失败'})[record.status] }}</span></div>
          </template>

          <template v-else-if="tab === 'delivery'">
            <div class="section-heading"><h2>阶段交付与验收</h2><span>{{ completedCount }} / {{ stages.length }} 期已验收</span></div>
            <div class="phase-list">
              <section v-for="(stage,index) in stages" :key="stage.id" class="phase" :class="{ expanded: expanded === stage.id, current: currentStage?.id === stage.id }">
                <button class="phase-heading" @click="expanded = expanded === stage.id ? '' : stage.id"><span class="phase-number">{{ String(index + 1).padStart(2,'0') }}</span><div><strong>{{ stage.name }}</strong><small>计划交付 {{ shortDate(stage.dueAt) }} <span>·</span> <b class="money-value">{{ money(stage.amount) }}</b></small></div><span class="plain-state" :class="stage.status === 'accepted' ? 'success' : stage.status === 'rejected' ? 'danger' : 'muted'">{{ order.status === 'cancelled' && stage.status !== 'accepted' ? '已终止' : STAGE_LABEL[stage.status] }}</span><ChevronDown v-if="expanded === stage.id" :size="15" /><ChevronRight v-else :size="15" /></button>
                <div v-if="expanded === stage.id" class="phase-body">
                  <dl class="compact-facts"><dt>交付标准</dt><dd>{{ stage.standard }}</dd><dt>本期资金</dt><dd>已付 <b class="money-value">{{ money(stage.paid) }}</b><span v-if="stage.refunded"> · 已退 <b class="money-value">{{ money(stage.refunded) }}</b></span><span v-if="stage.paid < stage.amount" class="warning"> · 待付 <b class="money-value">{{ money(stage.amount - stage.paid) }}</b></span></dd></dl>
                  <div v-if="stage.feedback" class="feedback"><strong>客户驳回意见</strong><p>{{ stage.feedback }}</p></div>
                  <div v-if="stage.files.length" class="phase-documents"><span>已提交文件</span><div class="file-chips"><button v-for="file in stage.files" :key="file" @click="previewFile(file,stage)"><FileText :size="14" />{{ file }}</button></div><p v-if="stage.note">{{ stage.note }}</p><small>申请 {{ dateText(stage.submittedAt) }}<template v-if="stage.acceptedAt"> · 验收通过 {{ dateText(stage.acceptedAt) }}</template></small></div>
                  <div v-if="currentStage?.id === stage.id && canDeliver" class="delivery-form"><div class="section-heading"><h3>{{ stage.status === 'rejected' ? '补充材料并重新申请' : '提交本期交付物' }}</h3><label class="upload-button"><Upload :size="14" />选择文件<input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.zip" :disabled="uploading" @change="pick($event,'delivery')" /></label></div><div v-if="files.length" class="pending-files"><span v-for="file in files" :key="file"><FileText :size="13" />{{ file }}<button title="移除文件" @click="files = files.filter(f => f !== file)"><X :size="12" /></button></span></div><p v-else class="footnote">PDF、图片、Office、ZIP；单个文件 ≤20MB</p><ElInput v-model="note" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="说明本期完成内容、交付文件和需要客户核对的事项" /><div class="form-submit"><span>提交后由客户验收，7 天未处理自动通过。</span><ElButton type="primary" :loading="uploading" :disabled="!files.length" @click="deliver">{{ stage.status === 'rejected' ? '重新申请验收' : '申请客户验收' }}</ElButton></div></div>
                  <p v-else-if="stage.status === 'pending_acceptance' && !activeRefund" class="context-note">{{ remaining(stage.submittedAt) }} · 验收截止 {{ dateText(deadline(stage.submittedAt,7)) }}；逾期自动通过。</p>
                  <p v-else-if="activeRefund && stage.status !== 'accepted'" class="context-note">退款未完结，暂不可提交交付或处理验收。</p>
                  <p v-else-if="stage.status !== 'accepted' && order.status !== 'cancelled'" class="context-note">{{ stage.paid < stage.amount ? '等待客户完成本期付款后交付。' : currentStage?.id !== stage.id ? '上一阶段验收通过后开始本阶段。' : order.contractState !== 'confirmed' ? '合同确认后开始交付。' : '等待进入履约阶段。' }}</p>
                </div>
              </section>
            </div>
          </template>

          <template v-else-if="tab === 'contract'">
            <div class="section-heading"><h2>合同文件</h2><ElTag size="small" :type="order.contractState === 'confirmed' ? 'success' : order.contractState === 'rejected' ? 'danger' : 'info'">{{ ({none:'待上传',waiting:'待客户确认',rejected:'已驳回',confirmed:'已确认'})[order.contractState] }}</ElTag></div>
            <div class="contract-row"><FileText :size="20" /><div><strong>标准服务合同模板</strong><small>核对主体、阶段计划及交付标准，线下签章后上传。</small></div><ElButton size="small" @click="downloadTemplate"><Download :size="13" />下载模板</ElButton></div>
            <div class="contract-row"><FileText :size="20" /><div><strong>{{ order.contractFile || '尚未上传双方签署的合同' }}</strong><small>{{ order.contractUploadedAt ? `上传 ${dateText(order.contractUploadedAt)}` : '支持 PDF、图片、Word 格式' }}</small></div><ElButton v-if="order.contractFile" text type="primary" size="small" @click="previewFile(order.contractFile)">查看文件</ElButton></div>
            <label v-if="order.status === 'pending_contract' && ['none','rejected'].includes(order.contractState) && !activeRefund" class="upload-button"><Upload :size="14" />{{ order.contractState === 'rejected' ? '重新上传合同' : '上传已签署合同' }}<input type="file" :disabled="uploading" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" @change="pick($event,'contract')" /></label>
            <p v-if="activeRefund" class="context-note">退款未完结，合同操作已暂停。</p><p v-else-if="order.status === 'pending_payment'" class="context-note">客户支付后开放合同上传。</p>
            <div class="section-heading subsection"><h2>签约记录</h2></div><div class="event-list"><div><time>{{ dateText(order.createdAt) }}</time><span>订单创建</span></div><div v-if="order.contractUploadedAt"><time>{{ dateText(order.contractUploadedAt) }}</time><span>供应商上传已签署合同</span></div><div v-if="order.contractConfirmedAt"><time>{{ dateText(order.contractConfirmedAt) }}</time><span>客户确认合同，进入履约</span></div><div v-if="order.contractState === 'rejected'"><time>当前状态</time><span class="refund-text">客户驳回合同，请重新上传</span></div></div>
          </template>

          <template v-else-if="tab === 'settlement'">
            <div class="section-heading"><h2>订单结算</h2><ElTag :type="order.settlement === 'settled' ? 'success' : 'info'" size="small">{{ order.settlement === 'settled' ? '已结算' : '待结算' }}</ElTag></div>
            <dl class="settlement-ledger"><dt>累计支付</dt><dd><b class="money-value">{{ money(order.paid) }}</b></dd><dt>减：已退款</dt><dd>− <b class="money-value">{{ money(order.refunded) }}</b></dd><dt>结算基数（剩余实付）</dt><dd><b class="money-value">{{ money(netPaid(order)) }}</b></dd><dt>减：平台服务费 <small>提点快照 {{ order.shareRate }}%</small></dt><dd>− <b class="money-value">{{ money(fee) }}</b></dd><dt class="ledger-total">{{ order.settlement === 'settled' ? '供应商结算金额' : '当前预计到账' }}</dt><dd class="ledger-total"><b class="money-value">{{ money(netPaid(order) - fee) }}</b></dd></dl>
            <dl class="compact-facts settlement-conditions"><dt>履约进度</dt><dd>{{ completedCount }} / {{ stages.length }} 期已验收</dd><dt>售后期</dt><dd>{{ order.afterSaleDays }} 个自然日 · {{ order.afterSaleEnd ? `截止 ${dateText(order.afterSaleEnd)}` : '订单完成或退款关单后起算' }}</dd><dt>退款情况</dt><dd>{{ activeRefund ? '存在未完结退款，暂不结算' : '无未完结退款' }}</dd><dt>结算条件</dt><dd>订单完成或关单，售后期结束，且无未完结退款。</dd></dl>
            <p class="footnote">未支付阶段不计入当前结算基数；后续支付或退款会更新预计到账。</p><div class="section-heading subsection"><h2>交易评价</h2><ElButton :disabled="order.status !== 'completed' || !!activeRefund" size="small" type="primary" plain @click="router.push({ path: '/review', query: { order: order.id } })">前往评价</ElButton></div><p class="empty-copy">{{ order.status === 'completed' ? '订单评价与追评记录在评价中心查看。' : '全部阶段验收通过后可评价客户。' }}</p><ElButton size="small" @click="router.push('/wallet')">查看我的钱包</ElButton>
          </template>

          <template v-else>
            <div class="section-heading"><h2>下单服务快照</h2><span>以下为下单时约定</span></div><dl class="compact-facts service-facts"><dt>服务名称</dt><dd>{{ order.serviceName }}</dd><dt>服务分类</dt><dd>{{ order.category }}</dd><dt>规格 / 数量</dt><dd>{{ spec?.name || '未记录' }} · {{ order.quantity || 1 }} {{ spec?.unit || '项' }}</dd><dt>付款 / 验收</dt><dd>{{ stages.length > 1 ? `分期付款 · 分期验收 · ${stages.length} 期` : '一次性付款 · 一次性验收' }}</dd><dt>交付周期</dt><dd>{{ spec?.deliveryDays || '—' }} 天</dd><dt>开始规则</dt><dd>{{ spec ? `支付后 ${spec.startDays} ${spec.dayType}开始` : order.deliverySnapshot || '未记录' }}</dd><dt>交付标准</dt><dd>{{ spec?.standard || '按订单约定执行' }}</dd></dl><div class="section-heading subsection"><h2>客户原始需求</h2></div><p class="request-copy">{{ order.customerRequest || '客户未填写补充需求。' }}</p><div v-if="order.requestAttachments?.length" class="file-chips"><button v-for="file in order.requestAttachments" :key="file" @click="previewFile(file)"><FileText :size="14" />{{ file }}</button></div>
          </template>
        </div>
      </main>
      <aside class="order-aside"><h2>订单概要</h2><dl><dt>来源园区</dt><dd>{{ park }}</dd><dt>服务分类</dt><dd>{{ order.category }}</dd><dt>服务规格</dt><dd>{{ spec?.name || '未记录' }} · {{ order.quantity || 1 }} {{ spec?.unit || '项' }}</dd><dt>交付周期</dt><dd>{{ spec?.deliveryDays || '—' }} 天 · {{ stages.length }} 期</dd></dl><div class="aside-money"><div><span>订单总额</span><strong><b class="money-value">{{ money(order.amount) }}</b></strong></div><div><span>累计支付</span><b><b class="money-value">{{ money(order.paid) }}</b></b></div><div><span>{{ order.status === 'cancelled' ? '未付（已关闭）' : '待支付' }}</span><b :class="{ warning: outstanding(order) && order.status !== 'cancelled' }"><b class="money-value">{{ money(outstanding(order)) }}</b></b></div><div><span>已退款</span><b><b class="money-value">{{ money(order.refunded) }}</b></b></div><div class="net-total"><span>剩余实付</span><strong><b class="money-value">{{ money(netPaid(order)) }}</b></strong></div></div><div class="aside-customer"><span>客户</span><strong>{{ order.customer }}</strong><ElButton size="small" @click="contactOpen = true"><MessageCircle :size="14" />联系客户</ElButton></div></aside>
    </div>
    <RefundDialog v-model="refundOpen" :refund-id="refundId" :mode="refundMode" />
    <ElDialog v-model="contactOpen" title="客户联系信息" width="440px"><dl class="compact-facts"><dt>客户企业</dt><dd>{{ order.customer }}</dd><dt>联系人</dt><dd>{{ order.contactName || '暂无联系人信息' }}</dd><dt>联系电话</dt><dd>{{ order.contactPhone || '暂无联系电话' }}</dd></dl><p v-if="order.id.startsWith('DEMO')" class="footnote">演示联系信息；真实客户联系方式由订单接口提供。</p></ElDialog>
    <ElDialog v-model="documentOpen" :title="document.name" width="760px" append-to-body><iframe v-if="document.url && /\.(pdf|png|jpe?g)$/i.test(document.name)" :src="document.url" class="document-preview" :title="document.name"></iframe><pre v-else-if="document.content" class="document-copy">{{ document.content }}</pre><p v-else class="empty-copy">此文件格式请下载后查看。</p><template #footer><ElButton @click="documentOpen = false">关闭</ElButton><a v-if="document.url" :href="document.url" :download="document.name" class="download-link"><Download :size="14" />下载原文件</a></template></ElDialog>
  </div>
  <div v-else class="biz-page"><div class="biz-empty"><h3>订单不存在</h3><p>该订单可能已清理，请返回订单管理查看。</p><ElButton @click="router.push('/order')">返回订单管理</ElButton></div></div>
</template>

<style scoped>
.order-detail-page{max-width:var(--biz-content-width);min-width:0;padding-top:22px}.order-heading{margin-bottom:10px}.back-link{display:flex;align-items:center;gap:5px;border:0;padding:0;background:none;color:#596a80;font:inherit;font-size:12px;cursor:pointer;margin-bottom:10px}.back-link:hover{color:#365cc1}.title-line{display:flex;align-items:center;gap:12px}.title-line h1{margin:0;font-size:21px;font-weight:650;line-height:1.45;color:#243650}.title-line .el-tag{flex:none}.order-meta{display:flex;gap:18px;color:#596a80;font-size:12px;margin-top:7px}.order-meta>span:first-child{color:#647897;font-variant-numeric:tabular-nums}
.task-banner{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:11px 14px;border-radius:8px;background:#f1f5ff;color:#36557f;margin-bottom:8px}.task-banner>div{display:flex;align-items:baseline;gap:12px;min-width:0}.task-banner strong{font-size:13px;font-weight:650;white-space:nowrap}.task-banner p{margin:0;font-size:12px;line-height:1.5;color:#596a80}.task-banner.refund{background:#fff4f3;color:#ac4141}.task-banner.refund p{color:#a26d6c}.task-banner.closed{background:#f4f5f8;color:#596a80}.task-banner .el-button{flex:none}
.order-progress{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px;padding:12px 4px 16px;margin-bottom:2px}.progress-node{position:relative}.node-title{display:flex;align-items:center;gap:7px;font-size:12px;white-space:nowrap}.node-title>span:last-child{font-size:12px;color:#596a80}.node-mark{display:grid;place-items:center;flex:none;width:19px;height:19px;border-radius:50%;color:#596a80;background:#edf1f7;font-size:12px}.done .node-mark{background:#e9f5f0;color:#25866a}.node-title strong{color:#3a4d68;font-weight:600}.node-dates{display:flex;flex-direction:column;gap:3px;margin:8px 0 0 26px;font-size:12px;color:#596a80}.progress-node:not(:last-child)::after{content:'';position:absolute;right:3px;top:35px;bottom:2px;width:1px;background:#edf0f4}
.detail-layout{display:grid;grid-template-columns:minmax(0,1fr) 244px;gap:22px;align-items:start}.detail-main{min-width:0;border:1px solid #e3e9f0;border-radius:9px;overflow:hidden;background:#fff}.detail-tabs{display:flex;gap:18px;padding:0 20px;border-bottom:1px solid #e8edf3;background:#fff}.detail-tabs button{position:relative;border:0;border-bottom:2px solid transparent;background:none;padding:13px 0 11px;color:#596a80;font:inherit;font-size:13px;cursor:pointer;white-space:nowrap}.detail-tabs button.active{color:#365ac1;border-bottom-color:#365ac1;font-weight:650}.notice-dot{display:inline-block;width:5px;height:5px;background:#d7605b;border-radius:50%;margin-left:5px;vertical-align:top}.detail-content{padding:20px}.section-heading{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;min-height:22px}.section-heading h2,.section-heading h3{font-size:13px;font-weight:650;margin:0;color:#2a3c56}.section-heading>span{color:#596a80;font-size:12px}.section-heading h2 span{font-weight:400;font-size:12px;color:#596a80;margin-left:6px}.subsection{margin-top:26px}.detail-table{border-collapse:collapse;table-layout:fixed;width:100%;font-size:12px;color:#4e5f77;line-height:1.6}.detail-table th{font-size:12px;font-weight:500;color:#596a80;background:#f7f9fc;padding:9px 10px;text-align:left}.detail-table td{padding:11px 10px;border-bottom:1px solid #edf0f5;vertical-align:top;overflow-wrap:anywhere}.detail-table strong{font-weight:650;color:#3a4d67}.detail-table small{display:block;font-size:12px;margin-top:4px;color:#596a80;line-height:1.6}.detail-table .numeric{text-align:right;font-variant-numeric:tabular-nums}.payment-table td.numeric{white-space:nowrap}.payment-table th:nth-child(4),.payment-table td:nth-child(4){padding-left:20px}.detail-table td .el-button{height:22px;padding:0;font-size:12px;min-height:0}.payment-summary{display:flex;justify-content:flex-end;align-items:center;gap:20px;padding:11px 10px;font-size:12px;color:#596a80;background:#fbfcfe}.payment-summary b,.payment-summary strong{margin-left:6px;color:#4b5e77;font-weight:500;font-variant-numeric:tabular-nums}.payment-summary strong{color:#257e65;font-weight:650}.active-refund-row{background:#fffafa}.plain-state{font-size:12px;white-space:nowrap}.success{color:#268369}.warning{color:#ac742d}.danger,.refund-text{color:#b85151!important}.muted{color:#596a80}.invoice-line{display:flex;align-items:center;gap:22px;font-size:12px;color:#596a80}.invoice-line b{color:#3e526d;margin-left:8px;font-weight:650;font-variant-numeric:tabular-nums}.invoice-line .el-button{margin-left:auto}.invoice-record{display:flex;align-items:center;gap:14px;padding:10px 0 0;color:#596a80;font-size:12px}.invoice-record span:nth-child(2){flex:1}.footnote,.empty-copy{font-size:12px;color:#596a80;line-height:1.65;margin:10px 0}.empty-copy{padding:8px 0}
.order-aside{position:sticky;top:20px;padding:18px;border:1px solid #e6ebf2;border-radius:9px;background:#fafbfd}.order-aside h2{font-size:13px;margin:0 0 18px;font-weight:650}.order-aside dl{display:grid;grid-template-columns:58px minmax(0,1fr);gap:12px 12px;font-size:12px;line-height:1.65;margin:0}.order-aside dt{color:#596a80}.order-aside dd{color:#51617a;margin:0;overflow-wrap:anywhere}.aside-money{display:grid;gap:11px;margin-top:20px;padding-top:18px;border-top:1px solid #e7edf4;font-size:12px;color:#596a80}.aside-money>div{display:flex;justify-content:space-between;gap:8px}.aside-money b,.aside-money strong{color:#425672;font-weight:650;font-variant-numeric:tabular-nums}.aside-money>div:first-child strong{font-size:15px;color:#263d5d}.aside-money .warning{color:#ad722a}.aside-money .net-total{margin-top:3px}.net-total strong{color:#267e65}.aside-customer{display:flex;flex-direction:column;gap:9px;margin-top:22px;font-size:12px}.aside-customer>span{color:#596a80}.aside-customer strong{color:#4d607c;font-weight:500;line-height:1.6}.aside-customer .el-button{margin-top:3px;width:100%}
.phase-list{display:grid;gap:10px}.phase{border:1px solid #e6ebf2;border-radius:7px;overflow:hidden}.phase.current{border-color:#cfdbf0}.phase-heading{display:flex;align-items:center;gap:12px;width:100%;padding:14px;border:0;background:#fbfcfe;text-align:left;cursor:pointer;color:#65778f;font:inherit}.phase-number{color:#596a80;font-size:13px;font-variant-numeric:tabular-nums}.phase-heading>div{flex:1}.phase-heading strong{font-size:13px;font-weight:600;color:#364c68}.phase-heading small{display:block;margin-top:5px;font-size:12px;color:#596a80}.phase-heading small span{margin:0 6px}.phase-body{padding:16px}.compact-facts{display:grid;grid-template-columns:72px minmax(0,1fr);gap:10px 14px;margin:0;font-size:12px;line-height:1.7}.compact-facts dt{color:#596a80}.compact-facts dd{margin:0;color:#50637e}.feedback{margin-top:14px;padding:10px 12px;background:#fff6f4;border-radius:5px;color:#ac5b4e;font-size:12px;line-height:1.6}.feedback strong{font-weight:600}.feedback p{margin:4px 0 0}.phase-documents{font-size:12px;color:#596a80;margin-top:16px}.phase-documents p{color:#596a80;line-height:1.6}.phase-documents small{font-size:12px}.file-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.file-chips button{display:flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid #e3eaf4;border-radius:5px;background:#fbfcfe;color:#5b78a5;font-size:12px;cursor:pointer}.file-chips button:hover{border-color:#7997cf;color:#365dc5}.delivery-form{margin-top:20px;padding-top:16px;border-top:1px solid #ecf0f5}.delivery-form .section-heading{margin-bottom:10px}.upload-button,.download-link{display:inline-flex;align-items:center;gap:5px;border:1px solid #d5dff0;border-radius:6px;background:#fff;color:#4669b3;padding:6px 10px;position:relative;overflow:hidden;font-size:12px;cursor:pointer;text-decoration:none}.upload-button input{position:absolute;inset:0;width:100%;opacity:0;cursor:pointer}.form-submit{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px}.form-submit>span{font-size:12px;color:#596a80}.pending-files{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}.pending-files>span{display:flex;align-items:center;gap:5px;font-size:12px;background:#f0f4fa;padding:5px 7px;border-radius:4px;color:#587399}.pending-files button{border:0;padding:0;background:none;color:#596a80;cursor:pointer}.context-note{font-size:12px;line-height:1.6;padding:10px 12px;background:#f7f9fc;color:#596a80;border-radius:5px;margin:14px 0 0}.contract-row{display:flex;align-items:center;gap:12px;padding:16px 0;color:#596a80}.contract-row>div{flex:1}.contract-row strong{font-size:12px;font-weight:650;color:#48607d}.contract-row small{display:block;font-size:12px;color:#596a80;margin-top:6px}.event-list>div{display:flex;gap:24px;padding:9px 0;font-size:12px;color:#576c89}.event-list time{font-size:12px;color:#596a80;min-width:160px}.settlement-ledger{display:grid;grid-template-columns:1fr auto;gap:0;margin:0;font-size:12px;line-height:1.6}.settlement-ledger dt,.settlement-ledger dd{padding:12px 0;margin:0;border-bottom:1px solid #edf1f6}.settlement-ledger dt{color:#596a80}.settlement-ledger dd{color:#425c7d;text-align:right;font-variant-numeric:tabular-nums}.settlement-ledger small{margin-left:8px;color:#596a80;font-size:12px}.settlement-ledger .ledger-total{background:#f7fafc;padding:13px 12px;color:#287e68;font-weight:600}.settlement-conditions{margin-top:22px}.service-facts{gap:15px}.request-copy{font-size:12px;color:#5f738e;line-height:1.9;white-space:pre-wrap}.document-preview{width:100%;height:520px;border:0}.document-copy{padding:20px;background:#f8fafd;white-space:pre-wrap;color:#5c6d84;font-family:inherit;font-size:13px;line-height:1.8}.download-link{margin-left:8px}

.order-heading{margin-bottom:18px}.title-line h1{font-size:25px;font-weight:750}.order-meta{margin-top:10px;gap:18px}.order-meta>span:first-child{font-weight:650}
.order-progress{gap:12px;margin:16px 0 22px;padding:0}.progress-node{padding:13px 12px;border:1px solid #e0e6ef;border-radius:8px;background:#f8fafc}.progress-node.done{background:#eff8f3;border-color:#b6d9c7}.progress-node::after{display:none}.node-title{flex-wrap:wrap;gap:7px}.node-title strong{font-size:14px;font-weight:700;color:#243650}.node-title>span:last-child{display:block;width:100%;margin-left:31px;color:#465a73;font-size:12px;font-weight:500}.node-mark{width:24px;height:24px;background:#e2e8f2;color:#3b5270;font-size:12px;font-weight:700}.done .node-mark{background:#237a57;color:#fff}.done .node-title>span:last-child{color:#216947;font-weight:650}.node-dates{margin-left:31px;line-height:1.6;color:#596a80}
.detail-layout{grid-template-columns:minmax(0,1fr) 260px;gap:20px}.detail-content{padding:22px}.detail-tabs{gap:20px}.detail-tabs button{font-size:14px;color:#526178}.section-heading h2,.section-heading h3,.order-aside h2{font-size:16px;font-weight:700}.section-heading{margin-bottom:14px}.subsection{margin-top:32px}.detail-table{font-size:13px;color:#34455c}.detail-table th{font-size:12px;font-weight:650;color:#53647a}.detail-table td{padding-top:14px;padding-bottom:14px}.detail-table strong{color:#20324b;font-weight:650}.order-aside{padding:18px;background:#f8fafc}.order-aside dl{font-size:13px;grid-template-columns:58px minmax(0,1fr);gap:14px 12px}.order-aside dd{color:#34455c}.aside-money{font-size:13px;gap:14px}.aside-money>div:first-child strong{font-size:18px}.aside-customer strong{font-size:13px;font-weight:650}.payment-summary{flex-wrap:wrap;gap:8px 18px;font-size:12px;padding:14px 10px}.compact-facts,.settlement-ledger,.request-copy{font-size:13px}.phase-heading strong{font-size:14px;font-weight:650}.task-banner p{color:#485d78}.task-banner.refund p{color:#8e4945}
</style>
