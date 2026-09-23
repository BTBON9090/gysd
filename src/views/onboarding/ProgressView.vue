<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileClock, RotateCcw, XCircle } from 'lucide-vue-next'
import OnboardingShell from '@/components/onboarding/OnboardingShell.vue'
import { useOnboardingStore } from '@/stores/onboarding'
import { useAcceptanceStore } from '@/stores/acceptance'

const router = useRouter()
const ob = useOnboardingStore()
const acc = useAcceptanceStore()
const state = computed(() => ({
  draft: { title: '入驻资料待提交', summary: '资料尚未提交审核，继续填写后可进入园区运营审核。', icon: FileClock },
  reviewing: { title: '入驻申请审核中', summary: '申请已提交，园区运营正在核验。审核期间资料只读，不可取消入驻。', icon: Clock3 },
  rejected: { title: '入驻申请已驳回', summary: '请依据审核意见修改资料，完成后重新提交。', icon: XCircle },
  approved: { title: '入驻审核已通过', summary: '服务商入驻已完成，可以进入供应商工作台。', icon: CheckCircle2 },
}[ob.status]))

function resume() {
  router.push(`/onboarding/step/${Math.max(1, Math.min(5, ob.maxStep))}`)
}

async function cancel() {
  if (ob.status !== 'rejected') return
  try {
    await ElMessageBox.confirm('确认后将删除本次入驻申请，是否继续？', '取消入驻', {
      customClass: 'ob-confirm-box',
      type: 'warning', confirmButtonText: '确认取消', cancelButtonText: '返回',
    })
    ob.resetDraft()
    acc.setEntryStatus('pending')
    ElMessage.success('已取消入驻')
    router.replace('/onboarding')
  } catch { /* 用户保留申请 */ }
}

function review(result: 'rejected' | 'approved') {
  ob.simulateReview(result)
  acc.setEntryStatus(result === 'approved' ? 'approved' : 'pending')
  ElMessage.success(result === 'approved' ? '演示：审核已通过' : '演示：审核已驳回')
}
</script>

<template>
  <OnboardingShell :show-steps="false" :show-footer="false">
    <div class="progress-page">
      <button class="back-link" type="button" @click="router.push('/onboarding')"><ArrowLeft :size="15" /> 入驻首页</button>
      <div class="page-intro">
        <div>
          <p class="eyebrow">服务商入驻 / 进度查询</p>
          <h1>入驻进度查询</h1>
          <p>查看申请状态、审核意见和下一步操作。</p>
        </div>
        <span class="status-label" :class="ob.status">{{ { draft: '待提交', reviewing: '审核中', rejected: '已驳回', approved: '已通过' }[ob.status] }}</span>
      </div>

      <section class="hero" :class="ob.status">
        <div class="hero-icon"><component :is="state.icon" :size="26" :stroke-width="1.8" /></div>
        <div class="hero-copy">
          <h2>{{ state.title }}</h2>
          <p>{{ state.summary }}</p>
          <div v-if="ob.status === 'rejected' && ob.events[0]?.opinion" class="opinion">
            <strong>最新审核意见</strong>
            <span>{{ ob.events[0].opinion }}</span>
          </div>
          <div class="hero-actions">
            <ElButton v-if="ob.status === 'draft'" type="primary" @click="resume">继续填写 <ArrowRight :size="15" /></ElButton>
            <template v-if="ob.status === 'rejected'">
              <ElButton type="primary" @click="resume">修改后重新提交 <ArrowRight :size="15" /></ElButton>
              <ElButton @click="cancel">取消入驻</ElButton>
            </template>
          </div>
        </div>
      </section>

      <div class="detail-grid">
        <section class="surface">
          <div class="surface-head"><span class="index">01</span><h2>申请主体</h2></div>
          <dl class="facts">
            <div><dt>主体名称</dt><dd>{{ ob.draft.entityName || '—' }}</dd></div>
            <div><dt>申请园区</dt><dd>{{ ob.draft.park || '—' }}</dd></div>
            <div><dt>入驻身份</dt><dd>服务商</dd></div>
            <div><dt>证件号码</dt><dd>{{ ob.draft.creditCode || '—' }}</dd></div>
          </dl>
        </section>
        <section class="surface">
          <div class="surface-head"><span class="index">02</span><h2>审核进度</h2></div>
          <ol v-if="ob.events.length" class="timeline">
            <li v-for="(event, i) in ob.events" :key="`${event.at}-${i}`">
              <span class="timeline-dot" :class="event.status" />
              <div><strong>{{ event.action }}</strong><time>{{ event.at }}</time></div>
              <p>{{ event.actor }}<template v-if="event.opinion"> · {{ event.opinion }}</template></p>
            </li>
          </ol>
          <div v-else class="no-events"><FileClock :size="20" /><span>提交申请后，这里会显示审核记录。</span></div>
        </section>
      </div>

      <section v-if="ob.status === 'reviewing'" class="demo-panel">
        <div><span class="demo-mark">演示工具</span><strong>模拟园区运营审核结果</strong><p>仅修改本地演示状态，用于查看驳回重提与通过后的页面。</p></div>
        <div class="demo-actions"><ElButton @click="review('rejected')"><RotateCcw :size="14" /> 模拟驳回</ElButton><ElButton @click="review('approved')"><CheckCircle2 :size="14" /> 模拟通过</ElButton></div>
      </section>
    </div>
  </OnboardingShell>
