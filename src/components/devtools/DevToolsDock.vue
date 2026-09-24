<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Wrench,
  GitCompare,
  Layers,
  ListChecks,
  X,
  Copy,
  CheckCheck,
  Plus,
  Trash2,
  Wand2,
} from 'lucide-vue-next'
import { useAcceptanceStore, DESIGN_VERSIONS, type PageDataState, type EntryStatus } from '@/stores/acceptance'
import { useOnboardingStore } from '@/stores/onboarding'
import { useCommerceStore } from '@/stores/commerce'
import DragHandle from '@/components/devtools/DragHandle.vue'
import { ElButton, ElMessage, ElMessageBox, ElSwitch } from 'element-plus'

const acc = useAcceptanceStore()
const commerce = useCommerceStore()
const demoService = ref('')
const demoOrder = ref('')
const demoRefund = ref('')
const draft = ref('')
const copied = ref(false)
const dockRef = ref<HTMLElement | null>(null)
const viewport = ref({ width: window.innerWidth, height: window.innerHeight })
const dockStyle = computed(() => ({ left: `${acc.dockPosition.x}px`, top: `${acc.dockPosition.y}px` }))
const panelStyle = computed(() => {
  const above = acc.dockPosition.y > viewport.value.height / 2
  const available = above ? acc.dockPosition.y - 52 : viewport.value.height - acc.dockPosition.y - 52
  const panelWidth = Math.min(340, viewport.value.width - 24)
  const panelLeft = Math.min(Math.max(12, acc.dockPosition.x), Math.max(12, viewport.value.width - panelWidth - 12))
  return {
    left: `${panelLeft - acc.dockPosition.x}px`,
    top: above ? 'auto' : '44px',
    bottom: above ? '44px' : 'auto',
    maxHeight: `${Math.max(120, available)}px`,
  }
})

function onOutside(event: PointerEvent) {
  if (acc.panelOpen && dockRef.value && !dockRef.value.contains(event.target as Node)) acc.panelOpen = false
}
function onResize() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
  acc.setDockPosition(
    Math.max(10, Math.min(viewport.value.width - 88, acc.dockPosition.x)),
    Math.max(10, Math.min(viewport.value.height - 44, acc.dockPosition.y)),
  )
}
onMounted(() => {
  onResize()
  document.addEventListener('pointerdown', onOutside, true)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside, true)
  window.removeEventListener('resize', onResize)
})

const stateOptions: { value: PageDataState; label: string }[] = [
  { value: 'ready', label: '有数据' },
  { value: 'loading', label: '加载中' },
  { value: 'empty', label: '空态' },
  { value: 'error', label: '异常' },
]
const publishSteps = [2, 3, 4] as const

const entryOptions: { value: EntryStatus; label: string }[] = [
  { value: 'approved', label: '已入驻' },
  { value: 'pending', label: '未入驻' },
]

const levelText = { high: '高', mid: '中', low: '低' } as const
const issueCount = computed(() => acc.issues.length)

function submitIssue() {
  const text = draft.value.trim()
  if (!text) return
  acc.addIssue(text, '工作台', 'mid')
  draft.value = ''
}

async function copyIssues() {
  try {
    await navigator.clipboard.writeText(acc.exportIssues())
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* ignore */
  }
}

function panelGo(path: string) {
  acc.panelOpen = false
  window.location.hash = `#${path}`
}
function goCurrentApplication() {
  const ob = useOnboardingStore()
  const path = ob.status === 'reviewing' || ob.status === 'rejected' || ob.status === 'approved'
    ? '/onboarding/progress'
    : ob.entityVerified ? `/onboarding/step/${Math.max(1, ob.maxStep)}` : '/onboarding/entity'
  panelGo(path)
}

function setEntry(s: EntryStatus) {
  acc.setEntryStatus(s)
  acc.panelOpen = false
  window.location.hash = '#/workspace'
}

function fillAllDemo() {
  const ob = useOnboardingStore()
  ob.fillDemoAll()
  ElMessage.success('演示数据已填入，可继续下一步')
}

