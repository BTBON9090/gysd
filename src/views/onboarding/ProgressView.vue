<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Check, CheckCircle2, Clock3, FileClock, RotateCcw, X } from 'lucide-vue-next'
import OnboardingShell from '@/components/onboarding/OnboardingShell.vue'
import { useOnboardingStore } from '@/stores/onboarding'
import { useAcceptanceStore } from '@/stores/acceptance'

const router = useRouter()
const ob = useOnboardingStore()
const acc = useAcceptanceStore()
const state = computed(() => ({
  draft: { label: '待提交', title: '入驻资料待提交', summary: '资料尚未提交审核，继续填写后可进入园区运营审核。', icon: FileClock },
  reviewing: { label: '审核中', title: '入驻申请审核中', summary: '申请已提交，园区运营正在核验。审核期间资料只读，不可取消入驻。', icon: Clock3 },
  rejected: { label: '已驳回', title: '入驻申请已驳回', summary: '请依据下方审核意见修改资料，完成后重新提交。', icon: X },
  approved: { label: '已通过', title: '入驻审核已通过', summary: '服务商入驻已完成，可以在左侧导航继续使用供应商工作台。', icon: Check },
}[ob.status]))

function resume() {
  router.push(`/onboarding/step/${Math.max(1, Math.min(5, ob.maxStep))}`)
}