</template>

<style scoped>
.progress-page{max-width:940px;margin:auto;padding:14px 0 60px}.back-link{display:flex;align-items:center;gap:6px;border:0;background:none;color:var(--text-secondary);font-size:13px;cursor:pointer;padding:0;margin:0 0 26px}.back-link:hover{color:var(--brand)}.page-intro{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.eyebrow{margin:0 0 6px;color:var(--brand);font-size:12px;font-weight:700;letter-spacing:.08em}.page-intro h1{margin:0;color:var(--text-primary);font-size:28px;letter-spacing:-.02em}.page-intro p:last-child{margin:6px 0 0;color:var(--text-secondary);font-size:14px}.status-label{padding:6px 12px;border-radius:999px;background:#f1f3f5;color:#5b6470;font-size:12px;font-weight:700}.status-label.reviewing{background:#fff3de;color:#9a5a00}.status-label.rejected{background:#fff0ed;color:#b53b32}.status-label.approved{background:#eaf6ee;color:#247449}.hero{display:flex;gap:22px;padding:28px 30px;border-radius:18px;background:#fff;border:1px solid var(--border-light);box-shadow:var(--shadow-sm)}.hero.reviewing{border-top:4px solid #d88922}.hero.rejected{border-top:4px solid #ce5447}.hero.approved{border-top:4px solid #2a9b60}.hero.draft{border-top:4px solid var(--brand)}.hero-icon{width:54px;height:54px;border-radius:15px;display:grid;place-items:center;flex:none;background:#eef2fc;color:var(--brand)}.reviewing .hero-icon{background:#fff3de;color:#bd7110}.rejected .hero-icon{background:#fff0ed;color:#c5483e}.approved .hero-icon{background:#eaf6ee;color:#298453}.hero-copy{flex:1;min-width:0}.hero h2{margin:1px 0 7px;font-size:22px;color:var(--text-primary)}.hero p{margin:0;color:var(--text-secondary);line-height:1.7}.hero-actions{display:flex;gap:8px;margin-top:20px}.hero-actions :deep(.el-button){min-height:38px}.hero-actions :deep(svg){margin-left:6px}.opinion{display:flex;flex-direction:column;gap:4px;margin-top:18px;padding:13px 15px;border-radius:10px;background:#fff5f2;color:#9e3a31;font-size:13px}.opinion strong{font-size:12px}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}.surface{background:#fff;border:1px solid var(--border-light);border-radius:16px;padding:22px 24px;min-height:260px}.surface-head{display:flex;gap:10px;align-items:center;border-bottom:1px solid var(--border-light);padding-bottom:14px;margin-bottom:16px}.surface-head .index{font-size:12px;font-weight:700;color:var(--brand)}.surface-head h2{font-size:16px;margin:0;color:var(--text-primary)}.facts{margin:0}.facts div{display:grid;grid-template-columns:90px 1fr;gap:14px;padding:9px 0;font-size:13px}.facts dt{color:var(--text-placeholder)}.facts dd{margin:0;color:var(--text-primary);overflow-wrap:anywhere}.timeline{list-style:none;margin:0;padding:0 0 0 6px}.timeline li{position:relative;border-left:1px solid #dce2ea;padding:0 0 24px 19px}.timeline li:last-child{padding-bottom:0;border-color:transparent}.timeline-dot{position:absolute;left:-5px;top:3px;width:9px;height:9px;border-radius:50%;background:var(--brand)}.timeline-dot.rejected{background:#ce5447}.timeline-dot.approved{background:#2a9b60}.timeline li>div{display:flex;justify-content:space-between;gap:12px;align-items:start}.timeline strong{font-size:13px;color:var(--text-primary)}.timeline time{font-size:11px;color:var(--text-placeholder);white-space:nowrap}.timeline p{margin:5px 0 0;font-size:12px;color:var(--text-secondary);line-height:1.6}.no-events{display:flex;align-items:center;gap:10px;color:var(--text-placeholder);font-size:13px;padding:14px 0}.demo-panel{margin-top:18px;padding:18px 22px;background:#f3f5f8;border:1px dashed #c9d0db;border-radius:14px;display:flex;justify-content:space-between;align-items:center;gap:20px}.demo-panel strong{font-size:13px;color:var(--text-primary);margin-left:9px}.demo-panel p{font-size:12px;color:var(--text-secondary);margin:5px 0 0}.demo-mark{display:inline-block;color:#687383;border:1px solid #c9d0db;border-radius:4px;font-size:10px;padding:1px 5px}.demo-actions{display:flex;gap:7px;flex:none}@media(max-width:780px){.detail-grid{grid-template-columns:1fr}.demo-panel{align-items:flex-start;flex-direction:column}}
</style>