function fillAndGo() {
  const ob = useOnboardingStore()
  ob.fillDemoAll()
  acc.panelOpen = false
  window.location.hash = '#/onboarding/step/5'
}
function fillCommerceExamples() { commerce.addMissingExamples(); acc.setEntryStatus('approved'); acc.setDataState('ready'); ElMessage.success('各目录示例数据已补齐') }
async function resetCommerce() {
  try { await ElMessageBox.confirm('将清空当前主体的店铺、案例、服务和交易演示数据。您也可以只切换上方「空态」预览，无需清空数据。', '清空当前主体数据？', { type: 'warning', confirmButtonText: '确认清空', cancelButtonText: '取消' }) }
  catch { return }
  commerce.reset(); ElMessage.success('当前主体数据已清空')
}
function publishScenario(target: 'blank' | 1 | 2 | 3 | 4) {
  acc.setEntryStatus('approved')
  acc.setDataState('ready')
  if (target === 'blank') { panelGo('/service/new'); return }
  const id = commerce.preparePublishDemo()
  panelGo(`/service/edit/${id}?step=${target}&demo=${Date.now()}`)
  ElMessage.success(`已填入发布示例，跳到第 ${target} 步`)
}
function customerOrder() { const s=commerce.data.services.find(x=>x.id===demoService.value);const parkId=s&&Object.entries(s.listings).find(([,x])=>x.status==='on_sale')?.[0];if(!s||!parkId){ElMessage.warning('请先选择已上架服务');return}const order=commerce.createOrder(s.id,parkId);demoOrder.value=order?.id||'';ElMessage.success('客户下单演示已生成') }
function setServiceReview(status: 'on_sale' | 'rejected' | 'offline') {
  const s = commerce.data.services.find(x => x.id === demoService.value)
  if (!s) return
  const ids = Object.entries(s.listings).filter(([, x]) => status === 'offline' ? x.status === 'on_sale' : x.status === 'reviewing').map(([id]) => id)
  if (!ids.length) { ElMessage.warning('当前服务没有可处理的园区记录'); return }
  commerce.changeListing(s.id, ids, status, status === 'offline')
  ElMessage.success('园区审核模拟状态已更新')
}
function orderCallback(kind: 'pay'|'contract-yes'|'contract-no'|'accept-yes'|'accept-no'|'refund') {
  const o = commerce.data.orders.find(x => x.id === demoOrder.value)
  if (!o) return
  let done=false
  if (kind === 'pay' && o.status === 'pending_payment') { o.paid=o.amount; o.status='pending_contract';done=true }
  else if ((kind === 'contract-yes' || kind === 'contract-no') && o.contractState === 'waiting') { commerce.confirmContract(o.id, kind === 'contract-yes');done=true }
  else if ((kind === 'accept-yes' || kind === 'accept-no') && o.status === 'pending_acceptance') { commerce.concludeAcceptance(o.id, kind === 'accept-yes');done=true }
  else if (kind === 'refund') done=commerce.createRefund(o.id, Math.max(1,o.paid-o.refunded), '客户发起退款（演示）')
  done ? ElMessage.success('客户 / 平台回调演示已执行') : ElMessage.warning('当前订单不满足该操作条件')
}
function customerReview(followup:boolean){const o=commerce.data.orders.find(x=>x.id===demoOrder.value);if(!o||o.status!=='completed'){ElMessage.warning('请选择已完成订单');return}const ok=commerce.addReview({id:crypto.randomUUID(),orderId:o.id,parkId:o.parkId,direction:'to_supplier',score:5,content:followup?'客户追加评价：售后响应及时。':'客户评价：服务交付符合预期。',anonymous:false,images:[],followup,createdAt:new Date().toISOString()});ok?ElMessage.success('客户评价已生成'):ElMessage.warning('该订单本次评价不可重复')}
function invoiceCallback(status: 'issued'|'failed'|'returned') { const inv=commerce.data.invoices.find(x=>x.kind==='platform'&&['issuing','returning','failed'].includes(x.status));if(!inv){ElMessage.warning('暂无可模拟的平台发票');return}inv.status=status;ElMessage.success('财务回调演示已执行') }
function refundCallback(action:'accept'|'decline'|'cancel') { const refund=commerce.data.refunds.find(x=>x.id===demoRefund.value);if(!refund){ElMessage.warning('请先选择退款单');return}if(action==='cancel'){commerce.cancelRefund(refund.id)}else if(refund.status==='client_confirm'){commerce.finalizeRefund(refund.id,action==='accept')}else{ElMessage.warning('当前退款单不在待客户确认状态');return}ElMessage.success('客户退款操作演示已执行') }
</script>