async function cancel() {
  if (ob.status !== 'rejected') return
  try {
    await ElMessageBox.confirm('确认后将删除本次入驻申请，是否继续？', '取消入驻', {
      customClass: 'ob-confirm-box', type: 'warning', confirmButtonText: '确认取消', cancelButtonText: '返回',
    })
    ob.resetDraft()
    const active = ob.applications.find(item => item.id === ob.activeId)
    acc.setEntryStatus(active?.status === 'approved' ? 'approved' : 'pending')
    ElMessage.success('已取消入驻')
    router.replace('/workspace')
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
    <div class="progress-page" :class="ob.status">
      <header class="page-intro">
        <p class="eyebrow">服务商入驻 <span>/</span> 进度查询</p>
        <h1>入驻进度查询</h1>
        <p class="page-subtitle">查看申请状态、审核意见和下一步操作。</p>
      </header>

      <section class="status-stage">
        <div class="status-symbol"><component :is="state.icon" :size="30" :stroke-width="2" /></div>
        <div class="status-content">
          <span class="status-label"><span class="status-dot" />{{ state.label }}</span>
          <h2>{{ state.title }}</h2>
          <p>{{ state.summary }}</p>
          <div v-if="ob.status === 'rejected' && ob.events[0]?.opinion" class="opinion">
            <strong>最新审核意见</strong>
            <p>{{ ob.events[0].opinion }}</p>
          </div>
          <div v-if="ob.status === 'draft' || ob.status === 'rejected'" class="status-actions">
            <ElButton v-if="ob.status === 'draft'" type="primary" @click="resume">继续填写 <ArrowRight :size="15" /></ElButton>
            <template v-if="ob.status === 'rejected'">
              <ElButton type="primary" @click="resume">修改后重新提交 <ArrowRight :size="15" /></ElButton>
              <ElButton @click="cancel">取消入驻</ElButton>
            </template>
          </div>
        </div>
      </section>

      <div class="detail-grid">
        <section class="detail-section">
          <h2>申请主体</h2>
          <dl class="facts">
            <div><dt>主体名称</dt><dd>{{ ob.draft.entityName || '—' }}</dd></div>
            <div><dt>申请园区</dt><dd>{{ ob.draft.park || '—' }}</dd></div>
            <div><dt>入驻身份</dt><dd>服务商</dd></div>
            <div><dt>证件号码</dt><dd>{{ ob.draft.creditCode || '—' }}</dd></div>
          </dl>
        </section>
        <section class="detail-section">
          <h2>审核进度</h2>
          <ol v-if="ob.events.length" class="timeline">
            <li v-for="(event, i) in ob.events" :key="`${event.at}-${i}`" :class="event.status">
              <span class="timeline-dot" />
              <div class="event-head"><strong>{{ event.action }}</strong><time>{{ event.at }}</time></div>
              <p class="event-actor">{{ event.actor }}</p>
              <p v-if="event.opinion" class="event-opinion">{{ event.opinion }}</p>
            </li>
          </ol>
          <div v-else class="no-events"><FileClock :size="18" /><span>提交申请后，这里会显示审核记录。</span></div>
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
.progress-page{--state:#3656c5;--state-dark:#2945aa;--state-soft:#eef2ff;max-width:940px;margin:auto;padding:4px 0 68px}
.progress-page.reviewing{--state:#bf7312;--state-dark:#8d5208;--state-soft:#fff2dc}
.progress-page.rejected{--state:#ce483f;--state-dark:#a72e28;--state-soft:#fff0ec}
.progress-page.approved{--state:#12946d;--state-dark:#087654;--state-soft:#e7f7f0}
.page-intro{margin-bottom:25px}.eyebrow{margin:0 0 9px;color:#3656c5;font-size:12px;font-weight:700}.eyebrow span{margin:0 7px;color:#a9b5c7}.page-intro h1{margin:0;color:#17233b;font-size:27px;letter-spacing:-.025em}.page-subtitle{margin:7px 0 0;color:#586880;font-size:14px}
.status-stage{display:flex;gap:23px;align-items:flex-start;padding:30px 34px;border:1px solid #e4eaf1;border-radius:16px;background:linear-gradient(130deg,var(--state-soft) 0%,#fff 78%);box-shadow:0 6px 24px rgba(23,35,59,.045)}
.status-symbol{width:53px;height:53px;display:grid;place-items:center;flex:none;border-radius:12px;background:var(--state);color:#fff}
.status-content{flex:1;min-width:0}.status-label{display:inline-flex;align-items:center;gap:7px;color:var(--state-dark);font-size:12px;font-weight:750}.status-dot{width:7px;height:7px;border-radius:50%;background:var(--state)}.status-content h2{margin:8px 0 7px;color:var(--state-dark);font-size:25px;line-height:1.35;letter-spacing:-.02em}.status-content>p{margin:0;color:#40516b;font-size:14px;line-height:1.65}.status-actions{display:flex;gap:9px;margin-top:20px}.status-actions :deep(.el-button){height:37px;border-radius:8px}.status-actions :deep(svg){margin-left:4px}
.opinion{max-width:670px;margin-top:19px;padding:12px 15px;background:#fff;border-left:3px solid var(--state);box-shadow:0 3px 17px rgba(89,39,35,.065)}.opinion strong{display:block;color:var(--state-dark);font-size:12px}.opinion p{margin:5px 0 0;color:#633e3a;font-size:13px;line-height:1.6}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:38px;margin-top:32px}.detail-section{min-width:0}.detail-section h2{margin:0 0 15px;color:#1b2b45;font-size:16px;font-weight:750}
.facts{margin:0}.facts div{display:grid;grid-template-columns:83px minmax(0,1fr);gap:10px;padding:7px 0;font-size:13px;line-height:1.5}.facts dt{color:#62718a}.facts dd{margin:0;color:#20304a;font-weight:550;overflow-wrap:anywhere}
.timeline{list-style:none;margin:0;padding:1px 0 0 5px}.timeline li{position:relative;margin:0;padding:0 0 15px 18px;border-left:1px solid #dce4ee}.timeline li:last-child{padding-bottom:0;border-left-color:transparent}.timeline-dot{position:absolute;left:-5px;top:4px;width:9px;height:9px;border-radius:50%;background:#3656c5}.timeline li.rejected .timeline-dot{background:#ce483f}.timeline li.approved .timeline-dot{background:#12946d}.event-head{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.event-head strong{color:#20304a;font-size:13px}.event-head time{flex:none;color:#738198;font-size:11px}.event-actor{margin:4px 0 0;color:#65738a;font-size:12px}.event-opinion{margin:5px 0 0;color:#46566e;font-size:12px;line-height:1.5}.no-events{display:flex;gap:9px;align-items:center;color:#738198;font-size:13px;padding:2px 0}
.demo-panel{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:35px;padding:0}.demo-panel strong{margin-left:8px;color:#34425a;font-size:13px}.demo-panel p{margin:5px 0 0;color:#68778e;font-size:12px}.demo-mark{padding:2px 5px;border-radius:4px;background:#f0f3f8;color:#69778b;font-size:10px}.demo-actions{display:flex;gap:7px;flex:none}.demo-actions :deep(.el-button){height:34px;border-radius:7px}
@media(max-width:780px){.detail-grid{grid-template-columns:1fr;gap:24px}.demo-panel{align-items:flex-start;flex-direction:column}}
@media(max-width:520px){.status-stage{gap:14px;padding:23px 19px}.status-symbol{width:45px;height:45px}.status-content h2{font-size:21px}.event-head{display:block}.event-head time{display:block;margin-top:3px}.status-actions{flex-wrap:wrap}}
</style>