<template>
  <div ref="dockRef" class="dock" :class="{ open: acc.panelOpen }" :style="dockStyle">
    <DragHandle v-if="!acc.panelOpen" @open="acc.panelOpen = true" />
    <button v-else class="dock-close" type="button" @click="acc.panelOpen = false">收起</button>
    <transition name="panel">
      <div v-if="acc.panelOpen" class="panel" role="dialog" aria-label="验收工具" :style="panelStyle">
        <header class="panel-head">
          <div class="panel-title">
            <Wrench :size="14" />
            <strong>版本切换 · 验收工具</strong>
          </div>
          <ElButton text circle size="small" aria-label="关闭面板" @click="acc.panelOpen = false">
            <X :size="14" />
          </ElButton>
        </header>

        <div class="panel-body">
          <section class="sec">
            <h3><Layers :size="13" /> 设计版本</h3>
            <div class="version-list">
              <button
                v-for="v in DESIGN_VERSIONS"
                :key="v.id"
                class="version-item"
                :class="{ active: acc.versionId === v.id }"
                type="button"
                @click="acc.setVersion(v.id)"
              >
                <span class="v-dot" />
                <span class="v-text">
                  <strong>{{ v.label }}</strong>
                  <small>{{ v.desc }}</small>
                </span>
                <CheckCheck v-if="acc.versionId === v.id" :size="14" class="v-check" />
              </button>
            </div>
          </section>

          <section class="sec">
            <h3>页面状态</h3>
            <div class="seg" role="tablist" aria-label="数据状态">
              <button
                v-for="s in stateOptions"
                :key="s.value"
                class="seg-btn"
                :class="{ active: acc.dataState === s.value }"
                type="button"
                role="tab"
                :aria-selected="acc.dataState === s.value"
                @click="acc.setDataState(s.value)"
              >
                {{ s.label }}
              </button>
            </div>
          </section>

          <section class="sec">
            <h3>入驻状态</h3>
            <div class="seg" role="tablist" aria-label="入驻状态">
              <button
                v-for="s in entryOptions"
                :key="s.value"
                class="seg-btn"
                :class="{ active: acc.entryStatus === s.value }"
                type="button"
                role="tab"
                :aria-selected="acc.entryStatus === s.value"
                @click="setEntry(s.value)"
              >
                {{ s.label }}
              </button>
            </div>
            <ElButton
              v-if="acc.entryStatus === 'pending'"
              size="small"
              style="width: 100%; margin-top: 8px"
              type="primary"
              @click="goCurrentApplication"
            >
              查看当前申请
            </ElButton>
            <ElButton
              size="small"
              style="width: 100%; margin-top: 8px"
              @click="panelGo('/workspace')"
            >
              {{ acc.entryStatus === 'pending' ? '跳到工作台（未入驻视角）' : '跳到工作台（已入驻）' }}
            </ElButton>
          </section>

          <section class="sec">
            <h3><Wand2 :size="13" /> 演示填表</h3>
            <ElButton size="small" style="width: 100%" type="primary" round @click="fillAllDemo">
              一键填满入驻表单
            </ElButton>
            <ElButton size="small" style="width: 100%; margin-top: 8px" round @click="fillAndGo">
              填满并跳到确认页
            </ElButton>
            <p class="demo-hint">自动填入演示数据，可跳过手工录入；每张表单卡片右上角也有「演示填入」。</p>
          </section>

          <section class="sec">
            <h3><Wand2 :size="13" /> 发布服务流程</h3>
            <p class="demo-hint">空表单用于验收必填反馈；填入示例后可直接跳到任一步，检查预览和提交。</p>
            <div class="demo-grid"><ElButton size="small" @click="publishScenario('blank')">空白发布</ElButton><ElButton size="small" type="primary" @click="publishScenario(1)">填满并开始</ElButton></div>
            <div class="demo-grid publish-steps"><ElButton v-for="n in publishSteps" :key="n" size="small" @click="publishScenario(n)">跳到第 {{ n }} 步</ElButton></div>
          </section>

          <section class="sec">
            <h3><Wand2 :size="13" /> 交易场景模拟</h3>
            <p class="demo-hint">各目录首次打开已有示例。下方可补齐缺失样例，或模拟园区、客户和财务动作。</p>
            <div class="demo-grid"><ElButton size="small" type="primary" @click="fillCommerceExamples">补齐各目录示例</ElButton><ElButton size="small" @click="resetCommerce">清空当前主体数据</ElButton></div>
            <div class="demo-grid"><ElButton size="small" @click="commerce.data.walletOpen = !commerce.data.walletOpen">钱包：{{commerce.data.walletOpen?'已开户':'未开户'}}</ElButton></div>
            <select v-model="demoService" class="demo-select"><option value="">选择服务</option><option v-for="s in commerce.data.services" :key="s.id" :value="s.id">{{s.name || '未命名服务'}}</option></select>
            <div class="demo-grid"><ElButton size="small" @click="setServiceReview('on_sale')">审核通过</ElButton><ElButton size="small" @click="setServiceReview('rejected')">审核驳回</ElButton><ElButton size="small" @click="setServiceReview('offline')">运营下架</ElButton></div>
            <div class="demo-grid"><ElButton size="small" @click="customerOrder">客户下单</ElButton></div>
            <select v-model="demoOrder" class="demo-select"><option value="">选择订单</option><option v-for="o in commerce.data.orders" :key="o.id" :value="o.id">{{o.id}} · {{o.status}}</option></select>
            <div class="demo-grid"><ElButton size="small" @click="orderCallback('pay')">客户支付</ElButton><ElButton size="small" @click="orderCallback('contract-yes')">确认合同</ElButton><ElButton size="small" @click="orderCallback('contract-no')">驳回合同</ElButton><ElButton size="small" @click="orderCallback('accept-yes')">验收通过</ElButton><ElButton size="small" @click="orderCallback('accept-no')">验收驳回</ElButton><ElButton size="small" @click="orderCallback('refund')">客户退款</ElButton><ElButton size="small" @click="customerReview(false)">客户初评</ElButton><ElButton size="small" @click="customerReview(true)">客户追评</ElButton></div>
            <select v-model="demoRefund" class="demo-select"><option value="">选择进行中退款单</option><option v-for="x in commerce.data.refunds.filter(r=>commerce.activeRefund(r.orderId)?.id===r.id)" :key="x.id" :value="x.id">{{x.id.slice(0,8)}} · {{x.status}}</option></select>
            <div class="demo-grid"><ElButton size="small" @click="refundCallback('accept')">客户同意改价</ElButton><ElButton size="small" @click="refundCallback('decline')">客户拒绝改价</ElButton><ElButton size="small" @click="refundCallback('cancel')">客户取消退款</ElButton></div>
            <div class="demo-grid"><ElButton size="small" @click="invoiceCallback('issued')">平台票成功</ElButton><ElButton size="small" @click="invoiceCallback('failed')">平台票失败</ElButton><ElButton size="small" @click="invoiceCallback('returned')">平台退票</ElButton></div>
          </section>

          <section class="sec">
            <h3><GitCompare :size="13" /> 分屏对比</h3>
            <div class="switch-row">
              <span>
                <strong>左右对比模式</strong>
                <small>左：V0.9 原型参考 · 右：当前版本</small>
              </span>
              <ElSwitch
                :model-value="acc.compareMode"
                size="small"
                @update:model-value="acc.toggleCompare(Boolean($event))"
              />
            </div>
          </section>

          <section class="sec">
            <h3><ListChecks :size="13" /> 验收清单 <em>{{ issueCount }}</em></h3>
            <form class="issue-form" @submit.prevent="submitIssue">
              <input
                v-model="draft"
                type="text"
                placeholder="记录一条验收问题…"
                maxlength="120"
                aria-label="验收问题"
              />
              <ElButton type="primary" :icon="Plus" aria-label="添加" @click="submitIssue" />
            </form>

            <ul v-if="issueCount" class="issue-list">
              <li v-for="i in acc.issues" :key="i.id">
                <span class="lvl" :class="i.level">{{ levelText[i.level as keyof typeof levelText] }}</span>
                <div class="issue-body">
                  <p>{{ i.content }}</p>
                  <time>{{ i.createdAt }}</time>
                </div>
                <ElButton text circle size="small" aria-label="删除" @click="acc.removeIssue(i.id)">
                  <Trash2 :size="13" />
                </ElButton>
              </li>
            </ul>
            <p v-else class="issue-empty">暂无问题。切换上方状态验收各态，发现问题点这里记录。</p>

            <ElButton size="small" style="width: 100%" :disabled="!issueCount" @click="copyIssues">
              <Copy :size="13" style="margin-right: 6px" />
              {{ copied ? '已复制到剪贴板' : '导出清单' }}
            </ElButton>
          </section>
        </div>
      </div>
    </transition>

    <template v-if="acc.compareMode">
      <div class="compare-banner">分屏对比 · 左 V0.9 原型 / 右 V1.0 当前</div>
      <div class="compare-left" aria-hidden="true">
        <div class="compare-label">V0.9 原型</div>
        <div class="compare-frame">
          <WorkspaceProto />
        </div>
      </div>
      <div class="compare-divider" />
    </template>
  </div>
</template>

<script lang="ts">
import WorkspaceProto from '@/components/workspace/WorkspaceProto.vue'
export default { components: { WorkspaceProto } }
</script>

<style scoped>
.dock {
  position: fixed;
  z-index: 90;
}
.demo-grid{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}.demo-grid :deep(.el-button){margin:0;border-radius:7px}.demo-select{width:100%;height:30px;margin-top:7px;padding:0 7px;border:1px solid #d8e1ef;border-radius:7px;background:#fff;color:#354862;font-size:12px}
.publish-steps :deep(.el-button){flex:1;min-width:0}

.dock-close {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  background: #fff;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-md);
}
.fab:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}
.dock.open .fab {
  background: var(--bg-muted);
}
.fab-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--r-pill);
  background: var(--status-danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: grid;
  place-items: center;
  border: 1.5px solid #fff;
}

.panel {
  position: absolute;
  width: min(340px, calc(100vw - 24px));
  background: #fff;
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-light);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: var(--text-primary);
}
.panel-body {
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sec h3 {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.03em;
  display: flex;
  align-items: center;
  gap: 5px;
}
.sec h3 em {
  font-style: normal;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--r-pill);
  background: var(--brand);
  color: #fff;
  font-size: 10.5px;
  display: grid;
  place-items: center;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.version-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-light);
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color var(--t-fast), background var(--t-fast);
}
.version-item:hover {
  border-color: var(--border-strong);
}
.version-item.active {
  border-color: var(--brand);
  background: var(--brand-soft);
}
.v-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-strong);
  flex-shrink: 0;
}
.version-item.active .v-dot {
  background: var(--brand);
}
.v-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
.v-text strong {
  font-size: 13px;
  color: var(--text-primary);
}
.v-text small {
  font-size: 11.5px;
  color: var(--text-secondary);
}
.v-check {
  color: var(--brand);
  flex-shrink: 0;
}

.seg {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  background: var(--bg-chip);
  padding: 3px;
  border-radius: var(--r-sm);
}
.seg-btn {
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast);
}
.seg-btn:hover {
  color: var(--text-primary);
}
.seg-btn.active {
  background: #fff;
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.demo-hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-placeholder);
}
.switch-row > span:first-child {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}
.switch-row strong {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}
.switch-row small {
  font-size: 11.5px;
  color: var(--text-secondary);
}

.issue-form {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.issue-form input {
  flex: 1;
  min-width: 0;
  height: 32px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  padding: 0 10px;
  font-size: 13px;
  color: var(--text-primary);
  background: #fff;
  outline: none;
  transition: border-color var(--t-fast), box-shadow var(--t-fast);
}
.issue-form input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px var(--brand-soft);
}
.issue-form input::placeholder {
  color: var(--text-placeholder);
}

.issue-list {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 160px;
  overflow-y: auto;
}
.issue-list li {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  padding: 8px;
  background: var(--bg-muted);
  border: 1px solid var(--border-lighter);
  border-radius: var(--r-sm);
}
.lvl {
  flex-shrink: 0;
  height: 18px;
  padding: 0 6px;
  border-radius: 5px;
  font-size: 10.5px;
  font-weight: 700;
  display: grid;
  place-items: center;
}
.lvl.high { background: var(--status-danger-soft); color: var(--status-danger); }
.lvl.mid { background: var(--status-warning-soft); color: var(--status-warning); }
.lvl.low { background: var(--brand-soft); color: var(--brand); }
.issue-body {
  flex: 1;
  min-width: 0;
}
.issue-body p {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-regular);
  line-height: 1.45;
  word-break: break-word;
}
.issue-body time {
  font-size: 11px;
  color: var(--text-placeholder);
}
.issue-empty {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--text-placeholder);
  line-height: 1.5;
  padding: 10px;
  background: var(--bg-muted);
  border-radius: var(--r-sm);
}

/* 微动效：快、小位移 */
.panel-enter-active,
.panel-leave-active {
  transition: opacity var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out);
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.compare-banner {
  position: fixed;
  top: calc(var(--topbar-h) + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 90;
  background: #1f2329;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 7px;
  box-shadow: var(--shadow-md);
  pointer-events: none;
}
.compare-divider {
  position: fixed;
  top: var(--topbar-h);
  bottom: 0;
  left: 50%;
  width: 2px;
  background: var(--brand);
  z-index: 70;
  transform: translateX(-50%);
  pointer-events: none;
  opacity: 0.85;
}
.compare-left {
  position: fixed;
  top: var(--topbar-h);
  left: 0;
  width: 50%;
  bottom: 0;
  z-index: 65;
  background: var(--bg-page);
  overflow: hidden;
  pointer-events: none;
}
.compare-label {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 2;
  background: #fff;
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 5px;
}
.compare-frame {
  width: 200%;
  height: 100%;
  overflow: hidden;
}
</style>
